# api/petfinder.py
import os
import requests
from dotenv import load_dotenv
from models.pet import Pet

load_dotenv()

class PetFinderAPI:
    BASE_URL = "https://api.petfinder.com/v2"

    def __init__(self, api_key=None, secret=None):
        self.api_key = api_key or os.getenv("PETFINDER_API_KEY")
        self.secret = secret or os.getenv("PETFINDER_API_SECRET")
        self.access_token = None
        self.mock_mode = not (self.api_key and self.secret)

    def _get_token(self):
        r = requests.post(
            f"{self.BASE_URL}/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": self.api_key,
                "client_secret": self.secret,
            },
            timeout=10,
        )
        r.raise_for_status()
        self.access_token = r.json()["access_token"]

    def _auth_headers(self):
        if not self.access_token:
            self._get_token()
        return {"Authorization": f"Bearer {self.access_token}"}

    def _mock_pets(self, animal_type: str | None):
        pets = [
            Pet(1, "Buddy", "Dog", "Labrador Retriever", "Adult", "shelter@email.com",
                "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"),
            Pet(2, "Luna", "Cat", "Domestic Shorthair", "Adult", "adopt@happytails.org",
                "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400"),
            Pet(3, "Max", "Dog", "Poodle Mix", "Baby", "hello@sunshinerescue.org",
                "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400"),
        ]
        if animal_type:
            pets = [p for p in pets if p.pet_type.lower() == animal_type.lower()]
        return pets

    def search_animals(
        self,
        animal_type="dog",
        location="10001",
        age=None,
        breed=None,
        size=None,
        gender=None,
        page=1,
        per_page=24,
        as_dict: bool = False,   # <<<<<< สำคัญ: ค่าเริ่มต้น False เพื่อให้เทสต์ได้ list
    ):
        # ---------- MOCK ----------
        if self.mock_mode:
            pets = self._mock_pets(animal_type)
            if as_dict:
                return {
                    "items": pets, "page": 1, "total_pages": 1,
                    "per_page": len(pets), "count": len(pets)
                }
            return pets

        # ---------- REAL API ----------
        try:
            params = {"page": max(int(page), 1), "limit": min(int(per_page), 100)}
            if animal_type: params["type"] = animal_type
            if location: params["location"] = location
            if age: params["age"] = age
            if breed: params["breed"] = breed
            if size: params["size"] = size
            if gender: params["gender"] = gender

            resp = requests.get(
                f"{self.BASE_URL}/animals",
                headers=self._auth_headers(),
                params=params,
                timeout=10,
            )
            if resp.status_code == 401:
                self._get_token()
                resp = requests.get(
                    f"{self.BASE_URL}/animals",
                    headers=self._auth_headers(),
                    params=params,
                    timeout=10,
                )
            resp.raise_for_status()
            payload = resp.json()

            animals = payload.get("animals", [])
            pets = []
            for it in animals:
                photo = None
                if it.get("photos"):
                    p0 = it["photos"][0]
                    photo = p0.get("medium") or p0.get("large")

                contact = it.get("contact") or {}
                email = contact.get("email") or "Contact shelter"
                phone = contact.get("phone") or None

                gender_v = it.get("gender") or None
                size_v = it.get("size") or None
                desc = it.get("description") or None
                breed_primary = (it.get("breeds") or {}).get("primary") or "Mixed"

                pets.append(
                    Pet(
                        pet_id=it.get("id"),
                        name=it.get("name", "Unknown"),
                        pet_type=it.get("type") or "Pet",
                        breed=breed_primary,
                        age=it.get("age", "Unknown"),
                        contact=email,
                        photo_url=photo or "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
                        phone=phone,
                        gender=gender_v,
                        size=size_v,
                        description=desc,
                    )
                )

            pg = payload.get("pagination", {})
            current_page = pg.get("current_page", params["page"])
            total_pages = pg.get("total_pages", 1)

            if as_dict:
                return {
                    "items": pets,
                    "page": current_page,
                    "total_pages": total_pages,
                    "per_page": params["limit"],
                    "count": len(pets),
                }
            return pets

        except Exception as e:
            print(f"[Petfinder] fallback MOCK (error={e})")
            pets = self._mock_pets(animal_type)
            if as_dict:
                return {
                    "items": pets, "page": 1, "total_pages": 1,
                    "per_page": len(pets), "count": len(pets)
                }
            return pets

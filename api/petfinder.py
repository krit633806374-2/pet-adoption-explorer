import requests
from models.pet import Pet
import os

class PetFinderAPI:
    BASE_URL = "https://api.petfinder.com/v2"
    
    def __init__(self, api_key=None, secret=None):
        self.api_key = api_key
        self.secret = secret
        self.access_token = None
        
        # If credentials provided, get access token
        if self.api_key and self.secret:
            self.get_access_token()

    def get_access_token(self):
        """
        Get OAuth2 access token from Petfinder API
        """
        try:
            auth_url = f"{self.BASE_URL}/oauth2/token"
            data = {
                "grant_type": "client_credentials",
                "client_id": self.api_key,
                "client_secret": self.secret
            }
            
            response = requests.post(auth_url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data.get("access_token")
            print(f"✅ Successfully obtained access token")
            
        except Exception as e:
            print(f"❌ Error getting access token: {e}")
            self.access_token = None

    def search_animals(self, animal_type="dog", location="New York", age=None, breed=None, size=None, gender=None):
        """
        Search animals from Petfinder API
        If no access token, return enhanced mock data
        """
        if not self.access_token:
            # Enhanced mock response with more variety
            mock_pets = [
                Pet(1, "Buddy", "Dog", "Labrador Retriever", "Adult", "shelter@email.com", 
                    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400", 
                    "02-123-4567", "Male", "Large", "Buddy เป็นสุนัขที่ร่าเริงและเป็นมิตรมาก รักการเล่นกับเด็กๆ"),
                Pet(2, "Mittens", "Cat", "Siamese", "Young", "catlover@shelter.org", 
                    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400", 
                    "02-234-5678", "Female", "Medium", "Mittens เป็นแมวที่สวยงามและสงบ ชอบการลูบไล้"),
                Pet(3, "Charlie", "Dog", "Golden Retriever", "Senior", "rescue@doghouse.org", 
                    "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400", 
                    "02-345-6789", "Male", "Large", "Charlie เป็นสุนัขอายุมากที่เต็มไปด้วยความรักและความอ่อนโยน"),
                Pet(4, "Luna", "Cat", "Persian", "Adult", "catrescue@email.com", 
                    "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400", 
                    "02-456-7890", "Female", "Medium", "Luna เป็นแมวเปอร์เซียที่สวยงามและนุ่มนวล"),
                Pet(5, "Max", "Dog", "German Shepherd", "Young", "germanrescue@shelter.com", 
                    "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400", 
                    "02-567-8901", "Male", "Large", "Max เป็นสุนัขที่ฉลาดและซื่อสัตย์ เหมาะสำหรับเป็นสุนัขเฝ้าบ้าน"),
                Pet(6, "Whiskers", "Cat", "Maine Coon", "Adult", "mainecoon@rescue.org", 
                    "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400", 
                    "02-678-9012", "Female", "Large", "Whiskers เป็นแมวเมนคูนที่มีขนาดใหญ่และใจดี"),
                Pet(7, "Rocky", "Dog", "Bulldog", "Adult", "bulldog@shelter.net", 
                    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400", 
                    "02-789-0123", "Male", "Medium", "Rocky เป็นสุนัขบูลด็อกที่แข็งแรงและรักครอบครัว"),
                Pet(8, "Bella", "Cat", "Tabby", "Young", "tabby@catrescue.org", 
                    "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400", 
                    "02-890-1234", "Female", "Small", "Bella เป็นแมวลายที่ซุกซนและน่ารัก")
            ]
            
            # Filter mock data based on animal type
            if animal_type:
                filtered_pets = [pet for pet in mock_pets if pet.pet_type.lower() == animal_type.lower()]
            else:
                filtered_pets = mock_pets  # Return all pets if no type specified
            return filtered_pets[:12]  # Return up to 12 pets

        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            params = {
                "location": location, 
                "limit": 20,
                "page": 1
            }
            
            if animal_type:  # Only add type if specified
                params["type"] = animal_type
            if age:
                params["age"] = age
            if breed:
                params["breed"] = breed
            if size:
                params["size"] = size
            if gender:
                params["gender"] = gender

            response = requests.get(f"{self.BASE_URL}/animals", headers=headers, params=params)
            
            print(f"🔍 Search URL: {response.url}")
            print(f"📊 Response Status: {response.status_code}")
            
            if response.status_code == 401:
                print("🔑 Access token expired, getting new token...")
                self.get_access_token()
                if self.access_token:
                    headers["Authorization"] = f"Bearer {self.access_token}"
                    response = requests.get(f"{self.BASE_URL}/animals", headers=headers, params=params)
            
            response.raise_for_status()
            data = response.json()
            
            print(f"📈 Found {len(data.get('animals', []))} pets")

            pets = []
            for item in data.get("animals", []):
                contact_email = None
                if item.get("contact"):
                    contact_email = item["contact"].get("email")
                
                photo_url = None
                if item.get("photos") and len(item["photos"]) > 0:
                    photo_url = item["photos"][0].get("medium") or item["photos"][0].get("large")
                
                pets.append(
                    Pet(
                        pet_id=item["id"],
                        name=item.get("name", "Unknown"),
                        pet_type=item.get("type", animal_type),
                        breed=item["breeds"]["primary"] if item.get("breeds") else "Mixed",
                        age=item.get("age", "Unknown"),
                        contact=contact_email or "Contact shelter directly",
                        photo_url=photo_url or f"https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"
                    )
                )
            return pets
            
        except Exception as e:
            print(f"❌ API Error: {e}")
            # Return enhanced mock data as fallback
            mock_pets = [
                Pet(1, "Buddy", "Dog", "Labrador Retriever", "Adult", "shelter@email.com", "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"),
                Pet(2, "Mittens", "Cat", "Siamese", "Young", "catlover@shelter.org", "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400"),
                Pet(3, "Charlie", "Dog", "Golden Retriever", "Senior", "rescue@doghouse.org", "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400"),
                Pet(4, "Luna", "Cat", "Persian", "Adult", "catrescue@email.com", "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400")
            ]
            filtered_pets = [pet for pet in mock_pets if pet.pet_type.lower() == animal_type.lower()]
            return filtered_pets


# models/pet.py
from dataclasses import asdict, dataclass
from typing import Optional


@dataclass
class Pet:
    pet_id: str
    name: str
    pet_type: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[str] = None
    contact: Optional[str] = None
    photo_url: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    size: Optional[str] = None
    description: Optional[str] = None

    def to_dict(self):
        return asdict(self)

    def __str__(self):
        b = self.breed or "Mixed"
        a = self.age or "Unknown"
        return f"{self.name} ({b}, {a})"

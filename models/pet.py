class Pet:
    def __init__(self, pet_id, name, pet_type, breed, age, contact, photo_url=None, phone=None, gender=None, size=None, description=None):
        self.pet_id = pet_id
        self.name = name
        self.pet_type = pet_type
        self.breed = breed
        self.age = age
        self.contact = contact
        self.photo_url = photo_url
        self.phone = phone
        self.gender = gender
        self.size = size
        self.description = description

    def __str__(self):
        return f"{self.name} ({self.breed}, {self.age})"

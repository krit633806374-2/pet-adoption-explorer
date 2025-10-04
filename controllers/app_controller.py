from api.petfinder import PetFinderAPI
from data.persistance import PersistenceManager

class AppController:
    def __init__(self, api_key=None, secret=None):
        self.api = PetFinderAPI(api_key, secret)
        self.db = PersistenceManager()

    def search_pets(self, animal_type, location, age=None, breed=None):
        return self.api.search_animals(animal_type, location, age, breed)

    def save_favorite(self, pet):
        self.db.add_favorite(pet)

    def view_favorites(self):
        return self.db.get_favorites()

    def delete_favorite(self, pet_id):
        self.db.delete_favorite(pet_id)

    def export_favorites(self, file_name="favorites.json"):
        self.db.export_favorites(file_name)

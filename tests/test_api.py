import pytest
from api.petfinder import PetFinderAPI

def test_search_animals_mock():
    api = PetFinderAPI()  # no token = mock mode
    pets = api.search_animals("dog", "New York")
    assert len(pets) > 0
    assert pets[0].name is not None

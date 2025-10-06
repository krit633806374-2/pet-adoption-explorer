from data.persistence import PersistenceManager

from models.pet import Pet


def test_add_and_get_favorites(tmp_path):
    db_path = tmp_path / "test.db"
    pm = PersistenceManager(db_name=str(db_path))

    pet = Pet(1, "Buddy", "Dog", "Labrador", "Young", "test@email.com")
    pm.add_favorite(pet)

    favs = pm.get_favorites()
    assert len(favs) == 1
    assert favs[0][2] == "Buddy"

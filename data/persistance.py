import sqlite3
import json

class PersistenceManager:
    def __init__(self, db_name="pets.db"):
        self.conn = sqlite3.connect(db_name)
        self.create_table()

    def create_table(self):
        cursor = self.conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id TEXT,
            name TEXT,
            type TEXT,
            breed TEXT,
            age TEXT,
            contact TEXT,
            photo_url TEXT
        )
        """)
        self.conn.commit()

    def add_favorite(self, pet):
        cursor = self.conn.cursor()
        cursor.execute("INSERT INTO favorites (pet_id, name, type, breed, age, contact, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (pet.pet_id, pet.name, pet.pet_type, pet.breed, pet.age, pet.contact, pet.photo_url))
        self.conn.commit()

    def get_favorites(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM favorites")
        return cursor.fetchall()

    def delete_favorite(self, pet_id):
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM favorites WHERE pet_id=?", (pet_id,))
        self.conn.commit()

    def export_favorites(self, file_name="favorites.json"):
        data = []
        for fav in self.get_favorites():
            data.append({
                "id": fav[0],
                "pet_id": fav[1],
                "name": fav[2],
                "type": fav[3],
                "breed": fav[4],
                "age": fav[5],
                "contact": fav[6],
                "photo_url": fav[7]
            })
        with open(file_name, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

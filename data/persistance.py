# data/persistance.py
import sqlite3, csv, io, os
from typing import List, Dict, Any
from models.pet import Pet

DB_NAME = os.getenv(
    "PETS_DB_PATH",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "pets.db"))
)

class PersistenceManager:
    def __init__(self, db_name: str = DB_NAME):
        self.db_name = db_name
        self._init_db()

    def _conn(self):
        con = sqlite3.connect(self.db_name)
        con.row_factory = sqlite3.Row
        return con

    def _init_db(self):
        with self._conn() as con:
            # CREATE (ตอนสร้างตารางใหม่ ใส่ DEFAULT CURRENT_TIMESTAMP ได้)
            con.execute("""
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id TEXT UNIQUE,
                name TEXT NOT NULL,
                type TEXT,
                breed TEXT,
                age TEXT,
                contact TEXT,
                photo_url TEXT,
                phone TEXT,
                gender TEXT,
                size TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # ตรวจคอลัมน์ปัจจุบัน
            cols = {row["name"] for row in con.execute("PRAGMA table_info(favorites)").fetchall()}

            # รายการคอลัมน์ที่จำเป็น
            wanted = {
                "pet_id": "TEXT",
                "name": "TEXT",
                "type": "TEXT",
                "breed": "TEXT",
                "age": "TEXT",
                "contact": "TEXT",
                "photo_url": "TEXT",
                "phone": "TEXT",
                "gender": "TEXT",
                "size": "TEXT",
                "description": "TEXT",
                # หมายเหตุ: ถ้าเพิ่มภายหลังจะห้าม DEFAULT non-constant → เพิ่มเฉย ๆ
                "created_at": "TIMESTAMP"
            }

            # เติมคอลัมน์ที่ขาด (ALTER TABLE ไม่มี DEFAULT CURRENT_TIMESTAMP ได้)
            for col, ddl in wanted.items():
                if col not in cols:
                    con.execute(f"ALTER TABLE favorites ADD COLUMN {col} {ddl}")

            # เติมค่า created_at ให้แถวเก่าที่เป็น NULL
            con.execute("UPDATE favorites SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)")
            con.commit()

    # ---------- CRUD ----------
    def add_favorite(self, pet: Pet):
        """UPSERT รายการตาม pet_id กันซ้ำ"""
        with self._conn() as con:
            con.execute("""
                INSERT INTO favorites
                (pet_id, name, type, breed, age, contact, photo_url, phone, gender, size, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(pet_id) DO UPDATE SET
                    name=excluded.name,
                    type=excluded.type,
                    breed=excluded.breed,
                    age=excluded.age,
                    contact=excluded.contact,
                    photo_url=excluded.photo_url,
                    phone=excluded.phone,
                    gender=excluded.gender,
                    size=excluded.size,
                    description=excluded.description
            """, (
                pet.pet_id, pet.name, pet.pet_type, pet.breed, pet.age, pet.contact,
                pet.photo_url, pet.phone, pet.gender, pet.size, pet.description
            ))
            con.commit()

    def list_favorites(self) -> List[Dict[str, Any]]:
        with self._conn() as con:
            cur = con.execute("""
                SELECT pet_id as id, name, type, breed, age, contact, photo_url,
                       phone, gender, size, description, created_at
                FROM favorites
                ORDER BY created_at DESC, id DESC
            """)
            return [dict(r) for r in cur.fetchall()]

    def delete_favorite(self, pet_id: str):
        with self._conn() as con:
            con.execute("DELETE FROM favorites WHERE pet_id = ?", (pet_id,))
            con.commit()

    def export_csv_bytes(self) -> bytes:
        rows = self.list_favorites()
        out = io.StringIO()
        writer = csv.DictWriter(out, fieldnames=[
            "id","name","type","breed","age","gender","size","contact","phone","photo_url","description","created_at"
        ])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
        return out.getvalue().encode("utf-8")

# data/persistance.py
import csv
import io
import os
import sqlite3
from contextlib import contextmanager

# อ่าน env แล้วทำเป็น absolute path
_env_path = os.getenv("PETS_DB_PATH")
if not _env_path:
    # default: pets.db ในรากโปรเจกต์
    _env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pets.db")
DB_PATH = os.path.abspath(_env_path)

SCHEMA = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS favorites (
  id           TEXT PRIMARY KEY,
  name         TEXT,
  type         TEXT,
  breed        TEXT,
  age          TEXT,
  contact      TEXT,
  photo_url    TEXT,
  phone        TEXT,
  gender       TEXT,
  size         TEXT,
  description  TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_type  TEXT,
  location     TEXT,
  age          TEXT,
  size         TEXT,
  breed        TEXT,
  gender       TEXT,
  per_page     INTEGER,
  page         INTEGER,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""


class PersistenceManager:
    def __init__(self, db_path: str | None = None, db_name: str | None = None):
        chosen = db_name or db_path or DB_PATH
        self.db_path = os.path.abspath(chosen)
        self._ensure_db_dir()
        self._init_db()

    def _ensure_db_dir(self):
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    @contextmanager
    def _conn(self):
        con = sqlite3.connect(self.db_path, check_same_thread=False)
        con.row_factory = sqlite3.Row
        try:
            yield con
            con.commit()
        finally:
            con.close()

    def _init_db(self):
        with self._conn() as con:
            con.executescript(SCHEMA)

    # ---------- Favorites ----------
    def add_favorite(self, pet):
        with self._conn() as con:
            con.execute(
                """INSERT OR REPLACE INTO favorites
                (id, name, type, breed, age, contact, photo_url, phone, gender, size, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(pet.pet_id),
                    pet.name,
                    pet.pet_type,
                    pet.breed,
                    pet.age,
                    pet.contact,
                    pet.photo_url,
                    getattr(pet, "phone", None),
                    getattr(pet, "gender", None),
                    getattr(pet, "size", None),
                    getattr(pet, "description", None),
                ),
            )

    def list_favorites(self):
        with self._conn() as con:
            rows = con.execute(
                "SELECT * FROM favorites ORDER BY datetime(created_at) DESC"
            ).fetchall()
        return [dict(r) for r in rows]

    def delete_favorite(self, pet_id: str):
        with self._conn() as con:
            con.execute("DELETE FROM favorites WHERE id = ?", (str(pet_id),))

    def export_csv_bytes(self) -> bytes:
        rows = self.list_favorites()
        if not rows:
            header = [
                "id",
                "name",
                "type",
                "breed",
                "age",
                "contact",
                "photo_url",
                "phone",
                "gender",
                "size",
                "description",
                "created_at",
            ]
            buf = io.StringIO()
            csv.writer(buf).writerow(header)
            return buf.getvalue().encode("utf-8")

        header = list(rows[0].keys())
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=header)
        w.writeheader()
        for r in rows:
            w.writerow(r)
        return buf.getvalue().encode("utf-8")

    # ---------- Search History ----------
    def add_search_history(self, params: dict):
        with self._conn() as con:
            con.execute(
                """INSERT INTO search_history
                (animal_type, location, age, size, breed, gender, per_page, page)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    params.get("animal_type"),
                    params.get("location"),
                    params.get("age"),
                    params.get("size"),
                    params.get("breed"),
                    params.get("gender"),
                    int(params.get("per_page", 0) or 0),
                    int(params.get("page", 1) or 1),
                ),
            )

    def list_search_history(self, limit: int = 50):
        with self._conn() as con:
            rows = con.execute(
                "SELECT * FROM search_history ORDER BY datetime(created_at) DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def clear_search_history(self):
        with self._conn() as con:
            con.execute("DELETE FROM search_history")

    # ---------- Compatibility alias for legacy tests ----------
    # ต้องคืน list ของ tuple โดยให้ index 2 = name ตามที่เทสต์คาด
    def get_favorites(self):
        with self._conn() as con:
            rows = con.execute(
                "SELECT * FROM favorites ORDER BY datetime(created_at) DESC"
            ).fetchall()
        out = []
        for r in rows:
            out.append(
                (
                    r["id"],         # 0
                    r["type"],       # 1
                    r["name"],       # 2  <-- เทสต์เช็คตรงนี้
                    r["breed"],
                    r["age"],
                    r["contact"],
                    r["photo_url"],
                    r["phone"],
                    r["gender"],
                    r["size"],
                    r["description"],
                    r["created_at"],
                )
            )
        return out

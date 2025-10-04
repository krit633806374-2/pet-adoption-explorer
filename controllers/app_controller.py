# controllers/app_controller.py
from flask import Blueprint, request, jsonify, render_template, Response
from models.pet import Pet
from data.persistance import PersistenceManager

bp = Blueprint("app_controller", __name__)
db = PersistenceManager()

# ---------- Pages ----------
@bp.get("/")
def index():
    return render_template("index.html")

@bp.get("/favorites")
def favorites_page():
    return render_template("favorites.html")

# ---------- API: Favorites ----------
@bp.get("/api/favorites")
def api_list_favorites():
    return jsonify(db.list_favorites())

@bp.post("/api/favorites")
def api_add_favorite():
    try:
        payload = request.get_json(silent=False, force=True) or {}
        print("DEBUG /api/favorites payload =", payload)

        if not payload.get("id") or not payload.get("name"):
            return jsonify({"ok": False, "error": "id and name required"}), 400

        pet = Pet(
            pet_id=str(payload.get("id")),
            name=str(payload.get("name")),
            pet_type=payload.get("type"),
            breed=payload.get("breed"),
            age=payload.get("age"),
            contact=payload.get("contact"),
            photo_url=payload.get("photo_url"),
            phone=payload.get("phone"),
            gender=payload.get("gender"),
            size=payload.get("size"),
            description=payload.get("description"),
        )
        db.add_favorite(pet)
        return jsonify({"ok": True, "id": pet.pet_id})
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500
@bp.get("/api/_diag/schema")
def api_diag_schema():
    with db._conn() as con:
        rows = con.execute("PRAGMA table_info(favorites)").fetchall()
    return jsonify([dict(r) for r in rows])

@bp.delete("/api/favorites/<pet_id>")
def api_delete_favorite(pet_id):
    db.delete_favorite(pet_id)
    return jsonify({"ok": True})

@bp.get("/api/favorites/export.csv")
def api_export_csv():
    csv_bytes = db.export_csv_bytes()
    return Response(
        csv_bytes,
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="favorites.csv"'}
    )

# ---------- API: Search (mock เดโม่ให้หน้า UI ใช้ได้เลย) ----------
@bp.get("/search")
def api_search():
    # อ่านพารามิเตอร์ (ยังไม่ใช้ทั้งหมด — เดโม)
    animal_type = request.args.get("type")  # dog/cat/None
    location = request.args.get("location", "New York")
    age = request.args.get("age")
    size = request.args.get("size")

    # ผลลัพธ์ตัวอย่าง (ปกติคุณจะไปดึงจาก Petfinder/RescueGroups)
    base = [
        {
            "id": "d1", "name": "Buddy", "type": "dog", "breed": "Labrador Retriever",
            "age": "Young", "gender": "Male", "size": "Medium",
            "contact": "adopt@happytails.org", "phone": "+1-212-555-0100",
            "photo_url": "https://picsum.photos/id/237/600/400",
            "description": "Friendly, loves fetch and walks."
        },
        {
            "id": "c1", "name": "Luna", "type": "cat", "breed": "Domestic Shorthair",
            "age": "Adult", "gender": "Female", "size": "Small",
            "contact": "adopt@happytails.org",
            "photo_url": "https://picsum.photos/id/1062/600/400",
            "description": "Calm indoor cat; likes window sunbathing."
        },
        {
            "id": "d2", "name": "Max", "type": "dog", "breed": "Poodle Mix",
            "age": "Baby", "gender": "Male", "size": "Small",
            "contact": "hello@sunshinerescue.org", "phone": "+1-305-555-0123",
            "photo_url": "https://picsum.photos/id/1025/600/400",
            "description": "Playful and smart."
        }
    ]

    # ฟิลเตอร์ง่าย ๆ ตาม type/age/size (ถ้าส่งมา)
    out = base
    if animal_type:
        out = [p for p in out if p["type"].lower() == animal_type.lower()]
    if age:
        out = [p for p in out if p["age"].lower() == age.lower()]
    if size:
        out = [p for p in out if p["size"].lower() == size.lower()]

    return jsonify(out)

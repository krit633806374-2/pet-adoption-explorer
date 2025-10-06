from flask import Blueprint, Response, jsonify, redirect, render_template, request

from api.petfinder import PetFinderAPI
from data.persistance import PersistenceManager
from models.pet import Pet

bp = Blueprint("app_controller", __name__)
db = PersistenceManager()
pf = PetFinderAPI()


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
        import traceback

        traceback.print_exc()
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
        headers={"Content-Disposition": 'attachment; filename="favorites.csv"'},
    )


# ---------- API: Search (ตัวจริง + บันทึกประวัติ) ----------
@bp.get("/api/search")
def api_search_paged():
    q = request.args
    result = pf.search_animals(
        animal_type=q.get("animal_type") or q.get("type") or None,
        location=q.get("location", "10001"),  # ใช้ ZIP สหรัฐ
        age=q.get("age"),
        breed=q.get("breed"),
        size=q.get("size"),
        gender=q.get("gender"),
        page=int(q.get("page", 1)),
        per_page=int(q.get("per_page", 24)),
        
    )

    # เก็บประวัติการค้นหา (ถ้ามี table)
    try:
        db.add_search_history(
            {
                "animal_type": q.get("animal_type") or q.get("type"),
                "location": q.get("location"),
                "age": q.get("age"),
                "size": q.get("size"),
                "breed": q.get("breed"),
                "gender": q.get("gender"),
                "per_page": q.get("per_page", 24),
                "page": q.get("page", 1),
            }
        )
    except Exception:
        pass

    def to_dict(p: Pet):
        return {
            "id": p.pet_id,
            "name": p.name,
            "type": p.pet_type,
            "breed": p.breed,
            "age": p.age,
            "contact": p.contact,
            "photo_url": p.photo_url,
            "phone": getattr(p, "phone", None),
            "gender": getattr(p, "gender", None),
            "size": getattr(p, "size", None),
            "description": getattr(p, "description", None),
        }

    return jsonify(
        {
            "items": [to_dict(p) for p in result["items"]],
            "page": result["page"],
            "total_pages": result["total_pages"],
            "per_page": result["per_page"],
            "count": result["count"],
        }
    )


# ---------- Legacy redirect ----------
@bp.get("/search")
def api_search_legacy():
    return redirect(f"/api/search?{request.query_string.decode('utf-8')}", code=302)


# ---------- Search History APIs (ออปชัน) ----------
@bp.get("/api/history")
def api_history():
    limit = int(request.args.get("limit", 50))
    return jsonify(db.list_search_history(limit))


@bp.delete("/api/history")
def api_history_clear():
    db.clear_search_history()
    return jsonify({"ok": True})


# ---------- Health ----------
@bp.get("/health")
def health():
    return {"ok": True}, 200

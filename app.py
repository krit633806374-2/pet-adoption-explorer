from flask import Flask, request, jsonify, render_template
from controllers.app_controller import AppController

app = Flask(__name__)
# For now, using mock data. To use real API, register at https://www.petfinder.com/developers/
# and replace None values with your API key and secret
app_controller = AppController(api_key=None, secret=None)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/favorites')
def favorites_page():
    return render_template('favorites.html')

@app.route('/search', methods=['GET'])
def search_pets():
    animal_type = request.args.get('type', None)  # None จะแสดงสัตว์ทุกประเภท
    location = request.args.get('location', 'New York')
    print(f"🔍 Search request: type={animal_type}, location={location}")
    pets = app_controller.search_pets(animal_type, location)
    print(f"🐾 Found {len(pets)} pets")
    return jsonify([{
        'id': pet.pet_id,
        'name': pet.name,
        'type': pet.pet_type,
        'breed': pet.breed,
        'age': pet.age,
        'contact': pet.contact,
        'photo_url': pet.photo_url,
        'phone': pet.phone,
        'gender': pet.gender,
        'size': pet.size,
        'description': pet.description
    } for pet in pets])

@app.route('/manage_favorites', methods=['POST'])
def manage_favorites():
    data = request.json
    action = data.get('action', 'add')
    pet_id = data.get('pet_id')
    
    if action == 'add':
        # Check if already in favorites
        favorites = app_controller.view_favorites()
        existing_pet = next((pet for pet in favorites.get('pets', []) if pet.get('id') == pet_id), None)
        
        if existing_pet:
            # Remove from favorites
            app_controller.delete_favorite(pet_id)
            return jsonify({'success': True, 'action': 'removed', 'message': 'Removed from favorites'}), 200
        else:
            # Add to favorites - get pet details from API
            pet_data = app_controller.get_pet_by_id(pet_id)
            if pet_data:
                from models.pet import Pet
                pet = Pet(
                    pet_id=pet_data.get('id'),
                    name=pet_data.get('name'),
                    pet_type=pet_data.get('type'),
                    breed=pet_data.get('breeds', {}).get('primary', 'Mixed'),
                    age=pet_data.get('age'),
                    contact=pet_data.get('contact', {}).get('email', 'Contact shelter directly'),
                    photo_url=pet_data.get('photos', [{}])[0].get('large') if pet_data.get('photos') else None
                )
                app_controller.save_favorite(pet)
                return jsonify({'success': True, 'action': 'added', 'message': 'Added to favorites'}), 201
            else:
                return jsonify({'success': False, 'message': 'Pet not found'}), 404

@app.route('/favorites', methods=['GET'])
def get_favorites():
    favorites = app_controller.view_favorites()
    return jsonify(favorites)

@app.route('/export', methods=['GET'])
def export_favorites():
    app_controller.export_favorites()
    return jsonify({'message': 'Favorites exported to favorites.json'})

if __name__ == '__main__':
    app.run(debug=True)
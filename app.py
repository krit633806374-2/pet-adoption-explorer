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
        'photo_url': pet.photo_url
    } for pet in pets])

@app.route('/favorites', methods=['GET', 'POST', 'DELETE'])
def manage_favorites():
    if request.method == 'GET':
        favorites = app_controller.view_favorites()
        return jsonify(favorites)

    elif request.method == 'POST':
        data = request.json
        # Create a Pet object from the received data
        from models.pet import Pet
        pet = Pet(
            pet_id=data.get('pet_id'),
            name=data.get('name'),
            pet_type=data.get('type'),
            breed=data.get('breed'),
            age=data.get('age'),
            contact=data.get('contact'),
            photo_url=data.get('photo_url')
        )
        app_controller.save_favorite(pet)
        return jsonify({'message': 'Favorite saved!'}), 201

    elif request.method == 'DELETE':
        pet_id = request.args.get('pet_id')
        app_controller.delete_favorite(pet_id)
        return jsonify({'message': 'Favorite deleted!'}), 200

@app.route('/export', methods=['GET'])
def export_favorites():
    app_controller.export_favorites()
    return jsonify({'message': 'Favorites exported to favorites.json'})

if __name__ == '__main__':
    app.run(debug=True)
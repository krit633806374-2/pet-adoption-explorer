from controllers.app_controller import AppController

def main():
    app = AppController()  # token=None → mock data

    while True:
        print("\n🐾 Pet Adoption Explorer 🐾")
        print("1. Search Pets")
        print("2. View Favorites")
        print("3. Export Favorites")
        print("4. Exit")
        choice = input("Choose an option: ")

        if choice == "1":
            animal_type = input("Enter animal type (dog/cat): ")
            location = input("Enter location: ")
            pets = app.search_pets(animal_type, location)

            for idx, pet in enumerate(pets, 1):
                print(f"{idx}. {pet} - Contact: {pet.contact}")

            pick = input("Enter number to save as favorite (or press Enter to skip): ")
            if pick.isdigit() and 1 <= int(pick) <= len(pets):
                app.save_favorite(pets[int(pick)-1])
                print("✅ Saved to favorites!")

        elif choice == "2":
            favorites = app.view_favorites()
            if not favorites:
                print("No favorites yet.")
            else:
                for fav in favorites:
                    print(f"ID: {fav[1]} - {fav[2]} ({fav[3]}, {fav[4]}, {fav[5]}) Contact: {fav[6]}")
                delete_id = input("Enter pet_id to delete (or press Enter to skip): ")
                if delete_id:
                    app.delete_favorite(delete_id)
                    print("❌ Favorite deleted.")

        elif choice == "3":
            app.export_favorites()
            print("📁 Favorites exported to favorites.json")

        elif choice == "4":
            print("Bye!")
            break

if __name__ == "__main__":
    main()

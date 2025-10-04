# app.py
from flask import Flask
from controllers.app_controller import bp as app_bp

def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")
    app.register_blueprint(app_bp)
    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)

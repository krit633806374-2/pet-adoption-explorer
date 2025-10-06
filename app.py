import os

from dotenv import load_dotenv

load_dotenv()

from flask import Flask

from controllers.app_controller import bp as app_bp


def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")

    if os.getenv("FLASK_ENV") == "development":
        app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

    app.register_blueprint(app_bp)
    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)

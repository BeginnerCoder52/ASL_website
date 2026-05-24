import os
from flask import Flask
from flask_cors import CORS
from backend import socketio
from backend.routes import api_bp
from backend import socket_events
from backend.model import ModelManager


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get(
        'SECRET_KEY', 'eduglyph-dev-secret'
    )
    CORS(app)

    app.register_blueprint(api_bp)
    socketio.init_app(app, cors_allowed_origins="*")

    model_manager = ModelManager()
    model_manager.initialize()

    return app


app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)

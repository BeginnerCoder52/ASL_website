import os
import time
import jwt
from flask import Blueprint, request, jsonify, send_file
from backend.config import Config
from backend.model import ModelManager

api_bp = Blueprint('api', __name__)
model_manager = ModelManager()


@api_bp.route('/api/predict', methods=['POST'])
def predict():
    if not model_manager.is_ready():
        return jsonify({'error': 'System not ready'}), 500

    data = request.json
    if 'image' not in data:
        return jsonify({'error': 'No image data'}), 400

    try:
        image_data = data['image'].split(',')[1]
        label, confidence, processed_image = model_manager.predict(image_data)

        return jsonify({
            'label': label,
            'confidence': confidence,
            'processed_image': processed_image
        })
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500


@api_bp.route('/api/livekit/token', methods=['POST'])
def get_livekit_token():
    data = request.json
    room_name = data.get('room')
    identity = data.get('identity', 'anonymous')

    if not Config.LIVEKIT_API_KEY or not Config.LIVEKIT_API_SECRET:
        return jsonify({'error': 'LiveKit chua duoc cau hinh'}), 500

    payload = {
        "iss": Config.LIVEKIT_API_KEY,
        "sub": identity,
        "exp": int(time.time()) + 3600,
        "nbf": int(time.time()),
        "video": {
            "room": room_name,
            "roomJoin": True,
            "canPublish": True,
            "canSubscribe": True,
        }
    }

    token = jwt.encode(payload, Config.LIVEKIT_API_SECRET, algorithm="HS256")

    return jsonify({'token': token, 'url': Config.LIVEKIT_URL})


@api_bp.route('/api/example/<label>', methods=['GET'])
def get_example(label):
    search_label = label
    if label == " ":
        search_label = "space"

    for data_dir in Config.DATA_DIRS:
        target_dir = os.path.join(data_dir, search_label)
        if not os.path.exists(target_dir):
            target_dir = os.path.join(data_dir, search_label.lower())

        if os.path.isdir(target_dir):
            files = os.listdir(target_dir)
            if files:
                for f in files:
                    if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                        return send_file(
                            os.path.join(target_dir, f),
                            mimetype='image/jpeg'
                        )

    return jsonify({'error': 'Image not found'}), 404

import os
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

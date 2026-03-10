import os
import cv2
import numpy as np
import base64
import time
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from tensorflow.keras.models import load_model
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

app = Flask(__name__)
CORS(app)

# --- 1. CẤU HÌNH ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "AI_output_files")
# QUAN TRỌNG: Cấu hình đúng đường dẫn chứa ảnh
# Backend sẽ tìm ảnh trong các thư mục này theo thứ tự
DATA_DIRS = [
    # os.path.join(BASE_DIR, "data", "asl_dataset"), # <--- Ưu tiên thư mục này như bạn yêu cầu
    os.path.join(BASE_DIR, "data", "DATASET"),
]

# Cập nhật đường dẫn model mới
MODEL_PATH = os.path.join(OUTPUT_DIR, "model_acc98.02_20260212_1054.keras")
TASK_PATH = os.path.join(OUTPUT_DIR, "hand_landmarker.task")

# --- 2. LOAD MODEL & LABELS ---
# Danh sách Class chuẩn từ Log (43 classes)
CLASS_LABELS = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
    'HELLO', 'HELP',
    'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
    'RIGHT',
    'S', 'T',
    'THANKS',
    'U', 'V', 'W', 'X', 'Y', 'Z',
    'del', 'nothing', 'space'
]

print(f"Loading Keras model from {MODEL_PATH}...")
try:
    keras_model = load_model(MODEL_PATH)
    print("Keras model loaded successfully!")
except Exception as e:
    print(f"Error loading Keras model: {e}")
    keras_model = None

print(f"Loading Mediapipe Task from {TASK_PATH}...")
if os.path.exists(TASK_PATH):
    base_options = python.BaseOptions(model_asset_path=TASK_PATH)
    options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=1)
    detector = vision.HandLandmarker.create_from_options(options)
    print("Mediapipe Detector initialized!")
else:
    print("Error: Task file not found!")
    detector = None

# Định nghĩa màu sắc ngón tay (Để vẽ đẹp hơn trên Web)
CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),     # Thumb
    (5, 6), (6, 7), (7, 8),             # Index
    (9, 10), (10, 11), (11, 12),        # Middle
    (13, 14), (14, 15), (15, 16),       # Ring
    (17, 18), (18, 19), (19, 20),       # Pinky
    (0, 5), (5, 9), (9, 13), (13, 17), (0, 17) # Palm
]
COLORS = {
    "Thumb": (255, 0, 0), "Index": (0, 255, 0), "Middle": (0, 0, 255),
    "Ring": (255, 255, 0), "Pinky": (255, 0, 255), "Palm": (255, 255, 255)
}

def get_connection_color(start_idx, end_idx):
    if 1 <= start_idx <= 4 or 1 <= end_idx <= 4: return COLORS["Thumb"]
    if 5 <= start_idx <= 8 or 5 <= end_idx <= 8: return COLORS["Index"]
    if 9 <= start_idx <= 12 or 9 <= end_idx <= 12: return COLORS["Middle"]
    if 13 <= start_idx <= 16 or 13 <= end_idx <= 16: return COLORS["Ring"]
    if 17 <= start_idx <= 20 or 17 <= end_idx <= 20: return COLORS["Pinky"]
    return COLORS["Palm"]

def process_landmarks(hand_landmarks):
    data = []
    for lm in hand_landmarks:
        data.extend([lm.x, lm.y])
    return np.array(data).reshape(1, 42)

@app.route('/api/predict', methods=['POST'])
def predict():
    if not keras_model or not detector:
        return jsonify({'error': 'System not ready'}), 500

    data = request.json
    if 'image' not in data:
        return jsonify({'error': 'No image data'}), 400

    try:
        # Decode ảnh từ Frontend
        image_data = data['image'].split(',')[1]
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img = cv2.flip(img, 1) # Flip để giống gương
        h, w, _ = img.shape

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        
        detection_result = detector.detect(mp_image)
        
        predicted_label = "No Hand"
        confidence = 0.0
        
        if detection_result.hand_landmarks:
            for hand_landmarks in detection_result.hand_landmarks:
                # 1. Dự đoán
                input_data = process_landmarks(hand_landmarks)
                prediction = keras_model.predict(input_data, verbose=0)
                idx = np.argmax(prediction)
                confidence = float(np.max(prediction))
                
                if idx < len(CLASS_LABELS):
                    predicted_label = CLASS_LABELS[idx]
                else:
                    predicted_label = "Unknown"

                # 2. Vẽ lên ảnh trả về
                for start_idx, end_idx in CONNECTIONS:
                    start = hand_landmarks[start_idx]
                    end = hand_landmarks[end_idx]
                    pt1 = (int(start.x * w), int(start.y * h))
                    pt2 = (int(end.x * w), int(end.y * h))
                    color = get_connection_color(start_idx, end_idx)
                    cv2.line(img, pt1, pt2, color, 2)
                
                for lm in hand_landmarks:
                    cv2.circle(img, (int(lm.x * w), int(lm.y * h)), 4, (0, 0, 255), -1)

                # Vẽ Box
                x_coords = [lm.x * w for lm in hand_landmarks]
                y_coords = [lm.y * h for lm in hand_landmarks]
                x_min, x_max = int(min(x_coords)), int(max(x_coords))
                y_min, y_max = int(min(y_coords)), int(max(y_coords))
                cv2.rectangle(img, (x_min-20, y_min-20), (x_max+20, y_max+20), (0, 255, 0), 2)
                
        # Encode ảnh trả về
        _, buffer = cv2.imencode('.jpg', img)
        processed_image_base64 = base64.b64encode(buffer).decode('utf-8')

        return jsonify({
            'label': predicted_label,
            'confidence': confidence,
            'processed_image': f"data:image/jpeg;base64,{processed_image_base64}"
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

# API để lấy ảnh ví dụ (Frontend gọi cái này để hiển thị ảnh)
@app.route('/api/example/<label>', methods=['GET'])
def get_example(label):
    # Xử lý các nhãn đặc biệt để tìm đúng folder
    search_label = label
    if label == " ": search_label = "space"
    
    # Tìm trong các thư mục data
    for data_dir in DATA_DIRS:
        # 1. Tìm chính xác (VD: "A", "HELLO")
        target_dir = os.path.join(data_dir, search_label)
        if not os.path.exists(target_dir):
            # 2. Tìm chữ thường (VD: "del", "nothing", "space")
            target_dir = os.path.join(data_dir, search_label.lower())
            
        if os.path.isdir(target_dir):
            files = os.listdir(target_dir)
            if files:
                # Lấy file ảnh đầu tiên tìm thấy
                for f in files:
                    if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                        return send_file(os.path.join(target_dir, f), mimetype='image/jpeg')
    
    return jsonify({'error': 'Image not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
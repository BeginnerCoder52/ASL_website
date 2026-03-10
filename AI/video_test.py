import cv2
import mediapipe as mp
import numpy as np
import time
import os
from tensorflow.keras.models import load_model
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# 1. Cấu hình đường dẫn
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "AI_output_files")

# Cập nhật tên Model mới nhất của bạn
MODEL_PATH = os.path.join(OUTPUT_DIR, "model_acc98.02_20260212_1054.keras")
TASK_PATH = os.path.join(OUTPUT_DIR, "hand_landmarker.task")

# --- CẬP NHẬT DANH SÁCH CLASS CHUẨN XÁC THEO LOG ---
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

# Load Keras Model
try:
    print(f"Loading model from: {MODEL_PATH}")
    keras_model = load_model(MODEL_PATH)
    print("Keras model loaded successfully!")
    
    # Kiểm tra output
    model_output_shape = keras_model.output_shape[-1]
    print(f"Model outputs {model_output_shape} classes.")
    print(f"Defined labels: {len(CLASS_LABELS)} classes.")
    
    if model_output_shape != len(CLASS_LABELS):
        print(f"WARNING: Model có {model_output_shape} lớp nhưng danh sách có {len(CLASS_LABELS)} lớp!")
        print("Vui lòng kiểm tra lại danh sách CLASS_LABELS.")
        
except Exception as e:
    print(f"Error loading Keras model: {e}")
    exit()

# 2. Cấu hình Mediapipe Tasks
if not os.path.exists(TASK_PATH):
    print(f"Error: Task file not found at {TASK_PATH}")
    exit()

base_options = python.BaseOptions(model_asset_path=TASK_PATH)
options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=1)
detector = vision.HandLandmarker.create_from_options(options)

# 3. Định nghĩa Connections (Vẽ thủ công)
CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (5, 6), (6, 7), (7, 8),
    (9, 10), (10, 11), (11, 12),
    (13, 14), (14, 15), (15, 16),
    (17, 18), (18, 19), (19, 20),
    (0, 5), (5, 9), (9, 13), (13, 17), (0, 17)
]

def process_landmarks(hand_landmarks):
    data = []
    for lm in hand_landmarks:
        data.extend([lm.x, lm.y])
    return np.array(data).reshape(1, 42)

# 4. Biến điều khiển
prev_time = 0
prediction_interval = 1.0 # 1 giây/lần
last_prediction = "Waiting..."
confidence = 0.0

cap = cv2.VideoCapture(0)

try:
    while cap.isOpened():
        success, frame = cap.read()
        if not success: break

        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        detection_result = detector.detect(mp_image)

        if detection_result.hand_landmarks:
            for hand_landmarks in detection_result.hand_landmarks:
                # A. Vẽ Bounding Box
                x_coords = [lm.x * w for lm in hand_landmarks]
                y_coords = [lm.y * h for lm in hand_landmarks]
                x_min, x_max = int(min(x_coords)), int(max(x_coords))
                y_min, y_max = int(min(y_coords)), int(max(y_coords))

                cv2.rectangle(frame, (x_min-20, y_min-20), (x_max+20, y_max+20), (0, 255, 0), 2)

                # B. Vẽ Skeleton
                for start_idx, end_idx in CONNECTIONS:
                    start = hand_landmarks[start_idx]
                    end = hand_landmarks[end_idx]
                    cv2.line(frame, (int(start.x * w), int(start.y * h)), 
                             (int(end.x * w), int(end.y * h)), (255, 255, 255), 2)

                for lm in hand_landmarks:
                    cv2.circle(frame, (int(lm.x * w), int(lm.y * h)), 5, (0, 0, 255), -1)

                # C. Dự đoán
                current_time = time.time()
                if current_time - prev_time > prediction_interval:
                    input_data = process_landmarks(hand_landmarks)
                    prediction = keras_model.predict(input_data, verbose=0)
                    
                    idx = np.argmax(prediction)
                    confidence = np.max(prediction)
                    
                    if idx < len(CLASS_LABELS):
                        last_prediction = CLASS_LABELS[idx]
                    else:
                        last_prediction = f"Unknown ({idx})"
                    
                    prev_time = current_time

                # Hiển thị text
                cv2.putText(frame, f"{last_prediction} ({confidence*100:.1f}%)", 
                            (x_min, y_min-30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow('ASL Detection System', frame)
        if cv2.waitKey(5) & 0xFF == 27: break

except Exception as e:
    print(f"Runtime Error: {e}")

finally:
    print("Cleaning up...")
    cap.release()
    detector.close()
    cv2.destroyAllWindows()
    print("Done.")
import os
import cv2
import numpy as np
import base64
import time
import atexit
from tensorflow.keras.models import load_model
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from backend.config import Config


class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def initialize(self):
        if self._initialized:
            return
        self._initialized = True

        self.keras_model = None
        self.detector = None
        self._detector_failures = 0
        self._max_retries = 3

        print(f"Loading Keras model from {Config.MODEL_PATH}...")
        try:
            self.keras_model = load_model(Config.MODEL_PATH)
            print("Keras model loaded successfully!")
        except Exception as e:
            print(f"Error loading Keras model: {e}")

        self._init_detector()

        atexit.register(self._cleanup)

    def _init_detector(self):
        print(f"Loading Mediapipe Task from {Config.TASK_PATH}...")
        if os.path.exists(Config.TASK_PATH):
            try:
                base_options = python.BaseOptions(
                    model_asset_path=Config.TASK_PATH
                )
                options = vision.HandLandmarkerOptions(
                    base_options=base_options, num_hands=1
                )
                self.detector = vision.HandLandmarker.create_from_options(options)
                self._detector_failures = 0
                print("Mediapipe Detector initialized!")
            except Exception as e:
                print(f"Error creating Mediapipe detector: {e}")
                self.detector = None
        else:
            print("Error: Task file not found!")

    def _cleanup(self):
        if self.detector is not None:
            try:
                self.detector.close()
            except Exception:
                pass
            self.detector = None

    def predict(self, image_data):
        if not self.keras_model:
            return None, 0.0, None

        if self.detector is None:
            self._init_detector()
            if self.detector is None:
                return "No Hand", 0.0, None

        try:
            img_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            img = cv2.flip(img, 1)
            h, w, _ = img.shape

            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

            detection_result = self.detector.detect(mp_image)

            self._detector_failures = 0

            predicted_label = "No Hand"
            confidence = 0.0

            if detection_result.hand_landmarks:
                for hand_landmarks in detection_result.hand_landmarks:
                    input_data = self._process_landmarks(hand_landmarks)
                    prediction = self.keras_model.predict(input_data, verbose=0)
                    idx = np.argmax(prediction)
                    confidence = float(np.max(prediction))

                    if idx < len(Config.CLASS_LABELS):
                        predicted_label = Config.CLASS_LABELS[idx]
                    else:
                        predicted_label = "Unknown"

                    self._draw_skeleton(img, hand_landmarks, h, w)

            _, buffer = cv2.imencode('.jpg', img)
            processed_image_base64 = base64.b64encode(buffer).decode('utf-8')

            return predicted_label, confidence, \
                f"data:image/jpeg;base64,{processed_image_base64}"

        except Exception as e:
            print(f"Mediapipe detection error: {e}")
            self._detector_failures += 1

            if self._detector_failures >= self._max_retries:
                print("Max Mediapipe retries reached. Reinitializing detector...")
                self._cleanup()
                time.sleep(1)
                self._init_detector()

            return "No Hand", 0.0, None

    def _process_landmarks(self, hand_landmarks):
        data = []
        for lm in hand_landmarks:
            data.extend([lm.x, lm.y])
        return np.array(data).reshape(1, 42)

    def _get_connection_color(self, start_idx, end_idx):
        if 1 <= start_idx <= 4 or 1 <= end_idx <= 4:
            return Config.COLORS["Thumb"]
        if 5 <= start_idx <= 8 or 5 <= end_idx <= 8:
            return Config.COLORS["Index"]
        if 9 <= start_idx <= 12 or 9 <= end_idx <= 12:
            return Config.COLORS["Middle"]
        if 13 <= start_idx <= 16 or 13 <= end_idx <= 16:
            return Config.COLORS["Ring"]
        if 17 <= start_idx <= 20 or 17 <= end_idx <= 20:
            return Config.COLORS["Pinky"]
        return Config.COLORS["Palm"]

    def _draw_skeleton(self, img, hand_landmarks, h, w):
        for start_idx, end_idx in Config.CONNECTIONS:
            start = hand_landmarks[start_idx]
            end = hand_landmarks[end_idx]
            pt1 = (int(start.x * w), int(start.y * h))
            pt2 = (int(end.x * w), int(end.y * h))
            color = self._get_connection_color(start_idx, end_idx)
            cv2.line(img, pt1, pt2, color, 2)

        for lm in hand_landmarks:
            cv2.circle(img, (int(lm.x * w), int(lm.y * h)), 4, (0, 0, 255), -1)

        x_coords = [lm.x * w for lm in hand_landmarks]
        y_coords = [lm.y * h for lm in hand_landmarks]
        x_min, x_max = int(min(x_coords)), int(max(x_coords))
        y_min, y_max = int(min(y_coords)), int(max(y_coords))
        cv2.rectangle(img, (x_min - 20, y_min - 20),
                      (x_max + 20, y_max + 20), (0, 255, 0), 2)

    def is_ready(self):
        return self.keras_model is not None

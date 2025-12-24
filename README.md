# Learn With ASL - Real-time Sign Language Recognition System

**Project developed for Scientific Research Group.** **Author:** Thanh Hien
**Tech Stack:** ReactJS, Python (Flask), TensorFlow (Keras), MediaPipe.

---

## 1. Project Overview

**Learn With ASL** is a web-based application designed to assist users in learning American Sign Language (ASL) through interactive, real-time feedback. The system utilizes Computer Vision and Deep Learning to recognize hand gestures via a webcam and compares them with the required target letters.

### Key Features

- **Real-time Recognition:** Uses MediaPipe for hand tracking and a custom CNN model for gesture classification.
- **Interactive Learning:** Displays a target letter and provides immediate feedback (Correct/Incorrect).
- **Smart Subtitles:** Automatically generates subtitles based on the user's continuous gestures.
- **Modern UI:** A clean, dark-themed interface focused on user experience.

---

## 2. System Architecture & File Logic Flow

The project is divided into three main modules: AI, Backend, and Frontend.

```text
ASL_website/
├── AI/
│   ├── data/
│   │   ├── DATASET/         # Dữ liệu ảnh training
│   │   └── asl_dataset/     # Dữ liệu ảnh training bổ sung
│   ├── asl_model.keras      # Model đã train (sau khi chạy train.py)
│   └── train.py             # Script để train model
├── backend/
│   ├── app.py               # Server Flask (Code mới)
│   └── requirements.txt     # Danh sách thư viện Python cần cài
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraFeed.js        # Xử lý Camera & MediaPipe
│   │   │   └── PredictionDisplay.js # Hiển thị kết quả & Hướng dẫn
│   │   ├── App.css          # Style giao diện (Dark theme)
│   │   ├── App.js           # Logic chính của Web
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
└── README.md                # File tài liệu hướng dẫn (Tạo mới)

```

### 📂 AI (Artificial Intelligence)

This module handles data processing and model training.

- **`train.py`**: The core training script.
  - _Flow:_ Load Images from `data/` $\rightarrow$ Preprocess (Grayscale, Resize 64x64) $\rightarrow$ **Data Augmentation** (Rotation, Zoom to handle variations) $\rightarrow$ Train CNN Model $\rightarrow$ Save to `asl_model.keras`.

### 📂 Backend (API Server)

Acts as the bridge between the AI model and the User Interface.

- **`app.py`**: The Flask server entry point.
  - _Startup Flow:_ Initialize Flask App $\rightarrow$ Load `asl_model.keras` into memory $\rightarrow$ Map Class Indices to Labels (0-9, A-Z).
  - _API `/api/predict` (POST):_ Receive Base64 Image $\rightarrow$ Decode & Preprocess $\rightarrow$ Model Predict $\rightarrow$ Return JSON `{label: "A", confidence: 0.95}`.
  - _API `/api/example/<label>` (GET):_ Search for a sample image in the dataset $\rightarrow$ Return the image file to Frontend.

### 📂 Frontend (User Interface)

Built with ReactJS to provide a responsive client-side experience.

- **`App.js`**: The main controller.
  - _Logic:_ Manages application state (`target` letter, `score`, `subtitle`). It coordinates the flow between the CameraFeed and the Display panel.
- **`components/CameraFeed.js`**:
  - _Flow:_ Capture Video (`react-webcam`) $\rightarrow$ Detect Hand Landmarks (`MediaPipe`) $\rightarrow$ Draw Skeleton on Canvas $\rightarrow$ Crop Hand Region $\rightarrow$ Send to Backend API.
- **`components/PredictionDisplay.js`**:
  - _Logic:_ Displays the current target letter, the prediction result from the backend, and the example image.

---

## 3. Installation Guide

Follow these steps to set up the project locally.

### Prerequisites

- **Python** (3.8 or higher)
- **Node.js** (v14 or higher)

### Step 1: Setup Backend & AI

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

```

3. Install dependencies:
   _Create a `requirements.txt` file in `backend/` with: flask, flask-cors, tensorflow, opencv-python, mediapipe_

```bash
pip install flask flask-cors tensorflow opencv-python mediapipe

```

4. (Optional) Retrain the model if needed:

```bash
cd ../AI
python train.py
cd ../backend

```

5. Start the Server:

```bash
python app.py

```

_The server will run at http://localhost:5000_

### Step 2: Setup Frontend

1. Open a new terminal and navigate to the frontend directory:

```bash
cd frontend

```

2. Install Node modules:

```bash
npm install
# Ensure you install the webcam component
npm install react-webcam

```

3. Start the React App:

```bash
npm start

```

_The application will open at http://localhost:3000_

---

## 4. Troubleshooting

- **Camera not showing?** Ensure your browser has permission to access the webcam.
- **Prediction is wrong?** The background might be too cluttered. Try moving to a wall with a plain background or retrain the model using `train.py`.
- **Backend 404 Error?** Access the web via `localhost:3000` (Frontend), not port 5000. Port 5000 is for API only.

---

**© 2025 Thanh Hien - Scientific Research Group.**

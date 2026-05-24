# BÀN GIAO CHAT — Ngày 24/05/2026

## 1. MỤC TIÊU DỰ ÁN

Nâng cấp EduGlyph (ASL meeting platform) trên branch `upgrade-backend-and-database`:
- Đổi frontend approach
- Đổi backend
- Thêm database đăng ký tài khoản
- Responsive cho điện thoại

## 2. CÔNG NGHỆ ĐÃ CHỌN

| Thành phần | Lựa chọn |
|-----------|----------|
| Frontend | Vercel (giữ) |
| Backend | Hugging Face Spaces (kế hoạch, chưa deploy) |
| Database + Auth | Firebase (Auth + Firestore) |
| WebRTC | LiveKit Cloud (kế hoạch, chưa tích hợp) |
| AI Model | Server-side (giữ) |
| Đăng nhập | Username → internally `username@eduglyph.app` |

## 3. NHỮNG GÌ ĐÃ LÀM (PHASE 1)

### 3.1. File cấu hình
- `frontend/.env` — Firebase config placeholder + backend URL
- `frontend/package.json` — thêm `firebase: ^10.14.0`

### 3.2. Services (thư mục mới `frontend/src/services/`)
- `firebase.js` — Khởi tạo Firebase app, export auth + db
- `auth.js` — `registerWithEmail()`, `loginWithEmail()`, `logoutUser()`
- `db.js` — `createUserProfile()`, `getUserProfile()` (Firestore)
- `usernameToEmail.js` — Chuyển `john` → `john@eduglyph.app` để tương thích Firebase Auth

### 3.3. Pages đã sửa
- `Login.js` — Dùng Firebase Auth, giao diện Tên đăng nhập + Mật khẩu
- `Register.js` — Dùng Firebase Auth + Firestore, fields: username, fullname, dob, password
- `App.js` — Thêm `onAuthStateChanged` listener + loading state cho page refresh

### 3.4. Backend đã sửa
- `backend/app.py` — Bỏ `async_mode='gevent'` (cố định) → để Socket.IO tự động chọn mode

### 3.5. File plan
- `KẾ_HOẠCH_NÂNG_CẤP.md` — Kế hoạch 5 phase chi tiết

## 4. VẤN ĐỀ CÒN TỒN ĐỌNG

### 4.1. ❌ Firebase chưa được cấu hình (CẦN LÀM NGAY)
- User chưa tạo Firebase project
- File `.env` vẫn là placeholder (`your_firebase_api_key`, ...)
- Cần: vào Firebase Console → tạo project → bật Auth (Email/Password) + Firestore → copy config vào `.env`
- Firestore rules cần set:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```

### 4.2. ❌ Socket.IO + PeerJS — 2 trình duyệt không thấy nhau trong meeting room
- Backend log: không có lỗi, model load OK, MediaPipe OK
- Predict API (POST) hoạt động (HTTP)
- Socket.IO có thể vẫn chưa kết nối được giữa 2 browser
- Cần debug:
  - Mở F12 → Console → kiểm tra lỗi socket.io / peerjs
  - Backend có log `user_joined` không?
  - Thử dùng `localhost` thay vì IP
  - Kiểm tra PeerJS cloud server (`0.peerjs.com`) có bị chặn không

### 4.3. ❌ Video backend chưa phản hồi (camera)
- Predict API gọi liên tục (fetch loop) nhưng có thể không nhận được processed_image
- Cần kiểm tra response của `/api/predict` trong tab Network

### 4.4. ⏳ PeerJS → LiveKit chưa chuyển (Phase 3 trong kế hoạch)
- Hiện vẫn dùng PeerJS P2P, chưa tích hợp LiveKit Cloud
- Gây khó khăn cho việc kết nối nhiều người

### 4.5. ⏳ Hugging Face Spaces chưa deploy (Phase 2)
- Backend vẫn chạy local, chưa lên HF Spaces

### 4.6. ⏳ Mobile responsive chưa làm (Phase 4)
### 4.7. ⏳ Nâng cấp tính năng chưa làm (Phase 5)

## 5. TÀI LIỆU THAM KHẢO

- `GEMINI.md` — Mô tả vai trò agent + khuyến nghị tech stack
- `KẾ_HOẠCH_NÂNG_CẤP.md` — Kế hoạch 5 phase chi tiết
- `note thêm tính năng cho ASL website.txt` — Yêu cầu tính năng gốc
- `README.md` — Tài liệu dự án cũ

## 6. FILE STRUCTURE HIỆN TẠI

```
ASL_website/
├── frontend/
│   ├── .env                          ← Cần điền Firebase config
│   ├── package.json                  ← Đã thêm firebase dependency
│   ├── src/
│   │   ├── services/                 ← MỚI
│   │   │   ├── firebase.js
│   │   │   ├── auth.js
│   │   │   ├── db.js
│   │   │   └── usernameToEmail.js
│   │   ├── pages/
│   │   │   ├── Login.js              ← ĐÃ SỬA
│   │   │   ├── Register.js           ← ĐÃ SỬA
│   │   │   ├── App.js                ← ĐÃ SỬA
│   │   │   ├── Home.js               ← Giữ nguyên
│   │   │   └── MeetingRoom.js        ← Giữ nguyên (có vấn đề)
│   │   └── components/
│   │       ├── CameraFeed.js         ← Giữ nguyên
│   │       ├── VideoTile.js          ← Giữ nguyên
│   │       ├── Whiteboard.js         ← Giữ nguyên
│   │       ├── Microphone.js         ← Giữ nguyên
│   │       ├── Subtitle.js           ← Giữ nguyên
│   │       └── PredictionDisplay.js  ← Giữ nguyên
├── backend/
│   └── app.py                        ← ĐÃ SỬA (SocketIO config)
├── AI/
│   └── ... (model files)
├── HANDOVER_CHAT.md                  ← File này
├── KẾ_HOẠCH_NÂNG_CẤP.md            ← ĐÃ TẠO
└── GEMINI.md
```

## 7. DỮ LIỆU ĐĂNG NHẬP MẶC ĐỊNH (khi chưa có Firebase)

Hiện chưa có user mặc định nào vì đã bỏ localStorage. Cần setup Firebase trước.

## 8. CÁC CÂU LỆNH CẦN CHẠY

```bash
# Frontend (terminal 1)
cd frontend
npm install          # Cài firebase package
npm start            # Chạy frontend (port 3000)

# Backend (terminal 2)
cd backend
python app.py        # Chạy backend (port 5000)
```

---

## 9. CẬP NHẬT PHASE 2 — Ngày 24/05/2026 (Buổi chiều)

### 9.1. Backend đã tái cấu trúc thành module

| File | Trạng thái | Mô tả |
|------|-----------|-------|
| `backend/__init__.py` | **MỚI** | Khởi tạo SocketIO instance dùng chung |
| `backend/config.py` | **MỚI** | Config: paths, CLASS_LABELS (43 classes), CONNECTIONS, COLORS, SECRET_KEY |
| `backend/model.py` | **MỚI** | `ModelManager` singleton: load Keras model + MediaPipe, predict(), xử lý skeleton |
| `backend/routes.py` | **MỚI** | Blueprint API: `POST /api/predict`, `GET /api/example/<label>` |
| `backend/socket_events.py` | **MỚI** | SocketIO handlers: room, chat, whiteboard, timer, subtitle |
| `backend/services/__init__.py` | **MỚI** | Package init |
| `backend/services/room_manager.py` | **MỚI** | Quản lý state phòng (users, whiteboards) |
| `backend/app.py` | **ĐÃ SỬA** | Refactor thành `create_app()` pattern, gọi `model_manager.initialize()` |

### 9.2. Model architecture phát hiện

- **Input:** 42 features (21 MediaPipe landmarks × 2 tọa độ x,y)
- **Kiến trúc:** MLP 4 tầng Dense(512→256→128→43) + LeakyReLU + BatchNorm + Dropout
- **Output:** 43 classes (0-9, A-Z, HELLO, HELP, RIGHT, THANKS, del, nothing, space)
- **File:** `model_acc98.02_20260212_1054.keras` (2.22 MB params)

### 9.3. MediaPipe error handling

`model.py` giờ có:
- **Try/catch** bao quanh `detector.detect()` — không crash backend nếu MediaPipe lỗi
- **Auto-retry + reinit:** Sau 3 lần fail → tự động close và tạo lại detector
- **Lazy init:** Nếu detector bị null, tự động khởi tạo lại trước khi predict
- **Graceful fallback:** Trả về `"No Hand"` thay vì 500

### 9.4. Dockerfile cho Hugging Face Spaces

- **Đổi EXPOSE:** `10000` → `7860` (HF Spaces mặc định)
- **Thêm HEALTHCHECK:** 30s kiểm tra `/api/predict`
- **CMD:** Dùng `${PORT:-7860}` (tự động nhận PORT từ HF Spaces)

### 9.5. Convert model sang TensorFlow.js

#### Vấn đề gặp phải:
1. **Sai đường dẫn:** `BASE_DIR` trong `convert_to_web.py` là relative path → sửa thành `os.path.dirname(os.path.abspath(__file__))`
2. **Protobuf conflict:** `tensorflowjs_converter` kéo theo `yggdrasil_decision_forests` yêu cầu protobuf gencode 6.31.1 nhưng runtime 5.29.6
   - **Fix:** Monkey-patch `tensorflow_decision_forests` + `yggdrasil_decision_forests` trong `sys.modules` trước khi import tensorflowjs
3. **Thiếu `pkg_resources`:** setuptools 82+ đã bỏ `pkg_resources` → **Fix:** downgrade setuptools xuống 67.8.0
4. **Thiếu 4 classes:** `label_encoder.pickle` chỉ có 39 classes, model output 43 → **Fix:** bỏ đọc pickle, dùng hardcoded `FULL_CLASS_LABELS` (43 classes)

#### File output đã tạo:
```
AI_output_files/
├── labels.json              # 43 classes (0-42)
├── tfjs_model/
│   ├── model.json           # Architecture (9.6 KB)
│   └── group1-shard1of1.bin # Weights (781 KB)
```

#### Copy vào frontend/public/ cho Phase 3:
```bash
cp AI_output_files/labels.json frontend/public/
cp -r AI_output_files/tfjs_model frontend/public/
```

### 9.6. requirements.txt

- Thêm `firebase-admin==6.6.0`
- Lưu ý: `setuptools` cần downgrade xuống `<68` (hiện đang dùng 67.8.0) để có `pkg_resources`

### 9.7. frontend/.env

- Giữ `REACT_APP_BACKEND_URL=http://localhost:5000` cho local dev
- Thêm comment hướng dẫn khi deploy lên HF Spaces

### 9.8. Vấn đề tồn đọng (cập nhật)

| Mục | Trạng thái | Ghi chú |
|-----|-----------|---------|
| Firebase config | ✅ Đã cấu hình | Project `aslwebsite-d0a4f` đã active |
| Firebase Auth + Firestore | ✅ Đã setup | Auth email/password, Firestore users collection |
| Backend structure | ✅ Đã refactor | Module hóa, config tách riêng |
| MediaPipe crash | ✅ Đã handle | Auto-retry + reinit + graceful fallback |
| Convert model TF.js | ✅ Hoàn tất | `labels.json` + `tfjs_model/` sẵn sàng |
| Dockerfile HF Spaces | ✅ Đã cập nhật | PORT 7860 + HEALTHCHECK |
| Deploy lên HF Spaces | ⏳ Chưa làm | Cần tạo HF Space + push Docker |
| LiveKit WebRTC | ⏳ Phase 3 | Chưa tích hợp |
| Client-side AI | ⏳ Phase 3 | Cần copy model vào `frontend/public/` + code TF.js inference |
| Mobile responsive | ⏳ Phase 4 | Chưa làm |
| Nâng cấp tính năng | ⏳ Phase 5 | Chưa làm |

### 9.9. Câu lệnh chạy

#### Convert model (nếu cần chạy lại):
```bash
cd ~/ASL_website
.venv/bin/pip install tensorflowjs
.venv/bin/pip install 'setuptools<68'
.venv/bin/python AI_output_files/convert_to_web.py
```

#### Chạy backend local:
```bash
cd ~/ASL_website
.venv/bin/python backend/app.py
```

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
|-----|-----------|-------|
| Firebase config | ✅ Đã cấu hình | Project `aslwebsite-d0a4f` đã active |
| Firebase Auth + Firestore | ✅ Đã setup | Auth email/password, Firestore users collection |
| Backend structure | ✅ Đã refactor | Module hóa, config tách riêng |
| MediaPipe crash | ✅ Đã handle | Auto-retry + reinit + graceful fallback |
| Convert model TF.js | ✅ Hoàn tất | `labels.json` + `tfjs_model/` sẵn sàng |
| Dockerfile HF Spaces | ✅ Đã cập nhật | PORT 7860 + HEALTHCHECK |
| Deploy lên HF Spaces | ⏳ Chưa làm | Cần tạo HF Space + push Docker |
| LiveKit WebRTC | ⏳ Phase 4 | Chưa tích hợp |
| Client-side AI | ✅ Phase 3 | `aslEngine.js` tạo, VideoTile/CameraFeed dùng client inference |
| Mobile responsive | ⏳ Phase 4 | Chưa làm |
| Nâng cấp tính năng | ⏳ Phase 5 | Chưa làm |

### 9.9. Cập nhật Phase 3 — Client-side AI Migration (24/05/2026 chiều)

#### Đã thực hiện:

| File | Trạng thái | Mô tả |
|------|-----------|-------|
| `frontend/package.json` | **ĐÃ SỬA** | Thêm `@mediapipe/tasks-vision@0.10.35` |
| `frontend/src/services/aslEngine.js` | **MỚI** | Client-side ASL engine: MediaPipe WASM + TF.js inference + skeleton drawing |
| `frontend/src/components/VideoTile.js` | **ĐÃ SỬA** | Dùng client-side ASL engine thay vì gửi frame lên backend `/api/predict` |
| `frontend/src/components/CameraFeed.js` | **ĐÃ SỬA** | Dùng client-side ASL engine thay vì gửi frame lên backend |
| `frontend/public/labels.json` | ✅ Có sẵn | 43 classes (0-42) |
| `frontend/public/tfjs_model/` | ✅ Có sẵn | `model.json` + `group1-shard1of1.bin` |

#### Kiến trúc mới (Client-side AI):
```
Webcam → MediaPipe WASM (tasks-vision) → 21 landmarks (x,y) → TF.js model.predict() → Label + Confidence
                                                                                          ↓
                                                                                    Canvas skeleton + onAslResult()
```

#### Backend `/api/predict` vẫn hoạt động:
- Backend predict API được giữ nguyên cho các trường hợp fallback
- Client-side engine là ưu tiên mặc định (không cần gọi backend cho AI nữa)

#### Lưu ý:
- MediaPipe HandLandmarker load WASM từ CDN jsdelivr + model từ Google Storage
- TF.js model load từ `public/tfjs_model/model.json`
- Engine tự động retry init nếu thất bại
- Khi không detect được tay → trả về "No Hand" (không crash)

### 9.10. Câu lệnh chạy

#### Frontend:
```bash
cd frontend
npm install          # Đã cài @mediapipe/tasks-vision
npm start            # Chạy frontend (port 3000)
```

#### Backend (vẫn cần cho Socket.IO chat/whiteboard/timer):
```bash
cd ~/ASL_website
.venv/bin/python -m backend.app
```

---

## 10. CẬP NHẬT PHASE 3 (TIẾP) — Ngày 25/05/2026 — Debug nhận diện ASL sai + Fix model.json

### 10.1. Vấn đề
Client-side ASL predictions **sai hoàn toàn** (chỉ chữ P đôi lúc đúng). Mục tiêu: chẩn đoán nguyên nhân và sửa.

### 10.2. Nguyên nhân gốc rễ

#### 10.2.1. model.json bị lỗi format (Keras 3 → TF.js converter bug)
Converter `tensorflowjs_converter v4.22.0` tạo ra model.json không tương thích:

| Vấn đề | model.json cũ | Fix |
|--------|--------------|-----|
| **InputLayer shape** | `batch_shape: [null, 42]` | `batch_input_shape: [null, 42]` (Keras format chuẩn) |
| **InputLayer `dtype`** | Object `{module, class_name, config, registered_name}` | Plain string `"float32"` |
| **Thừa fields** | `ragged: false`, `optional: false` trong InputLayer | Xoá |
| **LeakyReLU param** | `negative_slope: 0.1` (Keras 3 format) | `alpha: 0.1` (TF.js format) |
| **Thừa build_input_shape** | `build_input_shape: [null, 42]` trong Sequential config | Xoá |

**Hậu quả:** Vì `batch_shape` không được `convertPythonicToTs()` chuyển thành `batchInputShape`, InputLayer của TF.js không có input shape → model architecture bị hỏng → predict ra garbage (luôn chọn 1 class).

#### 10.2.2. Server-side flip bug
`backend/app.py` (và `model.py`) dùng `cv2.flip(img, 1)` **trước khi detect MediaPipe**:
- Training data: `cv2.imread()` raw → **không flip** → right hand ở bên TRÁI ảnh
- Server inference: raw image → `cv2.flip(img, 1)` → **mirror** → right hand ở bên PHẢI ảnh
- Client inference: raw video → **không flip** → right hand ở bên TRÁI ảnh

→ **Server predictions sai hệ thống** (handedness error). Client inference không bị lỗi này.

#### 10.2.3. Kết luận chẩn đoán
- Nguyên nhân **chính** client bị sai: model.json format lỗi (gây random predict, không phải do handedness)
- Bug handedness chỉ ảnh hưởng server `/api/predict`, client ASL không dùng flip
- **Cần test lại client-side predictions sau khi sửa model.json**

### 10.3. Các file đã sửa

| File | Thay đổi |
|------|---------|
| `frontend/public/tfjs_model/model.json` | **Format lại hoàn toàn**: batch_input_shape, alpha, xoá Keras 3 artifacts, dtype string |
| `frontend/public/tfjs_model/group1-shard1of1.bin` | **Fresh weights** (781KB) từ Keras model gốc |

### 10.4. Feature extraction verified (không cần sửa)

Training notebook (`asl-image-processing-V20-BEST.ipynb`, cell 38):
```python
# Feature: 21 landmarks × (x, y) = 42 features
data_aux = []
for lm in hand_landmarks:
    data_aux.append(lm.x)
    data_aux.append(lm.y)
```

Client `aslEngine.js` (dòng 113-115):
```js
const features = [];
for (const lm of landmarks) {
    features.push(lm.x, lm.y);
}
```

→ **Giống hệt nhau** (raw normalized [0,1] x,y, không normalize/center/scale thêm).

### 10.5. So sánh server vs client pipeline

| Stage | Server (backend) | Client (aslEngine.js) |
|-------|-----------------|----------------------|
| Image source | POST request | Webcam `getUserMedia()` |
| Preprocessing | `cv2.flip(img, 1)` ❌ | Raw video ✅ |
| MediaPipe | Python `vision.HandLandmarker` | WASM `HandLandmarker` |
| Features | 42 x,y raw | 42 x,y raw |
| Model | Keras `.keras` | TF.js `model.json` |
| Output | 43-class softmax | 43-class softmax |

### 10.6. Model architecture (confirmed)

```
Input: [null, 42]
  ↓
Dense(512) → LeakyReLU(α=0.1) → BatchNorm → Dropout(0.4)
  ↓
Dense(256) → LeakyReLU(α=0.1) → BatchNorm → Dropout(0.3)
  ↓
Dense(128) → LeakyReLU(α=0.1) → BatchNorm → Dropout(0.3)
  ↓
Dense(43, softmax)
```

Weights: 19 tensors, ~781KB, verified correct.

### 10.7. Labels mapping (confirmed đúng)

`labels.json` (frontend/public/) ↔ `new_data.pickle` (AI/) ↔ `FULL_CLASS_LABELS` (config.py) ↔ sorted LabelEncoder

→ **43 classes, thứ tự giống hệt nhau** ✅

### 10.8. Vấn đề tồn đọng (cập nhật)

| Mục | Trạng thái | Ghi chú |
|-----|-----------|---------|
| model.json format Keras 3 → TF.js | ✅ Đã sửa | batch_input_shape, alpha, xoá Keras 3 fields |
| LeakyReLU alpha vs negative_slope | ✅ Đã sửa | `negative_slope` → `alpha` |
| Weights fresh từ Keras model | ✅ Đã copy | 781KB, verified |
| Client inference **cần test lại** | ⏳ Chưa test | User cần run `npm start` và kiểm tra |
| Server-side flip bug (`cv2.flip`) | ❌ Chưa sửa | `model.py` dòng `img = cv2.flip(img, 1)` — cần xoá hoặc comment |
| Firebase config | ✅ Đã cấu hình | Project `aslwebsite-d0a4f` |
| LiveKit WebRTC | ⏳ Phase 4 | Chưa tích hợp |
| Mobile responsive | ⏳ Phase 4 | Chưa làm |
| Deploy HF Spaces | ⏳ Phase 2 | Chưa deploy |

### 10.9. Hướng dẫn debug nếu vẫn sai

1. **Mở DevTools Console (F12)** — kiểm tra lỗi load model (network tab xem model.json có 200 không)
2. **Kiểm tra predicted probabilities**: thêm `console.log(probabilitiesArr)` sau `dataSync()` trong `aslEngine.js`
3. **So sánh landmarks**: log 42 features ra console và so với training notebook để xem có cùng distribution không
4. **Thử tắt GPU delegate**: đổi `delegate: 'GPU'` → `delegate: 'CPU'` trong `aslEngine.js` (dòng 66)

### 10.10. Câu lệnh chạy

```bash
# Frontend (terminal 1)
cd ~/ASL_website/frontend
npm start

# Backend (terminal 2) — vẫn cần cho Socket.IO chat/subtitle/whiteboard
cd ~/ASL_website
.venv/bin/python -m backend.app
```

### 10.11. Tổng kết Phase 3

| File | Trạng thái | Mô tả |
|------|-----------|-------|
| `frontend/src/services/aslEngine.js` | ✅ Hoàn tất | Singleton engine: MediaPipe WASM + TF.js + skeleton |
| `frontend/src/components/VideoTile.js` | ✅ Hoàn tất | requestAnimationFrame loop, draw skeleton |
| `frontend/src/components/CameraFeed.js` | ✅ Hoàn tất | ASL engine integration |
| `frontend/src/components/Microphone.js` | ✅ Hoàn tất | Giới hạn transcript 30 words |
| `frontend/src/pages/MeetingRoom.js` | ✅ Hoàn tất | broadcastSubtitle word limits (20 ASL / 30 speech) |
| `frontend/public/tfjs_model/model.json` | ✅ Đã sửa | Keras 3 → TF.js format fixed |
| `frontend/public/tfjs_model/group1-shard1of1.bin` | ✅ Fresh | Weights từ model gốc |
| `frontend/public/labels.json` | ✅ OK | 43 classes, verified |
| `backend/model.py` (`cv2.flip`) | ✅ Đã sửa | Remove cv2.flip — training data khong flip nen inference cung khong flip |

---

## 11. CẬP NHẬT PHASE 4 — Ngày 25/05/2026 — Thay PeerJS → LiveKit WebRTC

### 11.1. Tổng quan
Thay thế hoàn toàn PeerJS (P2P) bằng LiveKit Cloud (SFU) để hỗ trợ video call nhiều người ổn định hơn. Socket.IO vẫn được giữ cho chat, whiteboard, timer, subtitle.

### 11.2. Backend thay đổi

| File | Thay đổi |
|------|---------|
| `backend/config.py` | Thêm `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` từ env |
| `backend/routes.py` | Thêm `POST /api/livekit/token` — tạo JWT token cho LiveKit |
| `requirements.txt` | Thêm `pyjwt==2.10.1` |

### 11.3. Frontend thay đổi

| File | Thay đổi |
|------|---------|
| `frontend/package.json` | Cài `livekit-client` (gỡ `peerjs` khỏi code) |
| `frontend/src/services/livekitService.js` | **MỚI**: Room connection, token, publish/unpublish tracks |
| `frontend/src/pages/MeetingRoom.js` | PeerJS → LiveKit: `connectToRoom()`, `publishLocalVideo()`, `setAudioEnabled()` |
| `frontend/src/components/VideoTile.js` | `stream` callback → `onLocalStreamReady` prop, gọn logic local media |
| `frontend/.env` | Thêm comment hướng dẫn LiveKit URL |

### 11.4. Kiến trúc mới

```
Webcam → MediaStream → publishLocalVideo() → LiveKit SFU
                                                     ↓
Remote users ← TrackSubscribed ← new MediaStream([track]) → VideoTile (stream prop)
```

- **Local video**: Webcam → `publishLocalVideo(mediaStream)` → LiveKit cloud → phân phối SFU
- **Remote video**: LiveKit event `TrackSubscribed` → `new MediaStream([track])` → `peers` state → VideoTile
- **Audio**: Publish cùng lúc với video qua `mediaStream.getAudioTracks()`, điều khiển mute bằng `setAudioEnabled()`
- **Socket.IO**: Chỉ dùng cho chat, whiteboard, timer, subtitle (không còn signaling video)

### 11.5. Cấu hình cần làm thủ công

1. **Tạo LiveKit Cloud account**: https://livekit.io → đăng ký free tier
2. **Lấy API Key + Secret**: Vào Settings → Keys → tạo key mới
3. **Set environment variables**:

```bash
# Backend (.env hoặc HF Spaces secrets)
LIVEKIT_API_KEY=APIxxx
LIVEKIT_API_SECRET=secretxxx
LIVEKIT_URL=wss://ten-instance.livekit.cloud
```

4. **Restart backend** để áp dụng config

### 11.6. Lưu ý
- LiveKit free tier: 50GB bandwidth/tháng — đủ cho nhóm nhỏ
- Nếu chưa có LiveKit, app vẫn chạy local (backend predict + socket.io hoạt động bình thường)
- Video call sẽ không hoạt động cho đến khi có LiveKit config
- Có thể debug bằng F12 → Network tab → kiểm tra `POST /api/livekit/token`

### 11.7. Vấn đề tồn đọng

| Mục | Trạng thái | Ghi chú |
|-----|-----------|---------|
| LiveKit WebRTC | ✅ Đã tích hợp | Code sẵn sàng, cần user config API key |
| Mobile responsive | ⏳ Phase 5 | Chưa làm |
| Nâng cấp tính năng | ⏳ Phase 6 | Chưa làm |
| Deploy HF Spaces | ⏳ Phase 2 | Chưa deploy |

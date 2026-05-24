# KẾ HOẠCH NÂNG CẤP EDUGLYPH (Branch: upgrade-backend-and-database)

---

## PHẦN 1: ĐÁNH GIÁ VERCEL CHO MEETING NHIỀU NGƯỜI

Vercel chỉ phù hợp host **frontend tĩnh** (React SPA). Không hỗ trợ WebSocket/serverless persistent connection:

| Yếu tố | Vercel (Hobby) | Yêu cầu cho meeting |
|--------|---------------|-------------------|
| Timeout function | 10s | ❌ Cần giữ kết nối hàng giờ |
| WebSocket | Không hỗ trợ | ❌ Socket.IO hiện tại chạy backend |
| WebRTC signaling | Không hỗ trợ | ❌ Cần server signaling |
| Host static files | ✅ Rất tốt | ✅ Giữ nguyên |

**Kết luận:** Giữ Vercel cho frontend React. Video WebRTC dùng **LiveKit Cloud**. Socket.IO/Flask backend chuyển sang hosting khác.

---

## PHẦN 2: LỰA CHỌN CÔNG NGHỆ

### 2.1. Backend hosting (đã chọn)

| Tiêu chí | Render (cũ) | Hugging Face Spaces ✅ | Koyeb |
|----------|------------|---------------------|-------|
| RAM | 512MB | **16GB** | 512MB |
| vCPU | 0.5 | **2** | 1 |
| Docker | ✅ | ✅ | ✅ |
| WebSocket | ✅ | ✅ | ✅ |
| Ngủ khi không dùng | ✅ (15 phút) | ❌ (luôn chạy) | ✅ |
| Bandwidth | 100GB | 50GB | 100GB |

**→ Đã chọn: Hugging Face Spaces** — RAM 16GB + 2 vCPU là lý tưởng cho Keras + MediaPipe + nhiều user.

### 2.2. Database & Authentication (đã chọn)

| Tiêu chí | Firebase (Auth + Firestore) ✅ | Supabase (Auth + PostgreSQL) | MongoDB Atlas + tự code |
|----------|----------------------------|-----------------------------|------------------------|
| Auth free | 50K MAU | 50K MAU | Không có, tự code |
| Database | NoSQL (Firestore) | SQL (PostgreSQL) | NoSQL (MongoDB) |
| Real-time sync | ✅ Firestore realtime | ✅ Supabase Realtime | ❌ Cần thêm thư viện |
| React SDK | ✅ Rất tốt | ✅ Tốt | ❌ Tự gọi API |
| Học dễ | ✅ Dễ nhất | ⚡ Trung bình | ❌ Khó nhất |

**→ Đã chọn: Firebase (Auth + Firestore)** — setup nhanh, SDK React tốt, realtime có sẵn.

### 2.3. WebRTC Video (đã chọn)

| Tiêu chí | LiveKit Cloud ✅ | Daily.co | PeerJS (hiện tại) |
|----------|--------------|----------|-------------------|
| Free tier | 50GB bandwidth/tháng | 10K phút/tháng | Không giới hạn (P2P) |
| Chất lượng video | ✅ SFU server | ✅ SFU server | ⚡ P2P, tệ khi >3 người |
| Hỗ trợ React | ✅ `@livekit/components-react` | ✅ `@daily-co/daily-react` | ✅ `peerjs` |
| Hỗ trợ >4 người | ✅ | ✅ | ❌ P2P không scale |

**→ Đã chọn: LiveKit Cloud** — 50GB bandwidth free/tháng, SFU server đảm bảo chất lượng 4+ người.

### 2.4. AI Model chạy ở đâu (đã chọn)

| Tiêu chí | Server-side (hiện tại) ✅ | Client-side (MediaPipe.js + TF.js) |
|----------|----------------------|-----------------------------------|
| Chi phí backend | Cần server mạnh | ✅ $0 (chạy trên máy user) |
| Độ trễ | Cao (gửi frame → server → về) | ✅ Thấp (local) |
| Model hiện tại (`model_acc98`) | ✅ Giữ nguyên | ❌ Cần convert TF.js |
| Chất lượng nhận diện | ✅ Cao (Python + full thư viện) | ⚡ Có thể giảm nhẹ |

**→ Đã chọn: Server-side** (giữ nguyên) — giữ chất lượng nhận diện cao, tận dụng 16GB RAM HF Spaces.

---

## PHẦN 3: KẾ HOẠCH THỰC HIỆN THEO PHASE

### PHASE 1: Database & Auth thật (Firestore/Supabase)
**Thay thế localStorage bằng database thật để user đăng nhập được ở mọi thiết bị.**

| Bước | File cần sửa | Mô tả |
|------|-------------|-------|
| 1.1 | `frontend/.env` | Thêm biến SUPABASE_URL, SUPABASE_ANON_KEY |
| 1.2 | `frontend/src/services/auth.js` | (Tạo mới) Service đăng ký, đăng nhập, logout, getCurrentUser |
| 1.3 | `frontend/src/services/db.js` | (Tạo mới) Service CRUD user, meeting history |
| 1.4 | `frontend/src/pages/Login.js` | Thay localStorage check bằng Supabase/Firebase Auth |
| 1.5 | `frontend/src/pages/Register.js` | Thay localStorage save bằng Supabase DB insert |
| 1.6 | `frontend/src/App.js` | Thêm auth state listener để tự động nhận diện user khi refresh |

### PHASE 2: Chuyển Backend lên Hugging Face Spaces

| Bước | File cần sửa | Mô tả |
|------|-------------|-------|
| 2.1 | `backend/app.py` | Cấu trúc lại thành module (routes, socket, model, services) |
| 2.2 | `backend/config.py` | (Tạo mới) Tách biến cấu hình, API keys |
| 2.3 | `backend/requirements.txt` | Thêm supabase-py hoặc firebase-admin |
| 2.4 | `Dockerfile` | Sửa cho tương thích HF Spaces (PORT, healthcheck) |
| 2.5 | `backend/` | Deploy lên HF Spaces, cập nhật URL trong frontend .env |

### PHASE 3: Tối ưu hóa Kiến trúc (Client-side AI Migration)
**Mục tiêu:** Giảm tải hoàn toàn cho Backend, chuyển luồng xử lý AI (nhận diện ASL) xuống thẳng trình duyệt của người dùng để hỗ trợ số lượng người dùng vô hạn trong một phòng (Zero-Cost Scaling).

- [ ] **Bước 1: Chuyển đổi Model AI**
  - Dùng thư viện `tensorflowjs_converter` để chuyển đổi file `model_acc98.02.keras` sang định dạng web (`model.json` và các file `.bin`).
  - Viết script Python nhỏ để đọc `label_encoder.pickle` và xuất ra file `labels.json` (từ điển map giữa ID và Text).
- [ ] **Bước 2: Cập nhật Frontend (React)**
  - Cài đặt thư viện AI cho Web: `npm install @tensorflow/tfjs @mediapipe/tasks-vision`.
  - Khởi tạo MediaPipe Hand Landmarker bằng WebAssembly (WASM) trên trình duyệt.
  - Load `model.json` và `labels.json` vào RAM của trình duyệt.
- [ ] **Bước 3: Tích hợp Suy luận (Inference)**
  - Trích xuất 63 tọa độ khung xương tay từ video local.
  - Chạy `model.predict()` bằng WebGL trên máy người dùng để lấy kết quả (Text).
- [ ] **Bước 4: Đồng bộ LiveKit & Xóa Socket.IO**
  - Gỡ bỏ luồng gửi video frame (Base64) qua Socket.IO.
  - Sử dụng tính năng **Data Channels** của LiveKit để bắn chuỗi Text (kết quả ASL) siêu nhẹ tới các người dùng khác trong phòng họp.

### PHASE 4: Thay PeerJS → LiveKit WebRTC

| Bước | File cần sửa | Mô tả |
|------|-------------|-------|
| 3.1 | — | `npm install @livekit/components-react livekit-client` |
| 3.2 | `frontend/src/pages/MeetingRoom.js` | Thay PeerJS bằng LiveKit Room |
| 3.3 | `frontend/src/components/VideoTile.js` | Sửa thành LiveKit VideoTrack |
| 3.4 | `backend/app.py` | Thêm API tạo LiveKit room token (hoặc dùng LiveKit Cloud UI) |
| 3.5 | `frontend/.env` | Thêm LIVEKIT_URL, LIVEKIT_API_KEY |

### PHASE 5: Mobile Responsive

| Bước | File cần sửa | Mô tả |
|------|-------------|-------|
| 4.1 | `frontend/src/App.css` | Thêm media queries `@media (max-width: 768px)` |
| 4.2 | `frontend/src/pages/MeetingRoom.js` | Bottom control bar cho mobile, collapsible panels |
| 4.3 | `frontend/src/components/Whiteboard.js` | Thêm `onTouchStart/Move/End` cho mobile |
| 4.4 | `frontend/src/pages/Home.js` | Responsive layout cho màn hình nhỏ |
| 4.5 | `frontend/src/pages/MeetingRoom.js` | Dynamic video grid (1→2→3→4 cột tuỳ số user + màn hình) |

### PHASE 6: Nâng cấp tính năng (theo note.txt)

| Bước | File cần sửa | Mô tả |
|------|-------------|-------|
| 5.1 | `frontend/src/pages/MeetingRoom.js` | Gộp 2 camera thành 1 + nút Bật/Tắt ASL (đã có) |
| 5.2 | `frontend/src/components/VideoTile.js` | Subtitle đặt dưới camera mỗi người, kích thước nhỏ hơn cho người khác |
| 5.3 | `frontend/src/components/Whiteboard.js` | Sticky notes: 2 mode (gõ bàn phím / ASL → text) |
| 5.4 | `frontend/src/components/Whiteboard.js` | Con trỏ theo tên user (collaborative cursors) |
| 5.5 | `frontend/src/components/Whiteboard.js` | Nút lưu whiteboard xuống .png |
| 5.6 | `frontend/src/components/Whiteboard.js` | Autosave mỗi khi thay đổi |

---

## PHẦN 4: TÓM TẮT TECH STACK MỚI

| Thành phần | Công nghệ chọn | Lý do |
|-----------|---------------|-------|
| Frontend hosting | **Vercel** (giữ) | Free domain `.vercel.app`, global CDN |
| Backend hosting | **Hugging Face Spaces** ✅ | 16GB RAM + 2 vCPU free, Docker, WebSocket |
| Database + Auth | **Firebase (Auth + Firestore)** ✅ | Dễ setup nhất, React SDK tốt, realtime |
| WebRTC Video | **LiveKit Cloud** ✅ | 50GB free/tháng, SFU server, React SDK |
| AI Model | **Server-side** (giữ) ✅ | Chất lượng cao, chạy trên backend HF Spaces |
| Whiteboard/Chat | **Socket.IO** (giữ) | Nhẹ, đã hoạt động tốt |
| Speech-to-Text | **Web Speech API** (giữ) | Miễn phí, chạy client-side |

---

## PHẦN 5: CÁC BƯỚC ĐẦU TIÊN (NÊN LÀM NGAY)

```text
1. Tạo Firebase project (https://console.firebase.google.com) → bật Authentication + Firestore
2. Cài đặt Firebase trong frontend: npm install firebase
3. Cấu hình Firebase Auth (email/password) trong Firebase Console
4. Tạo LiveKit Cloud account (https://livekit.io) → lấy API key + secret
5. Tạo Hugging Face Space (Docker) → cấu hình backend
```

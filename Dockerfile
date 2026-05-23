# Sử dụng Python 3.10 mỏng nhẹ
FROM python:3.10-slim

# Cài đặt các thư viện hệ thống cần thiết cho MediaPipe và OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libgles2 \
    libglib2.0-0 \
    libegl1 \
    && rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy requirements và cài đặt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn vào container
COPY . .

# Mở cổng (Render sẽ tiêm biến PORT vào môi trường)
EXPOSE 10000

# Chạy Gunicorn với Gevent WebSockets
CMD gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 -b 0.0.0.0:${PORT:-10000} backend.app:socketio

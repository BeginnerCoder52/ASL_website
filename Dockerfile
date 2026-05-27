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

# Hỗ trợ đa nền tảng:
# - Hugging Face Spaces: PORT=7860 (mặc định)
# - Render: PORT=10000
# - Koyeb: PORT=8080
# - Fly.io: PORT=8080
EXPOSE 7860

# Healthcheck (dùng PORT từ biến môi trường)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-7860}/api/predict', timeout=2)" || exit 1

# Chạy Gunicorn với Gevent worker (Flask HTTP + SocketIO long-polling)
# Có thể deploy lên: Render, Hugging Face Spaces, Koyeb, Fly.io
CMD gunicorn -k gevent -w 1 -b 0.0.0.0:${PORT:-7860} backend.app:app

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY requirements*.txt ./
RUN pip install -r requirements.txt

COPY . .

# เตรียม user และสิทธิ์โฟลเดอร์โค้ด
RUN useradd -m appuser && mkdir -p /app/data && chown -R appuser:appuser /app

# volume สำหรับ DB
VOLUME ["/data"]
EXPOSE 8000
ENV PETS_DB_PATH=/data/pets.db PORT=8000

# ใช้ entrypoint (จะ chown /data แล้วสลับเป็น appuser)
COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

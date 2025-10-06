# ----- Base -----
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates && rm -rf /var/lib/apt/lists/*

# ----- Dependencies -----
COPY requirements*.txt ./
RUN pip install -r requirements.txt

# ----- App -----
COPY . .

# VOLUME ["/data"]

ENV PORT=8000 \
    PETS_DB_PATH=/data/pets.db
EXPOSE 8000

CMD ["gunicorn", "-w", "3", "-b", "0.0.0.0:8000", "app:app"]

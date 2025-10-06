#!/usr/bin/env sh
set -e

# เตรียมโฟลเดอร์ฐานข้อมูล (เป็น volume ที่ mount เข้ามา)
mkdir -p /data
# กำหนดสิทธิ์ให้ appuser ทุกครั้งที่คอนเทนเนอร์เริ่ม
chown -R appuser:appuser /data

# รัน gunicorn ภายใต้ user ปกติ
exec su -s /bin/sh -c 'gunicorn -w 3 -b 0.0.0.0:8000 app:app' appuser

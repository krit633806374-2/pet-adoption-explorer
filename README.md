Pet Adoption Explorer 🐶🐱

Project Log : https://docs.google.com/document/d/1DBC4h8AnJlKbU-4P9VE8QVXPmSPK20EaQJwIdkDAn90/edit?usp=sharing

เว็บแอปค้นหาสัตว์เลี้ยงเพื่อรับเลี้ยงจาก Petfinder API พร้อมบันทึก “รายการโปรด” ลง SQLite ในเครื่อง/คลาวด์ มีหน้า UI และ REST API ครบถ้วน รองรับการดีพลอยด้วย Docker และ Railway

🔧 คุณสมบัติโดดเด่น

หน้าเว็บค้นหา (Find Pets) + หน้า My Favorites

เรียก Petfinder API แบบแบ่งหน้า (pagination)

บันทึก Favorites ลง SQLite + ส่งออก CSV

API สำหรับค้นหา/จัดการ favorites + health check

CI: GitHub Actions (lint + test + build)

รองรับ Docker / Railway PaaS

🧱 โครงสร้างโปรเจกต์
pet-adoption-explorer/

├─ app.py   # Flask app entry (ใช้กับ Gunicorn)

├─ controllers/

│  └─ app_controller.py        # เส้นทางทั้งหมดของแอป

├─ api/

│  └─ petfinder.py             # เรียก Petfinder API + mock fallback

├─ data/

│  └─ persistance.py           # ตัวจัดการ SQLite (favorites/history)

├─ models/

│  └─ pet.py                   # dataclass Pet

├─ templates/                  # HTML (Jinja2)

├─ static/                     # CSS/JS รูปภาพ

├─ tests/                      # pytest (API + persistence)

├─ Dockerfile

├─ docker-compose.yml

├─ requirements.txt

├─ pyproject.toml              # ruff/flake8 config

└─ README.md

✅ ข้อกำหนดเบื้องต้น (Prerequisites)

Python 3.10+

pip

(ตัวเลือก) Docker / Docker Compose

(ตัวเลือก) GitHub account + Railway account

🚀 วิธีติดตั้ง (Installation)
1) โคลนโปรเจกต์

git clone https://github.com/krit633806374-2/pet-adoption-explorer.git

cd pet-adoption-explorer

3) สร้าง Virtual Environment

Windows (CMD/PowerShell)

python -m venv .venv

.\.venv\Scripts\activate


macOS/Linux

python3 -m venv .venv

source .venv/bin/activate

3) ติดตั้ง dependencies
   
pip install -r requirements.txt

4) ตั้งค่า Environment Variables (ไฟล์ .env)

สร้างไฟล์ .env ที่รากโปรเจกต์ แล้วใส่ค่า:

# จำเป็นถ้าจะเรียก Petfinder จริง (ถ้าไม่ใส่จะใช้โหมด mock)

PETFINDER_API_KEY=ใส่คีย์ข

PETFINDER_API_SECRET=ใส่ซีเคร็ต

# พอร์ตที่รัน (Dev/Prod ใช้ 8000)

PORT=8000

# ตำแหน่งฐานข้อมูล SQLite (โลคัลจะสร้างที่ไฟล์นี้)

PETS_DB_PATH=./pets.db


หมายเหตุ: ถ้ายังไม่มีคีย์ Petfinder แอปจะใช้ mock mode คืนรายการตัวอย่างเพื่อให้ทดสอบ UI/Flow ได้

🏃‍♂️ รันแอปบนเครื่อง (Local Development)

ทางเลือก A: รันด้วย Flask dev server

python app.py


เปิดเบราว์เซอร์ไปที่:

UI: http://127.0.0.1:8000

Health: http://127.0.0.1:8000/health

 → {"ok": true}

ถ้าเข้า http://localhost:8000 ไม่ขึ้น ให้ใช้ http://127.0.0.1:8000 (บางเครื่อง DNS “localhost” ถูกปิด/เปลี่ยน)

ทางเลือก B: รันด้วย Docker Compose

docker compose up --build


เปิด http://127.0.0.1:8000

🧪 ทดสอบ & Lint

ติดตั้งเครื่องมือแล้วรัน:

# ติดตั้ง (ครั้งแรก)

pip install pytest ruff flake8

# รันเทสต์

pytest -q

# จัดรูปแบบ / ลินต์

ruff format .

ruff check . --fix

flake8 .

🗂️ SQLite & ไฟล์ข้อมูล

โค้ดจะสร้าง/ใช้ฐานข้อมูลตามตัวแปร PETS_DB_PATH (ดีฟอลต์ ./pets.db)

ข้อมูล Favorites และ History อยู่ในตาราง:

favorites

search_history

ส่งออก CSV: GET /api/favorites/export.csv

REST API (สำคัญ)

Method	Path	ใช้ทำอะไร

GET	/	หน้าเว็บหลัก (UI)

GET	/favorites	หน้า Favorites (UI)

GET	/health	Health check → {"ok": true}

GET	/api/search	ค้นหาสัตว์ (รองรับแบ่งหน้า)

GET	/api/favorites	อ่าน favorites ทั้งหมด

POST	/api/favorites	บันทึก favorite (JSON body = pet fields)

DELETE	/api/favorites/<pet_id>	ลบ favorite ตาม id

GET	/api/favorites/export.csv	ส่งออก CSV

GET	/api/history	อ่านประวัติการค้นหา (ล่าสุดก่อน)

DELETE	/api/history	ล้างประวัติการค้นหา

ดีพลอยด้วย Railway (ฟรี & ง่าย)

เราใช้ Dockerfile + Gunicorn บน Railway

เชื่อม GitHub Repo กับ Railway (Deployments → GitHub)

ไปที่ Variables แล้วเพิ่มค่า:

PORT=8000

FLASK_ENV=production

PETS_DB_PATH=/data/pets.db

(ถ้าต้องการเรียก API จริง) PETFINDER_API_KEY=..., PETFINDER_API_SECRET=...

ไปที่ Volumes สร้าง Volume ชื่อเช่น data แล้ว mount ที่ /data

กด Deploy ใหม่

ทดสอบ https://<subdomain>.up.railway.app/health → {"ok": true}

สำคัญ: บน Railway ห้ามใช้ VOLUME ใน Dockerfile (เราเอาออกแล้ว) ให้สร้าง Volume ผ่าน UI เท่านั้น

Production (Gunicorn)

ค่าเริ่มต้นใน Dockerfile:

CMD ["gunicorn", "-w", "3", "-b", "0.0.0.0:8000", "app:app"]


ต้องมี ENV PORT=8000 และเปิดพอร์ตเดียวกัน

อย่าลืมตั้ง PETS_DB_PATH=/data/pets.db และผูก Volume /data

🧩 ปัญหาที่พบบ่อย (Troubleshooting)

UI โชว์ “Error searching pets”

ตรวจ Logs → อาจเป็นเพราะไม่ได้ตั้ง PETFINDER_API_KEY/SECRET หรือคีย์หมดอายุ

หากไม่ตั้งค่า จะใช้ mock mode (จะยังเห็นรายการตัวอย่างได้)

localhost:8000 เข้าไม่ได้ แต่ 127.0.0.1:8000 เข้าได้

ใช้แบบ 127.0.0.1 ไปก่อน (ปัญหาการ map DNS “localhost” บางเครื่อง)

Railway error: '$PORT' is not a valid port number

ไปที่ Variables ใส่ PORT=8000 (เป็นตัวเลขล้วน) แล้ว Redeploy

Railway build log: The "VOLUME" keyword is banned

เอา VOLUME ออกจาก Dockerfile แล้วใช้ Railway Volume ผ่าน UI เท่านั้น

🧪 CI/CD

GitHub Actions จะรัน: ruff format, ruff check, pytest, และ (ถ้าผ่าน) build image

ทุกครั้งที่ git push สาขาหลัก Railway จะ redeploy อัตโนมัติ

👥 ทีม / บทบาท (ตัวอย่าง)

Dev(นิกกี้): พัฒนา API + UI, เขียนเทสต์

Ops(ภู): ดูแล Docker/Railway, ENV, Volume

Reviewer(พี): ตรวจ PR, โค้ดรีวิว, ทำ CI

(ปรับให้ตรงทีมจริงได้เลย)

🔒 หมายเหตุความปลอดภัย

ห้าม commit ไฟล์ .env, คีย์ API ใด ๆ ขึ้น Git

ใช้ Railway Variables เก็บความลับ

📝 License

MIT (หรือใส่ที่คุณต้องการ)

❤️ ขอบคุณ

Petfinder API

Railway, Docker, Flask, Gunicorn

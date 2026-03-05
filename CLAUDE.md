# COE Physics Dashboard (NAS Version)

Vanilla HTML/CSS/JS, hosted on Synology NAS. Data: PocketBase (SQLite)

## Structure
- `index.html` — หน้าหลัก
- `css/` — CSS แยกตาม component
- `js/config.js` — PocketBase URL
- `js/state.js` — Global state (DATA, pb instance, currentSheet, currentPage)
- `js/pocketbase-sync.js` — PocketBase realtime sync + CRUD
- `js/auth.js` — Login/logout via PocketBase Auth
- `js/user-management.js` — User CRUD via PocketBase
- `js/dashboard.js` — Render dashboard + inline editing
- `js/budget.js` — Budget page + inline editing
- `js/sheets-sync.js` — Save functions (calls saveAllProjects)
- `js/comparison.js` — เปรียบเทียบ sheet (Chart.js)
- `js/file-upload.js` — Parse xlsx (SheetJS)
- `js/default-data.js`, `utils.js`, `accordion.js`, `app.js`
- `docker-compose.yml` — PocketBase container

## JS Load Order
1: config → default-data → state → 2: utils → 3: ที่เหลือ → 4: app

## PocketBase Collections
- `projects` — name, info(json), outputs(json), budget(json), workplan(json), researchers(json)
- `users` — username, password, role, displayName (built-in auth collection)

## Architecture
```
ผู้ใช้ (เบราว์เซอร์)
    ├── :8088 → Web Station (Nginx) → /volume2/coe-dashboard/  (static files)
    └── :8090 → PocketBase (Docker) → SQLite database
```

## URLs
- **เว็บ Dashboard**: http://202.28.43.149:8088
- **PocketBase API**: http://202.28.43.149:8090
- **PocketBase Admin**: http://202.28.43.149:8090/_/

## Auth
- PocketBase identity field = email only (ไม่รองรับ username โดยตรง)
- Login: โค้ดแปลง username → `username@coe.local` แล้วส่ง auth (auth.js)
- สร้าง user: auto generate email เป็น `username@coe.local` (user-management.js)

## PocketBase API Rules
- `projects`: ทุก rule (List/View/Create/Update/Delete) ปลดล็อคหมด
- `users`: ทุก rule ปลดล็อค + Authentication rule ปลดล็อค, Manage rule = Superusers only
- Options → Identity/Password → Unique identity fields = `email`

## Roles
- `admin` — เห็นทุกอย่าง (เพิ่ม/ลบโครงการ, จัดการ user, import xlsx)
- `leader` — แก้ไขข้อมูลโครงการได้ แต่ไม่เห็นปุ่ม เพิ่ม/ลบโครงการ, จัดการ user, import
- สิทธิ์ leader ถูกจำกัดใน: dashboard.js, budget.js, workplan.js, auth.js

## Deploy
```bash
# 1. PocketBase รันผ่าน Docker (docker-compose up -d)
# 2. Web files อยู่ที่ /volume2/coe-dashboard/
# 3. Web Station portal: port-based, port 8088, document root /volume2/coe-dashboard
# 4. PB_URL ใน js/config.js = http://202.28.43.149:8090
```

## Deploy (อัปเดตไฟล์)
```bash
rsync -avz --exclude='.git' --exclude='CLAUDE.md' --exclude='docker-compose.yml' \
  /home/santa/Workspace/sut-physics-nas/ santa@202.28.43.149:/volume2/coe-dashboard/
# ผู้ใช้ refresh หน้าเว็บ — เห็นการเปลี่ยนแปลงทันที (static files, ไม่ต้อง restart)
```

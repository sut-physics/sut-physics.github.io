# COE Physics Dashboard

Vanilla HTML/CSS/JS, GitHub Pages. Data: Google Sheets ↔ Firebase ↔ Dashboard

## Structure
- `index.html` — หน้าหลัก
- `css/` — CSS แยกตาม component
- `js/config.js` — Firebase config, password, Apps Script URL
- `js/state.js` — Global state (DATA, currentSheet, currentPage)
- `js/dashboard.js` — Render dashboard + inline editing
- `js/budget.js` — Budget page + inline editing
- `js/sheets-sync.js` — Sync ไป Google Sheets (cell mapping)
- `js/firebase-sync.js` — Firebase realtime sync
- `js/comparison.js` — เปรียบเทียบ sheet (Chart.js)
- `js/file-upload.js` — Parse xlsx (SheetJS)
- `js/default-data.js`, `utils.js`, `accordion.js`, `auth.js`, `app.js`

## JS Load Order
1: config → default-data → state → 2: utils → 3: ที่เหลือ → 4: app

## Cell Mapping (Google Sheets)
- Project Info: B2-B9, E6, G6, I6, E8, G8 (G8=สูตร ห้ามเขียนทับ)
- Outputs: row 13-52, Col B=target, D=completed, H-Q=ชื่อ
- Budget: row 62-80, 5 หมวด (ค่าใช้สอย/วัสดุ/จ้าง/เดินทาง/ครุภัณฑ์)
- ดูรายละเอียด cell mapping ใน `js/sheets-sync.js`

## Deploy
```bash
git push origin main  # GitHub Pages auto-deploy
```

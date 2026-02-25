# CLAUDE.md - COE Physics Dashboard

## Project Overview
Dashboard สำหรับติดตามผลผลิตวิจัย ศูนย์ความเป็นเลิศด้านฟิสิกส์ (มทส.)
- **Tech:** Vanilla HTML/CSS/JS (ไม่มี framework), GitHub Pages
- **Data flow:** Google Sheets → Apps Script → Firebase Realtime DB → Dashboard
- **Bidirectional:** แก้ไขข้อมูลบน Dashboard → save กลับ Firebase + Google Sheets

## Architecture

### File Structure
```
index.html              ← หน้าหลัก (login, dashboard, comparison)
css/                    ← 10 CSS files แยกตาม component
js/
  config.js             ← Firebase config, APP_PASSWORD, APPS_SCRIPT_URL
  default-data.js       ← ข้อมูลตั้งต้น
  state.js              ← Global state: DATA, currentSheet, currentPage
  utils.js              ← formatNumber(), showStatus()
  sheets-sync.js        ← Sync dashboard → Google Sheets (cell mapping)
  dashboard.js          ← Render dashboard + inline editing
  comparison.js         ← เปรียบเทียบ sheet (Chart.js)
  accordion.js          ← Accordion component
  file-upload.js        ← Parse xlsx → DATA (SheetJS)
  firebase-sync.js      ← Firebase realtime sync
  auth.js               ← Login (password: coe2024)
  app.js                ← Bootstrap + event listeners
google-apps-script-doPost.js  ← Reference code สำหรับ Apps Script (doPost)
```

### JS Loading Order (สำคัญ!)
Layer 1: config → default-data → state
Layer 2: utils
Layer 3: accordion → sheets-sync → dashboard → comparison → file-upload → firebase-sync → auth
Layer 4: app

### Data Structure (DATA.sheets[])
```js
{
  name: "SheetName",
  info: {
    projectName, projectNameEng, leader, duration,
    fiscalYear, budget, usedBudget, remainingBudget,
    projectCode, startDate, endDate, extendDate
  },
  outputs: [
    { name: "หมวด", items: [
      { name: "รายการ", target: 0, completed: 0, names: ["ชื่อ1", "ชื่อ2"] }
    ]}
  ]
}
```

## Google Sheets Cell Mapping
ตำแหน่ง cell ใน Google Sheets ที่ map กับข้อมูล:

**Project Info:**
| Field | Cell | หมายเหตุ |
|-------|------|----------|
| projectName | B2 | |
| projectNameEng | B3 | |
| leader | B4 | |
| duration | B6 | |
| startDate | E6 | |
| endDate | G6 | |
| extendDate | I6 | |
| fiscalYear | B7 | |
| budget | B8 | |
| usedBudget | E8 | |
| remainingBudget | G8 | **สูตร =B8-E8** ห้ามเขียนทับ! |
| projectCode | B9 | |

**Output Categories (9 หมวด):**
| # | หมวด | Rows |
|---|------|------|
| 0 | กำลังคน | 13,14,15,16,17,18,19 |
| 1 | บทความวิจัย | 22,23,24,25,26,27 |
| 2 | หนังสือ | 30 |
| 3 | ต้นแบบ/เทคโนโลยี | 33,34,35 |
| 4 | ทรัพย์สินทางปัญญา | 38 |
| 5 | เครื่องมือ/โครงสร้างพื้นฐาน | 41 |
| 6 | ฐานข้อมูล/ระบบ | 44 |
| 7 | เครือข่าย | 47,48 |
| 8 | การลงทุนวิจัย | 51,52 |

- Column B = target, Column D = completed
- Columns H-Q = รายชื่อ (สูงสุด 10 คน)

## External Services
- **Firebase:** coe-dashboard-sheet (asia-southeast1)
- **Google Sheet ID:** 1D1Upkcj7fB760vdaO0py-JjiAWPi3ASt73H7gvDKrZI
- **Apps Script:** URL อยู่ใน config.js (APPS_SCRIPT_URL)
- **Deploy:** GitHub Pages, auto-deploy on push to main

## Inline Editing (ฟีเจอร์ปัจจุบัน)
- คลิกค่าใน Project Info → แก้ไขได้ → save Firebase + Google Sheets
- Output table: target/completed เป็น input number
- Names: คลิกแก้ไข + ปุ่ม "+" เพิ่มรายชื่อ
- remainingBudget คำนวณอัตโนมัติจาก budget - usedBudget

## Commands
```bash
# ไม่มี build step - static files
# Deploy: push to main branch → GitHub Actions auto-deploy
git push origin main
```

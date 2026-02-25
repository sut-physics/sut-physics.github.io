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
  budget.js             ← Budget details page + inline editing
  auth.js               ← Login (password: coe2024)
  app.js                ← Bootstrap + event listeners
apps_script.txt          ← Reference code สำหรับ Apps Script (syncSheetsToFirebase, doPost, getBudgetData)
```

### JS Loading Order (สำคัญ!)
Layer 1: config → default-data → state
Layer 2: utils
Layer 3: accordion → sheets-sync → budget → dashboard → comparison → file-upload → firebase-sync → auth
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
  ],
  budget: [
    { type: "งบดำเนินงาน", categories: [
      { name: "ค่าใช้สอย", totalBudget: 0, totalUsed: 0, totalRemaining: 0,
        items: [{ name: "รายการ", budget: 0, used: 0, remaining: 0 }] }
    ]}
  ],
  rawData: { "A1": "value", ... }  // ข้อมูลดิบจาก Google Sheets ทุก cell
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

**Budget Details (row 62-80):**
| หมวด | ชื่อรายการ | งบประมาณ | ใช้ไป | คงเหลือ | รวม (row 64) |
|------|-----------|---------|------|---------|-------------|
| ค่าใช้สอย | A65-A80 | B65-B80 | C65-C80 | D65-D80 | B64,C64,D64 |
| ค่าวัสดุ | F65-F80 | G65-G80 | H65-H80 | I65-I80 | G64,H64,I64 |
| ค่าจ้าง | K65-K80 | L65-L80 | M65-M80 | N65-N80 | L64,M64,N64 |
| ค่าเดินทางไปต่างประเทศ | P65-P80 | Q65-Q80 | R65-R80 | S65-S80 | Q64,R64,S64 |
| ครุภัณฑ์ (งบลงทุน) | U65-U80 | V65-V80 | W65-W80 | X65-X80 | V64,W64,X64 |

- งบดำเนินงาน: A62, F62, K62, P62 / งบลงทุน: U62

## External Services
- **Firebase:** coe-dashboard-sheet (asia-southeast1)
- **Google Sheet ID:** 1D1Upkcj7fB760vdaO0py-JjiAWPi3ASt73H7gvDKrZI
- **Apps Script:** URL อยู่ใน config.js (APPS_SCRIPT_URL)
- **Deploy:** GitHub Pages, auto-deploy on push to main

## Pages & Features
1. **Dashboard** — Project info + output table, inline editing
2. **รายละเอียดงบประมาณ** — Budget breakdown (งบดำเนินงาน/งบลงทุน), summary cards, edit/add items
3. **เปรียบเทียบ Sheet** — Compare outputs across sheets (Chart.js)

## Inline Editing
- คลิกค่าใน Project Info → แก้ไขได้ → save Firebase + Google Sheets
- Output table: target/completed เป็น input number
- Names: คลิกแก้ไข + ปุ่ม "+" เพิ่มรายชื่อ
- remainingBudget คำนวณอัตโนมัติจาก budget - usedBudget
- Budget: แก้ไข/เพิ่มรายการงบประมาณ → save Firebase
- Budget summary cards fallback ไปใช้ info.budget เมื่อยังไม่มี detail items

## Commands
```bash
# ไม่มี build step - static files
# Deploy: push to main branch → GitHub Actions auto-deploy
git push origin main
```

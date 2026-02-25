// ============================================================
// Google Sheets Sync Module
// ส่งข้อมูลที่แก้ไขบน Dashboard กลับไปเขียนใน Google Sheets
// ============================================================

// Map: info field → Google Sheets cell
var INFO_CELL_MAP = {
    projectName: 'B2',
    projectNameEng: 'B3',
    leader: 'B4',
    duration: 'B6',
    startDate: 'E6',
    endDate: 'G6',
    extendDate: 'I6',
    fiscalYear: 'B7',
    budget: 'B8',
    usedBudget: 'E8',
    // remainingBudget ไม่ส่ง — G8 เป็นสูตร =B8-E8 ใน Google Sheets
    projectCode: 'B9'
};

// Map: category index → row numbers (ตรงกับ Apps Script getOutputs)
var OUTPUT_ROWS = [
    [13, 14, 15, 16, 17, 18, 19],  // 0: กำลังคน
    [22, 23, 24, 25, 26, 27],       // 1: ต้นฉบับบทความวิจัย
    [30],                            // 2: หนังสือ
    [33, 34, 35],                    // 3: ต้นแบบผลิตภัณฑ์/เทคโนโลยี
    [38],                            // 4: ทรัพย์สินทางปัญญา
    [41],                            // 5: เครื่องมือและโครงสร้างพื้นฐาน
    [44],                            // 6: ฐานข้อมูล/ระบบ
    [47, 48],                        // 7: เครือข่าย
    [51, 52]                         // 8: การลงทุนวิจัย
];

// Column letters สำหรับ names (H-Q)
var NAME_COLUMNS = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];

// ส่งข้อมูลไป Google Sheets ผ่าน Apps Script
function postToGoogleSheets(sheetName, updates) {
    if (!APPS_SCRIPT_URL) {
        console.log('APPS_SCRIPT_URL not set, skipping Google Sheets sync');
        return Promise.resolve();
    }

    return fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sheetName: sheetName,
            updates: updates
        })
    }).then(function() {
        console.log('Sent to Google Sheets:', sheetName, updates);
    }).catch(function(err) {
        console.error('Google Sheets sync error:', err);
    });
}

// บันทึก info field (ชื่อโครงการ, งบประมาณ, ฯลฯ)
function saveInfoField(sheetIdx, field, value) {
    var sheet = DATA.sheets[sheetIdx];
    if (!sheet) return;

    // อัปเดต DATA
    sheet.info[field] = value;

    // คำนวณ remainingBudget อัตโนมัติ (เหมือนสูตร =B8-E8 ใน Google Sheets)
    if (field === 'budget' || field === 'usedBudget') {
        var budget = Number(sheet.info.budget) || 0;
        var used = Number(sheet.info.usedBudget) || 0;
        sheet.info.remainingBudget = String(budget - used);
        // อัปเดต UI ของ remainingBudget
        var remainEl = document.querySelector('.editable-cell[data-field="remainingBudget"]');
        if (remainEl && !remainEl.querySelector('input')) {
            remainEl.textContent = formatNumber(sheet.info.remainingBudget);
        }
    }

    // Save Firebase
    saveAllToFirebase();

    // Save Google Sheets (ไม่ส่ง remainingBudget เพราะเป็นสูตร)
    if (field === 'remainingBudget') return;
    var cell = INFO_CELL_MAP[field];
    if (cell) {
        postToGoogleSheets(sheet.name, [{ cell: cell, value: value }]);
    }
}

// บันทึก output field (target/completed)
function saveOutputField(sheetIdx, catIdx, itemIdx, field, value) {
    var sheet = DATA.sheets[sheetIdx];
    if (!sheet) return;

    // อัปเดต DATA
    var numValue = parseInt(value) || 0;
    sheet.outputs[catIdx].items[itemIdx][field] = numValue;

    // Save Firebase
    saveAllToFirebase();

    // Save Google Sheets
    var row = OUTPUT_ROWS[catIdx] && OUTPUT_ROWS[catIdx][itemIdx];
    if (row) {
        var col = field === 'target' ? 'B' : 'D';
        postToGoogleSheets(sheet.name, [{ cell: col + row, value: numValue }]);
    }
}

// ============================================================
// Budget Cell Mapping (rows 62-80)
// ============================================================

var BUDGET_CELL_MAP = [
    { nameCol: 'A', budgetCol: 'B', usedCol: 'C', remainingCol: 'D', totalRow: 64, itemStartRow: 65, itemEndRow: 80 }, // 0: ค่าใช้สอย
    { nameCol: 'F', budgetCol: 'G', usedCol: 'H', remainingCol: 'I', totalRow: 64, itemStartRow: 65, itemEndRow: 80 }, // 1: ค่าวัสดุ
    { nameCol: 'K', budgetCol: 'L', usedCol: 'M', remainingCol: 'N', totalRow: 64, itemStartRow: 65, itemEndRow: 80 }, // 2: ค่าจ้าง
    { nameCol: 'P', budgetCol: 'Q', usedCol: 'R', remainingCol: 'S', totalRow: 64, itemStartRow: 65, itemEndRow: 80 }, // 3: ค่าเดินทางไปต่างประเทศ
    { nameCol: 'U', budgetCol: 'V', usedCol: 'W', remainingCol: 'X', totalRow: 64, itemStartRow: 65, itemEndRow: 80 }  // 4: ครุภัณฑ์
];

// Map budget type index + category index → BUDGET_CELL_MAP index
// งบดำเนินงาน (typeIdx=0): categories[0-3] → BUDGET_CELL_MAP[0-3]
// งบลงทุน (typeIdx=1): categories[0] → BUDGET_CELL_MAP[4]
function getBudgetCellMapIndex(typeIdx, catIdx) {
    if (typeIdx === 0) return catIdx;       // 0,1,2,3
    if (typeIdx === 1) return 4 + catIdx;   // 4+
    return -1; // ไม่มี mapping (งบใหม่ที่สร้างเอง)
}

// Sync budget data ไป Google Sheets (เขียนเฉพาะ name, budget, used — ไม่เขียน remaining/totals เพราะเป็นสูตร)
function syncBudgetToSheets(sheet) {
    if (!sheet.budget) return;

    sheet.budget.forEach(function(budgetType, typeIdx) {
        budgetType.categories.forEach(function(cat, catIdx) {
            var mapIdx = getBudgetCellMapIndex(typeIdx, catIdx);
            if (mapIdx < 0 || mapIdx >= BUDGET_CELL_MAP.length) return; // ไม่มี mapping

            var map = BUDGET_CELL_MAP[mapIdx];
            var updates = [];

            cat.items.forEach(function(item, itemIdx) {
                var row = map.itemStartRow + itemIdx;
                if (row > map.itemEndRow) return;

                updates.push({ cell: map.nameCol + row, value: item.name || '' });
                updates.push({ cell: map.budgetCol + row, value: Number(item.budget) || 0 });
                updates.push({ cell: map.usedCol + row, value: Number(item.used) || 0 });
                // remaining ไม่เขียน — เป็นสูตรใน Google Sheets
            });

            if (updates.length > 0) {
                postToGoogleSheets(sheet.name, updates);
            }
        });
    });
}

// บันทึก names
function saveOutputNames(sheetIdx, catIdx, itemIdx, names) {
    var sheet = DATA.sheets[sheetIdx];
    if (!sheet) return;

    // อัปเดต DATA
    sheet.outputs[catIdx].items[itemIdx].names = names;

    // Save Firebase
    saveAllToFirebase();

    // Save Google Sheets
    var row = OUTPUT_ROWS[catIdx] && OUTPUT_ROWS[catIdx][itemIdx];
    if (row) {
        var updates = NAME_COLUMNS.map(function(col, i) {
            return { cell: col + row, value: names[i] || '' };
        });
        postToGoogleSheets(sheet.name, updates);
    }
}

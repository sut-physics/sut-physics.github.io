// ============================================================
// Budget Details Module
// แสดงรายละเอียดงบประมาณ แก้ไข เพิ่มรายการ sync Firebase + Google Sheets
// ============================================================

var budgetEditMode = false;
var budgetSnapshot = null;
var currentBudgetTypeIdx = 0;
var currentBudgetCatIdx = 0;

// โครงสร้างเริ่มต้นสำหรับ budget (ใช้เมื่อ sheet ยังไม่มี budget)
function getDefaultBudgetStructure() {
    function emptyItems(count) {
        var items = [];
        for (var i = 0; i < count; i++) {
            items.push({ name: '', budget: 0, used: 0, remaining: 0 });
        }
        return items;
    }

    return [
        {
            type: 'งบดำเนินงาน',
            categories: [
                { name: 'ค่าใช้สอย', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: emptyItems(16) },
                { name: 'ค่าวัสดุ', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: emptyItems(16) },
                { name: 'ค่าจ้าง', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: emptyItems(16) },
                { name: 'ค่าเดินทางไปต่างประเทศ', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: emptyItems(16) }
            ]
        },
        {
            type: 'งบลงทุน',
            categories: [
                { name: 'ครุภัณฑ์', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: emptyItems(16) }
            ]
        }
    ];
}

// ดึง budget จาก rawData (fallback เมื่อ Apps Script ยังไม่ได้ extract budget)
function parseBudgetFromRawData(rawData) {
    if (!rawData) return null;

    var budgetTypes = [
        {
            type: 'งบดำเนินงาน',
            categories: [
                { name: 'ค่าใช้สอย', nameCol: 'A', budgetCol: 'B', usedCol: 'C', remainingCol: 'D' },
                { name: 'ค่าวัสดุ', nameCol: 'F', budgetCol: 'G', usedCol: 'H', remainingCol: 'I' },
                { name: 'ค่าจ้าง', nameCol: 'K', budgetCol: 'L', usedCol: 'M', remainingCol: 'N' },
                { name: 'ค่าเดินทางไปต่างประเทศ', nameCol: 'P', budgetCol: 'Q', usedCol: 'R', remainingCol: 'S' }
            ]
        },
        {
            type: 'งบลงทุน',
            categories: [
                { name: 'ครุภัณฑ์', nameCol: 'U', budgetCol: 'V', usedCol: 'W', remainingCol: 'X' }
            ]
        }
    ];

    var hasData = false;

    var result = budgetTypes.map(function(bt) {
        var cats = bt.categories.map(function(cat) {
            var items = [];
            for (var row = 65; row <= 80; row++) {
                var name = rawData[cat.nameCol + row] ? String(rawData[cat.nameCol + row]) : '';
                var budget = Number(rawData[cat.budgetCol + row]) || 0;
                var used = Number(rawData[cat.usedCol + row]) || 0;
                var remaining = Number(rawData[cat.remainingCol + row]) || 0;
                if (name || budget || used) hasData = true;
                items.push({ name: name, budget: budget, used: used, remaining: remaining });
            }

            return {
                name: cat.name,
                totalBudget: Number(rawData[cat.budgetCol + '64']) || 0,
                totalUsed: Number(rawData[cat.usedCol + '64']) || 0,
                totalRemaining: Number(rawData[cat.remainingCol + '64']) || 0,
                items: items
            };
        });
        return { type: bt.type, categories: cats };
    });

    return hasData ? result : null;
}

// ตรวจสอบและสร้างโครงสร้าง budget ถ้ายังไม่มี
function ensureBudgetStructure(sheet) {
    if (!sheet.budget || !Array.isArray(sheet.budget) || sheet.budget.length === 0) {
        // ลอง parse จาก rawData ก่อน
        var parsed = parseBudgetFromRawData(sheet.rawData);
        if (parsed) {
            sheet.budget = parsed;
        } else {
            sheet.budget = getDefaultBudgetStructure();
        }
    }
}

// คำนวณ totals ของ category จาก items
function recalcBudgetTotals(category) {
    var totalBudget = 0, totalUsed = 0;
    category.items.forEach(function(item) {
        var b = Number(item.budget) || 0;
        var u = Number(item.used) || 0;
        item.remaining = b - u;
        totalBudget += b;
        totalUsed += u;
    });
    category.totalBudget = totalBudget;
    category.totalUsed = totalUsed;
    category.totalRemaining = totalBudget - totalUsed;
}

// คำนวณรวมทุก budget types
function calcBudgetGrandTotals(budget) {
    var totalBudget = 0, totalUsed = 0, totalRemaining = 0;
    budget.forEach(function(bt) {
        bt.categories.forEach(function(cat) {
            recalcBudgetTotals(cat);
            totalBudget += cat.totalBudget;
            totalUsed += cat.totalUsed;
            totalRemaining += cat.totalRemaining;
        });
    });
    return { totalBudget: totalBudget, totalUsed: totalUsed, totalRemaining: totalRemaining };
}

// ============================================================
// Render Functions
// ============================================================

function renderBudgetPage() {
    var sheet = DATA.sheets[currentSheet];
    if (!sheet) return;
    ensureBudgetStructure(sheet);

    // Validate indices
    if (currentBudgetTypeIdx >= sheet.budget.length) currentBudgetTypeIdx = 0;
    var budgetType = sheet.budget[currentBudgetTypeIdx];
    if (currentBudgetCatIdx >= budgetType.categories.length) currentBudgetCatIdx = 0;

    renderBudgetSummaryCards(sheet.budget, sheet.info);
    renderBudgetTypeTabs(sheet.budget);
    renderBudgetSubcatTabs(budgetType);
    renderBudgetTable(budgetType.categories[currentBudgetCatIdx]);
    updateBudgetEditButtons();
}

function renderBudgetSummaryCards(budget, info) {
    var container = document.getElementById('budgetSummaryCards');
    if (!container) return;

    var totals = calcBudgetGrandTotals(budget);

    // ถ้ายังไม่มีรายการ budget detail ให้ใช้ข้อมูลจาก project info แทน
    var displayBudget = totals.totalBudget;
    var displayUsed = totals.totalUsed;
    var displayRemaining = totals.totalRemaining;

    if (totals.totalBudget === 0 && info) {
        displayBudget = Number(info.budget) || 0;
        displayUsed = Number(info.usedBudget) || 0;
        displayRemaining = Number(info.remainingBudget) || (displayBudget - displayUsed);
    }

    container.innerHTML =
        '<div class="budget-summary-card total">' +
            '<div class="budget-value">' + formatNumber(displayBudget) + '</div>' +
            '<div class="budget-label">งบประมาณรวม (บาท)</div>' +
        '</div>' +
        '<div class="budget-summary-card used">' +
            '<div class="budget-value">' + formatNumber(displayUsed) + '</div>' +
            '<div class="budget-label">ใช้จ่ายแล้ว (บาท)</div>' +
        '</div>' +
        '<div class="budget-summary-card remaining">' +
            '<div class="budget-value">' + formatNumber(displayRemaining) + '</div>' +
            '<div class="budget-label">คงเหลือ (บาท)</div>' +
        '</div>';
}

function renderBudgetTypeTabs(budget) {
    var container = document.getElementById('budgetTypeTabs');
    if (!container) return;

    var html = '';
    budget.forEach(function(bt, idx) {
        var activeClass = idx === currentBudgetTypeIdx ? ' active' : '';
        html += '<button class="budget-type-tab' + activeClass + '" onclick="switchBudgetType(' + idx + ')">' + bt.type + '</button>';
    });
    container.innerHTML = html;
}

function renderBudgetSubcatTabs(budgetType) {
    var container = document.getElementById('budgetSubcatTabs');
    if (!container) return;

    var html = '';
    budgetType.categories.forEach(function(cat, idx) {
        var activeClass = idx === currentBudgetCatIdx ? ' active' : '';
        html += '<button class="budget-subcat-tab' + activeClass + '" onclick="switchBudgetSubcat(' + idx + ')">' + cat.name + '</button>';
    });
    container.innerHTML = html;
}

function renderBudgetTable(category) {
    var tbody = document.getElementById('budgetTableBody');
    if (!tbody) return;

    // Update thead to show/hide delete column
    var thead = tbody.closest('table').querySelector('thead tr');
    if (thead) {
        var existingDeleteTh = thead.querySelector('.budget-delete-th');
        if (budgetEditMode && !existingDeleteTh) {
            var th = document.createElement('th');
            th.className = 'budget-delete-th';
            th.style.width = '40px';
            thead.appendChild(th);
        } else if (!budgetEditMode && existingDeleteTh) {
            existingDeleteTh.remove();
        }
    }

    recalcBudgetTotals(category);

    var html = '';
    var hasItems = false;

    category.items.forEach(function(item, idx) {
        // แสดงเฉพาะ items ที่มีชื่อ หรือ edit mode
        if (!item.name && !budgetEditMode) return;
        hasItems = true;

        if (budgetEditMode) {
            html += '<tr>' +
                '<td><input type="text" class="budget-name-input" value="' + escapeHtml(item.name || '') + '" data-item-idx="' + idx + '" data-field="name"></td>' +
                '<td class="number"><input type="number" class="budget-inline-input" value="' + (Number(item.budget) || 0) + '" data-item-idx="' + idx + '" data-field="budget" min="0"></td>' +
                '<td class="number"><input type="number" class="budget-inline-input" value="' + (Number(item.used) || 0) + '" data-item-idx="' + idx + '" data-field="used" min="0"></td>' +
                '<td class="number">' + formatNumber(item.remaining) + '</td>' +
                '<td class="budget-delete-cell"><button class="budget-delete-btn" onclick="deleteBudgetItem(' + idx + ')" title="ลบรายการ">&times;</button></td>' +
                '</tr>';
        } else {
            html += '<tr>' +
                '<td>' + escapeHtml(item.name) + '</td>' +
                '<td class="number">' + formatNumber(item.budget) + '</td>' +
                '<td class="number">' + formatNumber(item.used) + '</td>' +
                '<td class="number">' + formatNumber(item.remaining) + '</td>' +
                '</tr>';
        }
    });

    if (!hasItems && !budgetEditMode) {
        html += '<tr class="empty-row"><td colspan="4">ยังไม่มีรายการ</td></tr>';
    }

    // Total row
    html += '<tr class="total-row">' +
        '<td>รวม</td>' +
        '<td class="number">' + formatNumber(category.totalBudget) + '</td>' +
        '<td class="number">' + formatNumber(category.totalUsed) + '</td>' +
        '<td class="number">' + formatNumber(category.totalRemaining) + '</td>' +
        (budgetEditMode ? '<td></td>' : '') +
        '</tr>';

    tbody.innerHTML = html;

    if (budgetEditMode) {
        attachBudgetEditListeners();
    }
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// Tab Switching
// ============================================================

function switchBudgetType(idx) {
    currentBudgetTypeIdx = idx;
    currentBudgetCatIdx = 0;
    renderBudgetPage();
}

function switchBudgetSubcat(idx) {
    currentBudgetCatIdx = idx;
    renderBudgetPage();
}

// ============================================================
// Edit Mode
// ============================================================

function updateBudgetEditButtons() {
    var container = document.getElementById('editBudgetBtnContainer');
    if (!container) return;

    if (budgetEditMode) {
        container.innerHTML =
            '<div class="budget-btn-group">' +
                '<button class="edit-toggle-btn save-btn" onclick="saveBudgetEditMode()">บันทึก</button>' +
                '<button class="edit-toggle-btn cancel-btn" onclick="cancelBudgetEditMode()">ยกเลิก</button>' +
            '</div>';
    } else {
        container.innerHTML =
            '<div class="budget-btn-group">' +
                '<button class="edit-toggle-btn" onclick="toggleBudgetEditMode()">แก้ไข</button>' +
                '<button class="edit-toggle-btn" onclick="showAddBudgetItemModal()">+ เพิ่มรายการ</button>' +
            '</div>';
    }
}

function toggleBudgetEditMode() {
    if (!budgetEditMode) {
        var sheet = DATA.sheets[currentSheet];
        budgetSnapshot = JSON.parse(JSON.stringify(sheet.budget));
        budgetEditMode = true;
    }
    renderBudgetPage();
}

function saveBudgetEditMode() {
    if (!confirm('ยืนยันการบันทึกข้อมูลงบประมาณ?')) return;

    var sheet = DATA.sheets[currentSheet];

    // Recalc all totals
    sheet.budget.forEach(function(bt) {
        bt.categories.forEach(function(cat) {
            recalcBudgetTotals(cat);
        });
    });

    // Save to Firebase
    saveAllToFirebase();

    // Sync to Google Sheets
    if (typeof syncBudgetToSheets === 'function') {
        syncBudgetToSheets(sheet);
    }

    budgetEditMode = false;
    budgetSnapshot = null;
    renderBudgetPage();
    showStatus('success', 'บันทึกข้อมูลงบประมาณเรียบร้อยแล้ว');
}

function cancelBudgetEditMode() {
    if (budgetSnapshot) {
        DATA.sheets[currentSheet].budget = JSON.parse(JSON.stringify(budgetSnapshot));
    }
    budgetEditMode = false;
    budgetSnapshot = null;
    renderBudgetPage();
}

function attachBudgetEditListeners() {
    var inputs = document.querySelectorAll('#budgetTableBody .budget-inline-input, #budgetTableBody .budget-name-input');
    inputs.forEach(function(input) {
        input.addEventListener('input', function() {
            var itemIdx = parseInt(this.dataset.itemIdx);
            var field = this.dataset.field;
            var sheet = DATA.sheets[currentSheet];
            var budgetType = sheet.budget[currentBudgetTypeIdx];
            var category = budgetType.categories[currentBudgetCatIdx];
            var item = category.items[itemIdx];

            if (field === 'name') {
                item.name = this.value;
            } else {
                item[field] = Number(this.value) || 0;
                // Recalc remaining
                item.remaining = (Number(item.budget) || 0) - (Number(item.used) || 0);
                recalcBudgetTotals(category);
                // Update remaining display and totals
                renderBudgetSummaryCards(sheet.budget);
                // Update remaining cell and total row in table without full re-render
                var totalRow = document.querySelector('#budgetTableBody .total-row');
                if (totalRow) {
                    var cells = totalRow.querySelectorAll('td.number');
                    if (cells.length >= 3) {
                        cells[0].textContent = formatNumber(category.totalBudget);
                        cells[1].textContent = formatNumber(category.totalUsed);
                        cells[2].textContent = formatNumber(category.totalRemaining);
                    }
                }
                // Update remaining cell for this item
                var row = this.closest('tr');
                if (row) {
                    var remainingCell = row.querySelectorAll('td.number');
                    var lastNumCell = remainingCell[remainingCell.length - 1];
                    if (lastNumCell && !lastNumCell.querySelector('input')) {
                        lastNumCell.textContent = formatNumber(item.remaining);
                    }
                }
            }
        });
    });
}

function deleteBudgetItem(itemIdx) {
    var sheet = DATA.sheets[currentSheet];
    var category = sheet.budget[currentBudgetTypeIdx].categories[currentBudgetCatIdx];
    var item = category.items[itemIdx];
    var itemName = item.name || 'รายการที่ ' + (itemIdx + 1);

    if (!confirm('ลบรายการ "' + itemName + '" ?')) return;

    category.items.splice(itemIdx, 1);
    recalcBudgetTotals(category);
    renderBudgetPage();
}

// ============================================================
// Add Item Modal
// ============================================================

function showAddBudgetItemModal() {
    var sheet = DATA.sheets[currentSheet];
    ensureBudgetStructure(sheet);

    var overlay = document.createElement('div');
    overlay.className = 'budget-modal-overlay';
    overlay.id = 'budgetModalOverlay';

    // Build budget type options
    var typeOptions = '';
    sheet.budget.forEach(function(bt, idx) {
        var selected = idx === currentBudgetTypeIdx ? ' selected' : '';
        typeOptions += '<option value="' + idx + '"' + selected + '>' + bt.type + '</option>';
    });
    typeOptions += '<option value="__new__">+ งบใหม่ (พิมพ์ชื่อ)</option>';

    // Build subcategory options for current type
    var subcatOptions = buildSubcatOptions(sheet.budget[currentBudgetTypeIdx]);

    overlay.innerHTML =
        '<div class="budget-modal">' +
            '<h3>เพิ่มรายการงบประมาณ</h3>' +
            '<div class="budget-modal-field">' +
                '<label>ประเภทงบ</label>' +
                '<select id="addBudgetTypeSelect" onchange="onAddBudgetTypeChange()">' + typeOptions + '</select>' +
            '</div>' +
            '<div class="budget-modal-field" id="newBudgetTypeField" style="display:none;">' +
                '<label>ชื่องบใหม่</label>' +
                '<input type="text" id="newBudgetTypeName" placeholder="เช่น งบอุดหนุน">' +
            '</div>' +
            '<div class="budget-modal-field">' +
                '<label>หมวดค่าใช้จ่าย</label>' +
                '<select id="addBudgetCatSelect" onchange="onAddBudgetCatChange()">' + subcatOptions + '</select>' +
            '</div>' +
            '<div class="budget-modal-field" id="newBudgetCatField" style="display:none;">' +
                '<label>ชื่อหมวดใหม่</label>' +
                '<input type="text" id="newBudgetCatName" placeholder="เช่น ค่าสาธารณูปโภค">' +
            '</div>' +
            '<div class="budget-modal-field">' +
                '<label>ชื่อรายการ</label>' +
                '<input type="text" id="addBudgetItemName" placeholder="เช่น ค่าจ้างเหมาบริการ">' +
            '</div>' +
            '<div class="budget-modal-buttons">' +
                '<button class="btn-cancel" onclick="closeBudgetModal()">ยกเลิก</button>' +
                '<button class="btn-primary" onclick="confirmAddBudgetItem()">เพิ่มรายการ</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeBudgetModal();
    });
}

function buildSubcatOptions(budgetType) {
    var html = '';
    if (budgetType) {
        budgetType.categories.forEach(function(cat, idx) {
            html += '<option value="' + idx + '">' + cat.name + '</option>';
        });
    }
    html += '<option value="__new__">+ หมวดใหม่ (พิมพ์ชื่อ)</option>';
    return html;
}

function onAddBudgetTypeChange() {
    var typeSelect = document.getElementById('addBudgetTypeSelect');
    var newTypeField = document.getElementById('newBudgetTypeField');
    var catSelect = document.getElementById('addBudgetCatSelect');

    if (typeSelect.value === '__new__') {
        newTypeField.style.display = 'block';
        // For new budget type, only show "new category" option
        catSelect.innerHTML = '<option value="__new__">+ หมวดใหม่ (พิมพ์ชื่อ)</option>';
        document.getElementById('newBudgetCatField').style.display = 'block';
    } else {
        newTypeField.style.display = 'none';
        var sheet = DATA.sheets[currentSheet];
        var budgetType = sheet.budget[parseInt(typeSelect.value)];
        catSelect.innerHTML = buildSubcatOptions(budgetType);
        document.getElementById('newBudgetCatField').style.display = 'none';
    }
}

function onAddBudgetCatChange() {
    var catSelect = document.getElementById('addBudgetCatSelect');
    var newCatField = document.getElementById('newBudgetCatField');
    newCatField.style.display = catSelect.value === '__new__' ? 'block' : 'none';
}

function closeBudgetModal() {
    var overlay = document.getElementById('budgetModalOverlay');
    if (overlay) overlay.remove();
}

function confirmAddBudgetItem() {
    var sheet = DATA.sheets[currentSheet];
    ensureBudgetStructure(sheet);

    var typeSelect = document.getElementById('addBudgetTypeSelect');
    var catSelect = document.getElementById('addBudgetCatSelect');
    var itemName = document.getElementById('addBudgetItemName').value.trim();

    if (!itemName) {
        alert('กรุณาใส่ชื่อรายการ');
        return;
    }

    var typeIdx, catIdx;

    // Resolve budget type
    if (typeSelect.value === '__new__') {
        var newTypeName = document.getElementById('newBudgetTypeName').value.trim();
        if (!newTypeName) {
            alert('กรุณาใส่ชื่องบใหม่');
            return;
        }
        // Create new budget type
        sheet.budget.push({
            type: newTypeName,
            categories: []
        });
        typeIdx = sheet.budget.length - 1;
    } else {
        typeIdx = parseInt(typeSelect.value);
    }

    // Resolve category
    if (catSelect.value === '__new__') {
        var newCatName = document.getElementById('newBudgetCatName').value.trim();
        if (!newCatName) {
            alert('กรุณาใส่ชื่อหมวดใหม่');
            return;
        }
        // Create new category with 16 empty slots
        var emptyItems = [];
        for (var i = 0; i < 16; i++) {
            emptyItems.push({ name: '', budget: 0, used: 0, remaining: 0 });
        }
        sheet.budget[typeIdx].categories.push({
            name: newCatName,
            totalBudget: 0, totalUsed: 0, totalRemaining: 0,
            items: emptyItems
        });
        catIdx = sheet.budget[typeIdx].categories.length - 1;
    } else {
        catIdx = parseInt(catSelect.value);
    }

    // Find empty slot in items
    var category = sheet.budget[typeIdx].categories[catIdx];
    var slotFound = false;
    for (var j = 0; j < category.items.length; j++) {
        if (!category.items[j].name) {
            category.items[j].name = itemName;
            slotFound = true;
            break;
        }
    }

    if (!slotFound) {
        alert('ไม่มี slot ว่างในหมวดนี้แล้ว (สูงสุด ' + category.items.length + ' รายการ)');
        return;
    }

    // Switch to the added type/category
    currentBudgetTypeIdx = typeIdx;
    currentBudgetCatIdx = catIdx;

    // Save to Firebase
    saveAllToFirebase();

    // Sync to Google Sheets
    if (typeof syncBudgetToSheets === 'function') {
        syncBudgetToSheets(sheet);
    }

    closeBudgetModal();
    renderBudgetPage();
    showStatus('success', 'เพิ่มรายการ "' + itemName + '" เรียบร้อยแล้ว');
}

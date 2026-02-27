// ============================================================
// Budget Details Module
// แสดงรายละเอียดงบประมาณทุกหมวดพร้อมกัน
// แก้ไข เพิ่ม ลบ ได้ทุกระดับ (type / category / item)
// ============================================================

var budgetEditMode = false;
var budgetSnapshot = null;

// โครงสร้างเริ่มต้นสำหรับ budget (ใช้เมื่อ sheet ยังไม่มี budget)
function getDefaultBudgetStructure() {
    return [
        {
            type: 'งบดำเนินงาน',
            categories: [
                { name: 'ค่าใช้สอย', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: [] },
                { name: 'ค่าวัสดุ', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: [] },
                { name: 'ค่าจ้าง', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: [] },
                { name: 'ค่าเดินทางไปต่างประเทศ', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: [] }
            ]
        },
        {
            type: 'งบลงทุน',
            categories: [
                { name: 'ครุภัณฑ์', totalBudget: 0, totalUsed: 0, totalRemaining: 0, items: [] }
            ]
        }
    ];
}

// ลบ empty items ที่ไม่มีข้อมูลออก (ใช้ก่อนบันทึก)
function cleanEmptyBudgetItems(budget) {
    budget.forEach(function(bt) {
        bt.categories.forEach(function(cat) {
            cat.items = cat.items.filter(function(item) {
                return item.name || (Number(item.budget) || 0) > 0 || (Number(item.used) || 0) > 0;
            });
        });
    });
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
                if (name || budget || used) {
                    hasData = true;
                    items.push({ name: name, budget: budget, used: used, remaining: remaining });
                }
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
        var parsed = parseBudgetFromRawData(sheet.rawData);
        if (parsed) {
            sheet.budget = parsed;
        } else {
            sheet.budget = getDefaultBudgetStructure();
        }
    }
    // ลบ empty items ที่ค้างจากข้อมูลเก่า
    cleanEmptyBudgetItems(sheet.budget);
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

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// Render Functions
// ============================================================

function renderBudgetPage() {
    var sheet = DATA.sheets[currentSheet];
    if (!sheet) return;
    ensureBudgetStructure(sheet);

    renderBudgetSummaryCards(sheet.budget, sheet.info);
    renderBudgetContent(sheet.budget);
    updateBudgetEditButtons();
}

function renderBudgetSummaryCards(budget, info) {
    var container = document.getElementById('budgetSummaryCards');
    if (!container) return;

    var totals = calcBudgetGrandTotals(budget);

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

function renderBudgetContent(budget) {
    var container = document.getElementById('budgetContent');
    if (!container) return;

    var html = '';

    budget.forEach(function(bt, typeIdx) {
        html += '<div class="budget-type-section">';
        html += '<div class="budget-type-header">';
        html += '<span class="budget-type-title">' + escapeHtml(bt.type) + '</span>';
        if (budgetEditMode) {
            html += '<button class="budget-section-delete-btn" onclick="deleteBudgetType(' + typeIdx + ')" title="ลบ ' + escapeHtml(bt.type) + '">&times;</button>';
        }
        html += '</div>';

        bt.categories.forEach(function(cat, catIdx) {
            recalcBudgetTotals(cat);
            html += renderBudgetCategorySection(cat, typeIdx, catIdx);
        });

        // ปุ่มเพิ่มหมวด (edit mode)
        if (budgetEditMode) {
            html += '<button class="budget-add-section-btn" onclick="addBudgetCategory(' + typeIdx + ')">+ เพิ่มหมวด</button>';
        }

        html += '</div>'; // end budget-type-section
    });

    // ปุ่มเพิ่มงบ (edit mode)
    if (budgetEditMode) {
        html += '<button class="budget-add-section-btn budget-add-type-btn" onclick="addBudgetType()">+ เพิ่มประเภทงบ</button>';
    }

    container.innerHTML = html;

    if (budgetEditMode) {
        attachAllBudgetEditListeners();
    }
}

function toggleBudgetCat(typeIdx, catIdx) {
    var el = document.querySelector('.budget-cat-section[data-type="' + typeIdx + '"][data-cat="' + catIdx + '"]');
    if (el) el.classList.toggle('open');
}

function renderBudgetCategorySection(cat, typeIdx, catIdx) {
    var html = '';
    var openClass = budgetEditMode ? ' open' : '';
    html += '<div class="budget-cat-section' + openClass + '" data-type="' + typeIdx + '" data-cat="' + catIdx + '">';
    html += '<div class="budget-cat-header" onclick="toggleBudgetCat(' + typeIdx + ',' + catIdx + ')">';
    html += '<div class="budget-cat-header-left">';
    html += '<svg class="budget-cat-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"></polyline></svg>';
    html += '<span class="budget-cat-title">' + escapeHtml(cat.name) + '</span>';
    html += '</div>';
    html += '<div class="budget-cat-header-right">';
    html += '<span class="budget-cat-subtotal">รวม ' + formatNumber(cat.totalBudget) + ' | ใช้ ' + formatNumber(cat.totalUsed) + ' | เหลือ ' + formatNumber(cat.totalRemaining) + '</span>';
    if (budgetEditMode) {
        html += '<button class="budget-section-delete-btn" onclick="event.stopPropagation();deleteBudgetCategory(' + typeIdx + ',' + catIdx + ')" title="ลบ ' + escapeHtml(cat.name) + '">&times;</button>';
    }
    html += '</div>';
    html += '</div>';

    // Collapsible content
    html += '<div class="budget-cat-content">';

    // Table
    html += '<table class="budget-table">';
    html += '<thead><tr>';
    html += '<th style="width:40%">รายการ</th>';
    html += '<th class="number" style="width:20%">งบประมาณ (บาท)</th>';
    html += '<th class="number" style="width:20%">ใช้จ่าย (บาท)</th>';
    html += '<th class="number" style="width:20%">คงเหลือ (บาท)</th>';
    if (budgetEditMode) html += '<th style="width:40px"></th>';
    html += '</tr></thead>';
    html += '<tbody>';

    var hasItems = false;
    cat.items.forEach(function(item, itemIdx) {
        var hasData = item.name || (Number(item.budget) || 0) > 0 || (Number(item.used) || 0) > 0;
        if (!hasData && !budgetEditMode) return;
        hasItems = true;

        if (budgetEditMode) {
            html += '<tr>' +
                '<td><input type="text" class="budget-name-input" value="' + escapeHtml(item.name || '') + '" data-type-idx="' + typeIdx + '" data-cat-idx="' + catIdx + '" data-item-idx="' + itemIdx + '" data-field="name"></td>' +
                '<td class="number"><input type="number" class="budget-inline-input" value="' + (Number(item.budget) || 0) + '" data-type-idx="' + typeIdx + '" data-cat-idx="' + catIdx + '" data-item-idx="' + itemIdx + '" data-field="budget" min="0"></td>' +
                '<td class="number"><input type="number" class="budget-inline-input" value="' + (Number(item.used) || 0) + '" data-type-idx="' + typeIdx + '" data-cat-idx="' + catIdx + '" data-item-idx="' + itemIdx + '" data-field="used" min="0"></td>' +
                '<td class="number budget-remaining-cell">' + formatNumber(item.remaining) + '</td>' +
                '<td class="budget-delete-cell"><button class="budget-delete-btn" onclick="deleteBudgetItem(' + typeIdx + ',' + catIdx + ',' + itemIdx + ')" title="ลบรายการ">&times;</button></td>' +
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

    // Total row + add button row
    if (budgetEditMode) {
        html += '<tr class="budget-add-row">' +
            '<td colspan="5"><button class="budget-add-item-btn" onclick="addBudgetItem(' + typeIdx + ',' + catIdx + ')">+ เพิ่มรายการ</button></td>' +
            '</tr>';
    }
    html += '<tr class="total-row">' +
        '<td>รวม</td>' +
        '<td class="number">' + formatNumber(cat.totalBudget) + '</td>' +
        '<td class="number">' + formatNumber(cat.totalUsed) + '</td>' +
        '<td class="number">' + formatNumber(cat.totalRemaining) + '</td>' +
        (budgetEditMode ? '<td></td>' : '') +
        '</tr>';

    html += '</tbody></table>';

    html += '</div>'; // end budget-cat-content
    html += '</div>'; // end budget-cat-section
    return html;
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

    // ลบ empty items ก่อนบันทึก
    cleanEmptyBudgetItems(sheet.budget);

    // Recalc all totals
    sheet.budget.forEach(function(bt) {
        bt.categories.forEach(function(cat) {
            recalcBudgetTotals(cat);
        });
    });

    // Sync budget totals → info
    syncBudgetToInfo(sheet);

    // Save to Firebase
    saveAllToFirebase();

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

function attachAllBudgetEditListeners() {
    var inputs = document.querySelectorAll('#budgetContent .budget-inline-input, #budgetContent .budget-name-input');
    inputs.forEach(function(input) {
        input.addEventListener('input', function() {
            var typeIdx = parseInt(this.dataset.typeIdx);
            var catIdx = parseInt(this.dataset.catIdx);
            var itemIdx = parseInt(this.dataset.itemIdx);
            var field = this.dataset.field;
            var sheet = DATA.sheets[currentSheet];
            var category = sheet.budget[typeIdx].categories[catIdx];
            var item = category.items[itemIdx];

            if (field === 'name') {
                item.name = this.value;
            } else {
                item[field] = Number(this.value) || 0;
                item.remaining = (Number(item.budget) || 0) - (Number(item.used) || 0);
                recalcBudgetTotals(category);

                // Update remaining cell in this row
                var row = this.closest('tr');
                if (row) {
                    var remCell = row.querySelector('.budget-remaining-cell');
                    if (remCell) remCell.textContent = formatNumber(item.remaining);
                }

                // Update total row in this table
                var tbody = this.closest('tbody');
                if (tbody) {
                    var totalRow = tbody.querySelector('.total-row');
                    if (totalRow) {
                        var cells = totalRow.querySelectorAll('td.number');
                        if (cells.length >= 3) {
                            cells[0].textContent = formatNumber(category.totalBudget);
                            cells[1].textContent = formatNumber(category.totalUsed);
                            cells[2].textContent = formatNumber(category.totalRemaining);
                        }
                    }
                }

                // Update category subtotal in header
                var catSection = this.closest('.budget-cat-section');
                if (catSection) {
                    var subtotal = catSection.querySelector('.budget-cat-subtotal');
                    if (subtotal) {
                        subtotal.textContent = 'รวม: ' + formatNumber(category.totalBudget) + ' / ใช้: ' + formatNumber(category.totalUsed) + ' / เหลือ: ' + formatNumber(category.totalRemaining);
                    }
                }

                // Update summary cards
                renderBudgetSummaryCards(sheet.budget, sheet.info);
            }
        });
    });
}

// ============================================================
// Delete Functions
// ============================================================

function deleteBudgetItem(typeIdx, catIdx, itemIdx) {
    var sheet = DATA.sheets[currentSheet];
    var category = sheet.budget[typeIdx].categories[catIdx];
    var item = category.items[itemIdx];
    var itemName = item.name || 'รายการที่ ' + (itemIdx + 1);

    if (!confirm('ลบรายการ "' + itemName + '" ?')) return;

    category.items.splice(itemIdx, 1);
    recalcBudgetTotals(category);
    renderBudgetContent(sheet.budget);
    renderBudgetSummaryCards(sheet.budget, sheet.info);
}

function deleteBudgetCategory(typeIdx, catIdx) {
    var sheet = DATA.sheets[currentSheet];
    var cat = sheet.budget[typeIdx].categories[catIdx];

    if (!confirm('ลบหมวด "' + cat.name + '" และรายการทั้งหมดในหมวดนี้?')) return;

    sheet.budget[typeIdx].categories.splice(catIdx, 1);
    renderBudgetContent(sheet.budget);
    renderBudgetSummaryCards(sheet.budget, sheet.info);
}

function deleteBudgetType(typeIdx) {
    var sheet = DATA.sheets[currentSheet];
    var bt = sheet.budget[typeIdx];

    if (!confirm('ลบ "' + bt.type + '" และหมวดทั้งหมด?')) return;

    sheet.budget.splice(typeIdx, 1);
    renderBudgetContent(sheet.budget);
    renderBudgetSummaryCards(sheet.budget, sheet.info);
}

// ============================================================
// Add Functions (inline, no modal)
// ============================================================

function addBudgetItem(typeIdx, catIdx) {
    var sheet = DATA.sheets[currentSheet];
    var category = sheet.budget[typeIdx].categories[catIdx];
    category.items.push({ name: '', budget: 0, used: 0, remaining: 0 });
    renderBudgetContent(sheet.budget);

    // Focus the new item's name input
    var inputs = document.querySelectorAll('.budget-name-input[data-type-idx="' + typeIdx + '"][data-cat-idx="' + catIdx + '"]');
    if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
    }
}

function addBudgetCategory(typeIdx) {
    var name = prompt('ชื่อหมวดใหม่:');
    if (!name || !name.trim()) return;

    var sheet = DATA.sheets[currentSheet];
    sheet.budget[typeIdx].categories.push({
        name: name.trim(),
        totalBudget: 0, totalUsed: 0, totalRemaining: 0,
        items: []
    });
    renderBudgetContent(sheet.budget);
}

function addBudgetType() {
    var name = prompt('ชื่อประเภทงบใหม่:');
    if (!name || !name.trim()) return;

    var sheet = DATA.sheets[currentSheet];
    sheet.budget.push({
        type: name.trim(),
        categories: []
    });
    renderBudgetContent(sheet.budget);
}

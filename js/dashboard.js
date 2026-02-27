var currentOutputTab = 0;
var editSnapshot = null; // เก็บ snapshot ข้อมูลก่อนแก้ไข

function renderSheetList() {
    var list = document.getElementById('sheetList');
    list.innerHTML = DATA.sheets.map(function(sheet, idx) {
        return '<li class="sheet-item ' + (idx === currentSheet ? 'active' : '') + '" data-index="' + idx + '">' +
            '<span class="radio"></span>' +
            '<span>' + sheet.name + '</span>' +
        '</li>';
    }).join('');

    list.querySelectorAll('.sheet-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            var idx = parseInt(e.currentTarget.dataset.index);
            currentSheet = idx;
            renderSheetList();
            // Render the currently active page
            if (currentPage === 'budget') {
                renderBudgetPage();
            } else if (currentPage === 'workplan') {
                renderWorkplanPage();
            } else if (currentPage === 'comparison') {
                renderComparison();
            } else {
                renderDashboard();
            }
        });
    });
}

// สร้าง editable value สำหรับ info box
function editableInfoValue(value, field, extraStyle) {
    var displayVal = value || '-';
    // แสดงแบบ formatted สำหรับ budget fields
    if (field === 'budget' || field === 'usedBudget' || field === 'remainingBudget') {
        displayVal = formatNumber(value);
    }
    var style = extraStyle ? ' style="' + extraStyle + '"' : '';
    var editClass = editMode.info ? 'value editable-cell' : 'value';
    var dataAttrs = editMode.info ? ' data-field="' + field + '" data-type="info"' : '';
    return '<div class="' + editClass + '"' + dataAttrs + style + '>' + displayVal + '</div>';
}

function renderDashboard() {
    var sheet = DATA.sheets[currentSheet];
    var info = sheet.info;

    // Header: ชื่อโครงการ + หัวหน้า (editable เมื่อเปิด edit mode)
    var titleEl = document.getElementById('projectTitle');
    titleEl.textContent = info.projectName || '\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23\u0e27\u0e34\u0e08\u0e31\u0e22';
    if (editMode.info) {
        titleEl.classList.add('editable-cell');
        titleEl.dataset.field = 'projectName';
        titleEl.dataset.type = 'info';
    } else {
        titleEl.classList.remove('editable-cell');
        delete titleEl.dataset.field;
        delete titleEl.dataset.type;
    }

    var leaderEl = document.getElementById('projectLeader');
    if (editMode.info) {
        leaderEl.innerHTML = '\u0e2b\u0e31\u0e27\u0e2b\u0e19\u0e49\u0e32\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23: <span class="editable-cell" data-field="leader" data-type="info">' + (info.leader || '-') + '</span>';
    } else {
        leaderEl.innerHTML = '\u0e2b\u0e31\u0e27\u0e2b\u0e19\u0e49\u0e32\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23: <span>' + (info.leader || '-') + '</span>';
    }

    document.getElementById('projectInfo').innerHTML =
        // Row 1
        '<div class="info-box" style="grid-column: span 1;">' +
            editableInfoValue(info.projectCode, 'projectCode', 'font-size: 1.2rem;') +
            '<div class="label">\u0e23\u0e2b\u0e31\u0e2a\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23</div>' +
        '</div>' +
        '<div class="info-box" style="grid-column: span 3;">' +
            editableInfoValue(info.projectNameEng, 'projectNameEng', 'font-size: 0.9rem;') +
            '<div class="label">\u0e0a\u0e37\u0e48\u0e2d\u0e20\u0e32\u0e29\u0e32\u0e2d\u0e31\u0e07\u0e01\u0e24\u0e29</div>' +
        '</div>' +
        // Row 2
        '<div class="info-box">' +
            editableInfoValue(info.startDate, 'startDate') +
            '<div class="label">\u0e40\u0e23\u0e34\u0e48\u0e21\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23</div>' +
        '</div>' +
        '<div class="info-box">' +
            editableInfoValue(info.endDate, 'endDate') +
            '<div class="label">\u0e08\u0e1a\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23</div>' +
        '</div>' +
        '<div class="info-box">' +
            editableInfoValue(info.extendDate, 'extendDate') +
            '<div class="label">\u0e02\u0e22\u0e32\u0e22\u0e40\u0e27\u0e25\u0e32\u0e16\u0e36\u0e07</div>' +
        '</div>' +
        '<div class="info-box">' +
            editableInfoValue(info.duration, 'duration') +
            '<div class="label">\u0e23\u0e30\u0e22\u0e30\u0e40\u0e27\u0e25\u0e32\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23</div>' +
        '</div>' +
        // Row 3
        '<div class="info-box">' +
            editableInfoValue(info.fiscalYear, 'fiscalYear') +
            '<div class="label">\u0e1b\u0e35\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13</div>' +
        '</div>' +
        '<div class="info-box">' +
            editableInfoValue(info.budget, 'budget') +
            '<div class="label">\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13 (\u0e1a\u0e32\u0e17)</div>' +
            '<div id="budgetMismatchWarning" class="budget-mismatch-warning" style="display:none;"></div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value" data-field="usedBudget" style="color: #e74c3c;">' + formatNumber(info.usedBudget) + '</div>' +
            '<div class="label">\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13\u0e17\u0e35\u0e48\u0e43\u0e0a\u0e49\u0e44\u0e1b (\u0e1a\u0e32\u0e17)</div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value" data-field="remainingBudget" style="color: #2ecc71;">' + formatNumber(info.remainingBudget) + '</div>' +
            '<div class="label">\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d (\u0e1a\u0e32\u0e17)</div>' +
        '</div>';

    // Sync budget totals → info (เพื่อให้ usedBudget/remainingBudget ตรงกับรายละเอียดงบ)
    if (sheet.budget && sheet.budget.length > 0) {
        syncBudgetToInfo(sheet);
    }

    var summaries = calculateSummary(sheet.outputs);
    document.getElementById('summaryCards').innerHTML = summaries.map(function(s) {
        return '<div class="summary-card">' +
            '<div class="value">' + s.completed + '/' + s.target + '</div>' +
            '<div class="label">' + s.name + '</div>' +
        '</div>';
    }).join('');

    // Output Tabs
    if (currentOutputTab >= sheet.outputs.length) currentOutputTab = 0;
    var tabsHTML = sheet.outputs.map(function(cat, idx) {
        return '<button class="output-tab' + (idx === currentOutputTab ? ' active' : '') + '" data-tab="' + idx + '">' + cat.name + '</button>';
    }).join('');
    document.getElementById('outputTabs').innerHTML = tabsHTML;

    // Tab click events
    document.querySelectorAll('.output-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            currentOutputTab = parseInt(tab.dataset.tab);
            renderOutputTable();
            updateTabActive();
        });
    });

    renderOutputTable();
}

function updateTabActive() {
    document.querySelectorAll('.output-tab').forEach(function(tab) {
        tab.classList.toggle('active', parseInt(tab.dataset.tab) === currentOutputTab);
    });
}

function renderOutputTable() {
    var sheet = DATA.sheets[currentSheet];
    var catIdx = currentOutputTab;
    var cat = sheet.outputs[catIdx];
    var tableHTML = '';

    if (cat) {
        cat.items.forEach(function(item, itemIdx) {
            var percent = item.target > 0 ? Math.min((item.completed / item.target) * 100, 100) : 0;
            var fillClass = percent >= 100 ? '' : percent >= 50 ? 'warning' : 'danger';

            var namesHTML = '<div class="names-list' + (editMode.output ? ' editable-names' : '') + '" data-cat="' + catIdx + '" data-item="' + itemIdx + '">';
            if (item.names && item.names.length > 0) {
                namesHTML += item.names.map(function(n, i) {
                    return '<div class="name-item' + (editMode.output ? ' editable-name' : '') + '" data-name-idx="' + i + '">' + (i+1) + '. ' + n + '</div>';
                }).join('');
            }
            if (editMode.output) {
                namesHTML += '<div class="add-name-btn" title="\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d">+</div>';
            }
            namesHTML += '</div>';

            var targetHTML, completedHTML;
            if (editMode.output) {
                targetHTML = '<input type="number" class="inline-input" value="' + (item.target || 0) + '" ' +
                    'data-cat="' + catIdx + '" data-item="' + itemIdx + '" data-field="target" min="0">';
                completedHTML = '<input type="number" class="inline-input" value="' + (item.completed || 0) + '" ' +
                    'data-cat="' + catIdx + '" data-item="' + itemIdx + '" data-field="completed" min="0">';
            } else {
                targetHTML = '<span>' + (item.target || 0) + '</span>';
                completedHTML = '<span>' + (item.completed || 0) + '</span>';
            }

            tableHTML += '<tr>' +
                '<td>' + item.name + '</td>' +
                '<td class="number">' + targetHTML + '</td>' +
                '<td class="number">' + completedHTML + '</td>' +
                '<td>' +
                    '<div class="progress-bar">' +
                        '<div class="fill ' + fillClass + '" style="width: ' + percent + '%"></div>' +
                    '</div>' +
                    '<small style="color: #666">' + percent.toFixed(0) + '%</small>' +
                '</td>' +
                '<td>' + namesHTML + '</td>' +
            '</tr>';
        });
    }
    document.getElementById('outputTable').innerHTML = tableHTML;
    attachEditListeners();
}

function attachEditListeners() {
    // Info field click-to-edit
    document.querySelectorAll('.editable-cell[data-type="info"]').forEach(function(el) {
        el.addEventListener('click', function() {
            startEditInfoCell(el);
        });
    });

    // Output number inputs — อัปเดต DATA local เท่านั้น (ยังไม่ save)
    document.querySelectorAll('.inline-input').forEach(function(input) {
        input.addEventListener('change', function() {
            var catIdx = parseInt(input.dataset.cat);
            var itemIdx = parseInt(input.dataset.item);
            var field = input.dataset.field;
            var value = parseInt(input.value) || 0;
            // อัปเดต DATA local
            DATA.sheets[currentSheet].outputs[catIdx].items[itemIdx][field] = value;
            updateProgressBar(input, catIdx, itemIdx);
            updateSummaryCards();
        });
    });

    // Name editing
    document.querySelectorAll('.editable-name').forEach(function(el) {
        el.addEventListener('click', function() {
            startEditName(el);
        });
    });

    // Add name button
    document.querySelectorAll('.add-name-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            addNewName(btn);
        });
    });
}

function startEditInfoCell(el) {
    if (el.querySelector('input')) return;

    var field = el.dataset.field;
    var sheet = DATA.sheets[currentSheet];
    var rawValue = sheet.info[field] || '';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = rawValue;
    el.textContent = '';
    el.appendChild(input);
    input.focus();
    input.select();

    function displayValue(val) {
        if (field === 'budget' || field === 'usedBudget' || field === 'remainingBudget') {
            el.textContent = formatNumber(val);
        } else {
            el.textContent = val || '-';
        }
    }

    function finishEdit() {
        var newValue = input.value.trim();
        // อัปเดต DATA local เท่านั้น (ยังไม่ save)
        sheet.info[field] = newValue;
        // คำนวณ remainingBudget อัตโนมัติเมื่อแก้งบประมาณ
        if (field === 'budget') {
            var budget = Number(sheet.info.budget) || 0;
            var used = Number(sheet.info.usedBudget) || 0;
            sheet.info.remainingBudget = String(budget - used);
            var remainEl = document.querySelector('[data-field="remainingBudget"]');
            if (remainEl) remainEl.textContent = formatNumber(sheet.info.remainingBudget);
            updateBudgetMismatchWarning(sheet);
        }
        displayValue(newValue);
        // อัปเดต header ถ้าแก้ชื่อโครงการ
        if (field === 'projectName') {
            document.getElementById('projectTitle').textContent = newValue || '\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23\u0e27\u0e34\u0e08\u0e31\u0e22';
        }
    }

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            displayValue(rawValue);
        }
    });
}

function startEditName(el) {
    if (el.querySelector('input')) return;

    var namesList = el.closest('.editable-names');
    var catIdx = parseInt(namesList.dataset.cat);
    var itemIdx = parseInt(namesList.dataset.item);
    var nameIdx = parseInt(el.dataset.nameIdx);
    var sheet = DATA.sheets[currentSheet];
    var currentName = sheet.outputs[catIdx].items[itemIdx].names[nameIdx] || '';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = currentName;
    el.textContent = '';
    el.appendChild(input);
    input.focus();
    input.select();

    function finishEdit() {
        var newValue = input.value.trim();
        // อัปเดต DATA local เท่านั้น (ยังไม่ save)
        var names = sheet.outputs[catIdx].items[itemIdx].names.slice();
        if (newValue === '') {
            names.splice(nameIdx, 1);
        } else {
            names[nameIdx] = newValue;
        }
        sheet.outputs[catIdx].items[itemIdx].names = names;
        renderOutputTable();
    }

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') renderOutputTable();
    });
}

function addNewName(btn) {
    var namesList = btn.closest('.editable-names');
    var catIdx = parseInt(namesList.dataset.cat);
    var itemIdx = parseInt(namesList.dataset.item);

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.placeholder = '\u0e1e\u0e34\u0e21\u0e1e\u0e4c\u0e0a\u0e37\u0e48\u0e2d\u0e41\u0e25\u0e49\u0e27\u0e01\u0e14 Enter';
    namesList.insertBefore(input, btn);
    input.focus();

    function finishAdd() {
        var newValue = input.value.trim();
        if (newValue) {
            // อัปเดต DATA local เท่านั้น (ยังไม่ save)
            var sheet = DATA.sheets[currentSheet];
            var names = (sheet.outputs[catIdx].items[itemIdx].names || []).slice();
            names.push(newValue);
            sheet.outputs[catIdx].items[itemIdx].names = names;
        }
        renderOutputTable();
    }

    input.addEventListener('blur', finishAdd);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') renderOutputTable();
    });
}

function updateProgressBar(input, catIdx, itemIdx) {
    var sheet = DATA.sheets[currentSheet];
    var item = sheet.outputs[catIdx].items[itemIdx];
    var percent = item.target > 0 ? Math.min((item.completed / item.target) * 100, 100) : 0;
    var fillClass = percent >= 100 ? '' : percent >= 50 ? 'warning' : 'danger';

    var row = input.closest('tr');
    var progressFill = row.querySelector('.fill');
    var progressText = row.querySelector('small');
    if (progressFill) {
        progressFill.style.width = percent + '%';
        progressFill.className = 'fill ' + fillClass;
    }
    if (progressText) {
        progressText.textContent = percent.toFixed(0) + '%';
    }
}

function updateSummaryCards() {
    var sheet = DATA.sheets[currentSheet];
    var summaries = calculateSummary(sheet.outputs);
    document.getElementById('summaryCards').innerHTML = summaries.map(function(s) {
        return '<div class="summary-card">' +
            '<div class="value">' + s.completed + '/' + s.target + '</div>' +
            '<div class="label">' + s.name + '</div>' +
        '</div>';
    }).join('');
}

function calculateSummary(outputs) {
    var summaryItems = [
        { name: '\u0e01\u0e33\u0e25\u0e31\u0e07\u0e04\u0e19', idx: 0 },
        { name: '\u0e1a\u0e17\u0e04\u0e27\u0e32\u0e21\u0e27\u0e34\u0e08\u0e31\u0e22', idx: 1 },
        { name: '\u0e2b\u0e19\u0e31\u0e07\u0e2a\u0e37\u0e2d', idx: 2 },
        { name: '\u0e15\u0e49\u0e19\u0e41\u0e1a\u0e1a/\u0e40\u0e17\u0e04\u0e42\u0e19\u0e42\u0e25\u0e22\u0e35', idx: 3 },
        { name: '\u0e17\u0e23\u0e31\u0e1e\u0e22\u0e4c\u0e2a\u0e34\u0e19\u0e17\u0e32\u0e07\u0e1b\u0e31\u0e0d\u0e0d\u0e32', idx: 4 },
        { name: '\u0e40\u0e04\u0e23\u0e37\u0e2d\u0e02\u0e48\u0e32\u0e22', idx: 7 }
    ];

    return summaryItems.map(function(s) {
        var cat = outputs[s.idx];
        if (!cat) return { name: s.name, target: 0, completed: 0 };

        var target = cat.items.reduce(function(sum, i) { return sum + (i.target || 0); }, 0);
        var completed = cat.items.reduce(function(sum, i) { return sum + (i.completed || 0); }, 0);
        return { name: s.name, target: target, completed: completed };
    });
}

// ============================================================
// Edit Mode: toggle, snapshot, save, cancel
// ============================================================

function deepCloneSheet(sheet) {
    return JSON.parse(JSON.stringify(sheet));
}

function toggleEditMode(section) {
    if (!editMode[section]) {
        // เข้า edit mode → เก็บ snapshot ของ sheet ปัจจุบัน
        editSnapshot = deepCloneSheet(DATA.sheets[currentSheet]);
        editMode[section] = true;
    } else {
        // ถ้ากดปุ่มเดิมอีกครั้ง (ไม่ควรเกิดเพราะจะเป็นปุ่มบันทึก/ยกเลิกแล้ว)
        editMode[section] = false;
        editSnapshot = null;
    }
    updateEditButtons(section);
    renderDashboard();
}

function saveEditMode(section) {
    if (!confirm('\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e01\u0e32\u0e23\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14?')) {
        return;
    }

    // Save ทั้งหมดไป Firebase
    saveAllToFirebase();

    // ออกจาก edit mode
    editMode[section] = false;
    editSnapshot = null;
    updateEditButtons(section);
    renderDashboard();
    showStatus('success', '\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e40\u0e23\u0e35\u0e22\u0e1a\u0e23\u0e49\u0e2d\u0e22\u0e41\u0e25\u0e49\u0e27');
}

function cancelEditMode(section) {
    // คืนค่าจาก snapshot
    if (editSnapshot) {
        DATA.sheets[currentSheet] = deepCloneSheet(editSnapshot);
    }
    editMode[section] = false;
    editSnapshot = null;
    updateEditButtons(section);
    renderDashboard();
}

function updateEditButtons(section) {
    var btnId = section === 'info' ? 'editInfoBtn' : 'editOutputBtn';
    var containerId = section === 'info' ? 'editInfoBtnContainer' : 'editOutputBtnContainer';

    var container = document.getElementById(containerId);
    if (!container) return;

    if (editMode[section]) {
        container.innerHTML =
            '<button class="edit-toggle-btn save-btn" onclick="saveEditMode(\'' + section + '\')">\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01</button>' +
            '<button class="edit-toggle-btn cancel-btn" onclick="cancelEditMode(\'' + section + '\')">\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01</button>';
    } else {
        container.innerHTML =
            '<button class="edit-toggle-btn" onclick="toggleEditMode(\'' + section + '\')">\u0e41\u0e01\u0e49\u0e44\u0e02</button>';
    }
}

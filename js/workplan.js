// ============================================================
// Work Plan Module (แผนการดำเนินงาน)
// ตาราง Gantt-style: กิจกรรม × เดือน พร้อม inline editing
// ============================================================

var workplanEditMode = false;
var workplanSnapshot = null;

// โครงสร้างเริ่มต้น
function getDefaultWorkplanStructure() {
    return [];
}

// ตรวจสอบและสร้างโครงสร้าง workplan ถ้ายังไม่มี
function ensureWorkplanStructure(sheet) {
    if (!sheet.workplan || !Array.isArray(sheet.workplan)) {
        sheet.workplan = getDefaultWorkplanStructure();
    }
}

// ============================================================
// Render Functions
// ============================================================

function renderWorkplanPage() {
    var sheet = DATA.sheets[currentSheet];
    if (!sheet) return;
    ensureWorkplanStructure(sheet);

    var tbody = document.getElementById('workplanTableBody');
    if (!tbody) return;

    renderWorkplanTable(sheet.workplan);
    updateWorkplanEditButtons();
}

function renderWorkplanTable(workplan) {
    var tbody = document.getElementById('workplanTableBody');
    if (!tbody) return;

    // Update thead to show/hide delete column
    var thead = tbody.closest('table').querySelector('thead tr');
    if (thead) {
        var existingDeleteTh = thead.querySelector('.workplan-delete-th');
        if (workplanEditMode && !existingDeleteTh) {
            var th = document.createElement('th');
            th.className = 'workplan-delete-th';
            th.style.width = '40px';
            thead.appendChild(th);
        } else if (!workplanEditMode && existingDeleteTh) {
            existingDeleteTh.remove();
        }
    }

    if (workplan.length === 0 && !workplanEditMode) {
        tbody.innerHTML = '<tr><td colspan="16" class="workplan-empty">ยังไม่มีรายการแผนงาน — กด "+ เพิ่มรายการ" เพื่อเริ่มต้น</td></tr>';
        return;
    }

    var html = '';
    workplan.forEach(function(item, idx) {
        html += '<tr>';

        // ลำดับ
        html += '<td>' + (idx + 1) + '</td>';

        if (workplanEditMode) {
            // ปีที่
            html += '<td><input type="number" class="workplan-number-input workplan-input" value="' + (Number(item.year) || 1) + '" data-idx="' + idx + '" data-field="year" min="1"></td>';
            // กิจกรรม
            html += '<td class="activity-cell"><input type="text" class="workplan-activity-input workplan-input" value="' + escapeHtml(item.activity || '') + '" data-idx="' + idx + '" data-field="activity"></td>';
            // เดือน 1-12
            for (var m = 0; m < 12; m++) {
                var checked = item.months && item.months[m] ? ' checked' : '';
                html += '<td><input type="checkbox" class="workplan-month-checkbox workplan-input" data-idx="' + idx + '" data-month="' + m + '"' + checked + '></td>';
            }
            // ร้อยละ
            html += '<td><input type="number" class="workplan-number-input workplan-input" value="' + (Number(item.percent) || 0) + '" data-idx="' + idx + '" data-field="percent" min="0" max="100"></td>';
            // ลบ
            html += '<td><button class="workplan-delete-btn" onclick="deleteWorkplanItem(' + idx + ')" title="ลบ">&times;</button></td>';
        } else {
            // ปีที่
            html += '<td>' + (Number(item.year) || 1) + '</td>';
            // กิจกรรม
            html += '<td class="activity-cell">' + escapeHtml(item.activity || '') + '</td>';
            // เดือน 1-12
            for (var m2 = 0; m2 < 12; m2++) {
                if (item.months && item.months[m2]) {
                    html += '<td><span class="workplan-check">&#10003;</span></td>';
                } else {
                    html += '<td></td>';
                }
            }
            // ร้อยละ
            html += '<td>' + (Number(item.percent) || 0) + '</td>';
        }

        html += '</tr>';
    });

    tbody.innerHTML = html;

    if (workplanEditMode) {
        attachWorkplanEditListeners();
    }
}

// ============================================================
// Edit Mode
// ============================================================

function updateWorkplanEditButtons() {
    var container = document.getElementById('editWorkplanBtnContainer');
    if (!container) return;

    if (workplanEditMode) {
        container.innerHTML =
            '<div class="budget-btn-group">' +
                '<button class="edit-toggle-btn save-btn" onclick="saveWorkplanEditMode()">บันทึก</button>' +
                '<button class="edit-toggle-btn cancel-btn" onclick="cancelWorkplanEditMode()">ยกเลิก</button>' +
            '</div>';
    } else {
        container.innerHTML =
            '<div class="budget-btn-group">' +
                '<button class="edit-toggle-btn" onclick="toggleWorkplanEditMode()">แก้ไข</button>' +
                '<button class="edit-toggle-btn" onclick="showAddWorkplanItemModal()">+ เพิ่มรายการ</button>' +
            '</div>';
    }
}

function toggleWorkplanEditMode() {
    if (!workplanEditMode) {
        var sheet = DATA.sheets[currentSheet];
        workplanSnapshot = JSON.parse(JSON.stringify(sheet.workplan));
        workplanEditMode = true;
    }
    renderWorkplanPage();
}

function saveWorkplanEditMode() {
    if (!confirm('ยืนยันการบันทึกแผนการดำเนินงาน?')) return;

    saveAllToFirebase();

    workplanEditMode = false;
    workplanSnapshot = null;
    renderWorkplanPage();
    showStatus('success', 'บันทึกแผนการดำเนินงานเรียบร้อยแล้ว');
}

function cancelWorkplanEditMode() {
    if (workplanSnapshot) {
        DATA.sheets[currentSheet].workplan = JSON.parse(JSON.stringify(workplanSnapshot));
    }
    workplanEditMode = false;
    workplanSnapshot = null;
    renderWorkplanPage();
}

function attachWorkplanEditListeners() {
    var inputs = document.querySelectorAll('#workplanTableBody .workplan-input');
    inputs.forEach(function(input) {
        input.addEventListener('input', function() {
            var idx = parseInt(this.dataset.idx);
            var sheet = DATA.sheets[currentSheet];
            var item = sheet.workplan[idx];
            if (!item) return;

            if (this.type === 'checkbox') {
                var monthIdx = parseInt(this.dataset.month);
                if (!item.months) item.months = [false,false,false,false,false,false,false,false,false,false,false,false];
                item.months[monthIdx] = this.checked;
            } else {
                var field = this.dataset.field;
                if (field === 'activity') {
                    item.activity = this.value;
                } else if (field === 'year') {
                    item.year = Number(this.value) || 1;
                } else if (field === 'percent') {
                    item.percent = Number(this.value) || 0;
                }
            }
        });
    });

    // checkbox needs 'change' event
    var checkboxes = document.querySelectorAll('#workplanTableBody .workplan-month-checkbox');
    checkboxes.forEach(function(cb) {
        cb.addEventListener('change', function() {
            var idx = parseInt(this.dataset.idx);
            var monthIdx = parseInt(this.dataset.month);
            var sheet = DATA.sheets[currentSheet];
            var item = sheet.workplan[idx];
            if (!item) return;
            if (!item.months) item.months = [false,false,false,false,false,false,false,false,false,false,false,false];
            item.months[monthIdx] = this.checked;
        });
    });
}

function deleteWorkplanItem(idx) {
    var sheet = DATA.sheets[currentSheet];
    var item = sheet.workplan[idx];
    var itemName = (item && item.activity) || 'รายการที่ ' + (idx + 1);

    if (!confirm('ลบรายการ "' + itemName + '" ?')) return;

    sheet.workplan.splice(idx, 1);
    saveAllToFirebase();
    renderWorkplanPage();
}

// ============================================================
// Add Item Modal
// ============================================================

function showAddWorkplanItemModal() {
    var overlay = document.createElement('div');
    overlay.className = 'workplan-modal-overlay';
    overlay.id = 'workplanModalOverlay';

    var monthCheckboxes = '';
    for (var m = 1; m <= 12; m++) {
        monthCheckboxes += '<label><input type="checkbox" id="addWpMonth' + m + '"> ' + m + '</label>';
    }

    overlay.innerHTML =
        '<div class="workplan-modal">' +
            '<h3>เพิ่มรายการแผนงาน</h3>' +
            '<div class="workplan-modal-field">' +
                '<label>ชื่อกิจกรรม</label>' +
                '<input type="text" id="addWpActivity" placeholder="เช่น สำรวจและรวบรวมข้อมูล">' +
            '</div>' +
            '<div class="workplan-modal-field">' +
                '<label>ปีที่</label>' +
                '<input type="number" id="addWpYear" value="1" min="1">' +
            '</div>' +
            '<div class="workplan-modal-field">' +
                '<label>เดือนที่ดำเนินการ</label>' +
                '<div class="workplan-modal-months">' + monthCheckboxes + '</div>' +
            '</div>' +
            '<div class="workplan-modal-field">' +
                '<label>ร้อยละของกิจกรรม</label>' +
                '<input type="number" id="addWpPercent" value="0" min="0" max="100">' +
            '</div>' +
            '<div class="workplan-modal-buttons">' +
                '<button class="cancel-btn" onclick="closeWorkplanModal()">ยกเลิก</button>' +
                '<button class="confirm-btn" onclick="confirmAddWorkplanItem()">เพิ่มรายการ</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeWorkplanModal();
    });
}

function closeWorkplanModal() {
    var overlay = document.getElementById('workplanModalOverlay');
    if (overlay) overlay.remove();
}

function confirmAddWorkplanItem() {
    var activity = document.getElementById('addWpActivity').value.trim();
    if (!activity) {
        alert('กรุณาใส่ชื่อกิจกรรม');
        return;
    }

    var year = Number(document.getElementById('addWpYear').value) || 1;
    var percent = Number(document.getElementById('addWpPercent').value) || 0;

    var months = [];
    for (var m = 1; m <= 12; m++) {
        months.push(document.getElementById('addWpMonth' + m).checked);
    }

    var sheet = DATA.sheets[currentSheet];
    ensureWorkplanStructure(sheet);

    sheet.workplan.push({
        year: year,
        activity: activity,
        months: months,
        percent: percent
    });

    saveAllToFirebase();
    closeWorkplanModal();
    renderWorkplanPage();
    showStatus('success', 'เพิ่มรายการ "' + activity + '" เรียบร้อยแล้ว');
}

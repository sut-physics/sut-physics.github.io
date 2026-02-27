// ============================================================
// Researchers Module (คณะผู้วิจัย)
// ตารางนักวิจัย พร้อม inline editing, เพิ่ม/ลบรายการ
// ============================================================

var researchersEditMode = false;
var researchersSnapshot = null;

// โครงสร้างเริ่มต้น
function getDefaultResearchersStructure() {
    return [];
}

function ensureResearchersStructure(sheet) {
    if (!sheet.researchers || !Array.isArray(sheet.researchers)) {
        sheet.researchers = getDefaultResearchersStructure();
    }
}

// ============================================================
// Render Functions
// ============================================================

function renderResearchersPage() {
    var sheet = DATA.sheets[currentSheet];
    if (!sheet) return;
    ensureResearchersStructure(sheet);

    var tbody = document.getElementById('researchersTableBody');
    if (!tbody) return;

    renderResearchersTable(sheet.researchers);
    updateResearchersEditButtons();
}

function renderResearchersTable(researchers) {
    var tbody = document.getElementById('researchersTableBody');
    if (!tbody) return;

    // Show/hide delete column header
    var thead = tbody.closest('table').querySelector('thead tr');
    if (thead) {
        var existingDeleteTh = thead.querySelector('.researchers-delete-th');
        if (researchersEditMode && !existingDeleteTh) {
            var th = document.createElement('th');
            th.className = 'researchers-delete-th';
            th.style.width = '40px';
            thead.appendChild(th);
        } else if (!researchersEditMode && existingDeleteTh) {
            existingDeleteTh.remove();
        }
    }

    if (researchers.length === 0 && !researchersEditMode) {
        tbody.innerHTML = '<tr><td colspan="4" class="researchers-empty">ยังไม่มีรายการคณะผู้วิจัย — กด "+ เพิ่มรายการ" เพื่อเริ่มต้น</td></tr>';
        return;
    }

    var html = '';
    researchers.forEach(function(item, idx) {
        html += '<tr>';

        // ลำดับ
        html += '<td class="researchers-idx-cell">' + (idx + 1) + '</td>';

        if (researchersEditMode) {
            // ชื่อ-สกุล + หน่วยงาน
            html += '<td class="researchers-name-cell">' +
                '<input type="text" class="researchers-input researchers-name-input" value="' + escapeHtml(item.name || '') + '" data-idx="' + idx + '" data-field="name" placeholder="ชื่อ - สกุล">' +
                '<input type="text" class="researchers-input researchers-org-input" value="' + escapeHtml(item.organization || '') + '" data-idx="' + idx + '" data-field="organization" placeholder="หน่วยงาน">' +
                '</td>';
            // ตำแหน่ง
            html += '<td><input type="text" class="researchers-input" value="' + escapeHtml(item.role || '') + '" data-idx="' + idx + '" data-field="role" placeholder="ตำแหน่ง"></td>';
            // สัดส่วน
            html += '<td><input type="number" class="researchers-input researchers-percent-input" value="' + (Number(item.percentage) || 0) + '" data-idx="' + idx + '" data-field="percentage" min="0" max="100" step="0.01"></td>';
            // ลบ
            html += '<td><button class="researchers-delete-btn" onclick="deleteResearcherItem(' + idx + ')" title="ลบ">&times;</button></td>';
        } else {
            // ชื่อ-สกุล + หน่วยงาน
            html += '<td class="researchers-name-cell">' +
                '<div class="researchers-name">' + escapeHtml(item.name || '') + '</div>' +
                (item.organization ? '<div class="researchers-org">หน่วยงาน : ' + escapeHtml(item.organization) + '</div>' : '') +
                '</td>';
            // ตำแหน่ง
            html += '<td>' + escapeHtml(item.role || '') + '</td>';
            // สัดส่วน
            html += '<td class="researchers-percent-cell">' + (Number(item.percentage) || 0).toFixed(2) + '</td>';
        }

        html += '</tr>';
    });

    tbody.innerHTML = html;

    if (researchersEditMode) {
        attachResearchersEditListeners();
    }
}

// ============================================================
// Edit Mode
// ============================================================

function updateResearchersEditButtons() {
    var container = document.getElementById('editResearchersBtnContainer');
    if (!container) return;

    if (researchersEditMode) {
        container.innerHTML =
            '<div class="budget-btn-group">' +
                '<button class="edit-toggle-btn save-btn" onclick="saveResearchersEditMode()">บันทึก</button>' +
                '<button class="edit-toggle-btn cancel-btn" onclick="cancelResearchersEditMode()">ยกเลิก</button>' +
            '</div>';
    } else {
        container.innerHTML =
            '<div class="budget-btn-group">' +
                '<button class="edit-toggle-btn" onclick="toggleResearchersEditMode()">แก้ไข</button>' +
                '<button class="edit-toggle-btn" onclick="showAddResearcherModal()">+ เพิ่มรายการ</button>' +
            '</div>';
    }
}

function toggleResearchersEditMode() {
    if (!researchersEditMode) {
        var sheet = DATA.sheets[currentSheet];
        researchersSnapshot = JSON.parse(JSON.stringify(sheet.researchers));
        researchersEditMode = true;
    }
    renderResearchersPage();
}

function saveResearchersEditMode() {
    if (!confirm('ยืนยันการบันทึกคณะผู้วิจัย?')) return;

    saveAllToFirebase();

    researchersEditMode = false;
    researchersSnapshot = null;
    renderResearchersPage();
    showStatus('success', 'บันทึกคณะผู้วิจัยเรียบร้อยแล้ว');
}

function cancelResearchersEditMode() {
    if (researchersSnapshot) {
        DATA.sheets[currentSheet].researchers = JSON.parse(JSON.stringify(researchersSnapshot));
    }
    researchersEditMode = false;
    researchersSnapshot = null;
    renderResearchersPage();
}

function attachResearchersEditListeners() {
    var inputs = document.querySelectorAll('#researchersTableBody .researchers-input');
    inputs.forEach(function(input) {
        input.addEventListener('input', function() {
            var idx = parseInt(this.dataset.idx);
            var field = this.dataset.field;
            var sheet = DATA.sheets[currentSheet];
            var item = sheet.researchers[idx];
            if (!item) return;

            if (field === 'percentage') {
                item.percentage = Number(this.value) || 0;
            } else {
                item[field] = this.value;
            }
        });
    });
}

function deleteResearcherItem(idx) {
    var sheet = DATA.sheets[currentSheet];
    var item = sheet.researchers[idx];
    var itemName = (item && item.name) || 'รายการที่ ' + (idx + 1);

    if (!confirm('ลบ "' + itemName + '" ?')) return;

    sheet.researchers.splice(idx, 1);
    saveAllToFirebase();
    renderResearchersPage();
}

// ============================================================
// Add Item Modal
// ============================================================

function showAddResearcherModal() {
    var overlay = document.createElement('div');
    overlay.className = 'researchers-modal-overlay';
    overlay.id = 'researchersModalOverlay';

    overlay.innerHTML =
        '<div class="researchers-modal">' +
            '<h3>เพิ่มผู้วิจัย</h3>' +
            '<div class="researchers-modal-field">' +
                '<label>ชื่อ - สกุล</label>' +
                '<input type="text" id="addResName" placeholder="เช่น นายยูเป็ง แยน">' +
            '</div>' +
            '<div class="researchers-modal-field">' +
                '<label>หน่วยงาน</label>' +
                '<input type="text" id="addResOrg" placeholder="เช่น มหาวิทยาลัยเทคโนโลยีสุรนารี สํานักวิชาวิทยาศาสตร์">' +
            '</div>' +
            '<div class="researchers-modal-field">' +
                '<label>ตำแหน่งในโครงการ</label>' +
                '<input type="text" id="addResRole" placeholder="เช่น หัวหน้าโครงการ, ผู้ร่วมวิจัย">' +
            '</div>' +
            '<div class="researchers-modal-field">' +
                '<label>สัดส่วนการมีส่วนร่วม (%)</label>' +
                '<input type="number" id="addResPercent" value="0" min="0" max="100" step="0.01">' +
            '</div>' +
            '<div class="researchers-modal-buttons">' +
                '<button class="cancel-btn" onclick="closeResearcherModal()">ยกเลิก</button>' +
                '<button class="confirm-btn" onclick="confirmAddResearcher()">เพิ่มรายการ</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeResearcherModal();
    });
}

function closeResearcherModal() {
    var overlay = document.getElementById('researchersModalOverlay');
    if (overlay) overlay.remove();
}

function confirmAddResearcher() {
    var name = document.getElementById('addResName').value.trim();
    if (!name) {
        alert('กรุณาใส่ชื่อ - สกุล');
        return;
    }

    var organization = document.getElementById('addResOrg').value.trim();
    var role = document.getElementById('addResRole').value.trim();
    var percentage = Number(document.getElementById('addResPercent').value) || 0;

    var sheet = DATA.sheets[currentSheet];
    ensureResearchersStructure(sheet);

    sheet.researchers.push({
        name: name,
        organization: organization,
        role: role,
        percentage: percentage
    });

    saveAllToFirebase();
    closeResearcherModal();
    renderResearchersPage();
    showStatus('success', 'เพิ่มผู้วิจัย "' + name + '" เรียบร้อยแล้ว');
}

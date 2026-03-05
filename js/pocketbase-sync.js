// ============================================================
// PocketBase Sync Module
// แทนที่ Firebase — sync ข้อมูลกับ PocketBase
// ============================================================

var _pbInitialized = false;
var _savingInProgress = false;

function initializePocketBase() {
    if (_pbInitialized) return;
    _pbInitialized = true;

    // โหลด projects ทั้งหมดจาก PocketBase
    pb.collection('projects').getFullList({ sort: 'created' }).then(function(records) {
        if (records.length > 0) {
            DATA.sheets = [];
            pbRecordIds = [];
            records.forEach(function(record) {
                var sheet = {
                    name: record.name || '',
                    info: record.info || {},
                    outputs: record.outputs || [],
                    budget: record.budget || [],
                    workplan: record.workplan || [],
                    researchers: record.researchers || []
                };
                // ensure extendDates array exists
                if (sheet.info && !sheet.info.extendDates) {
                    sheet.info.extendDates = sheet.info.extendDate ? [sheet.info.extendDate, '', ''] : ['', '', ''];
                }
                DATA.sheets.push(sheet);
                pbRecordIds.push(record.id);
            });
        } else {
            // ถ้ายังไม่มีข้อมูล ใช้ DEFAULT_DATA แล้ว seed ขึ้น PocketBase
            DATA.sheets = DEFAULT_DATA.sheets;
            seedProjectsToPocketBase();
        }

        renderSheetList();
        renderCurrentPage();
        console.log('Data synced from PocketBase:', DATA.sheets.length, 'projects');

        // Subscribe realtime updates
        subscribeRealtime();

    }).catch(function(err) {
        console.error('PocketBase load error:', err);
        showStatus('error', 'ไม่สามารถเชื่อมต่อ PocketBase ได้');
    });
}

// ============================================================
// Realtime Subscription
// ============================================================

function subscribeRealtime() {
    pb.collection('projects').subscribe('*', function(e) {
        // ไม่อัปเดตถ้าเรากำลัง save อยู่ (ป้องกัน loop)
        if (_savingInProgress) return;

        var recordId = e.record.id;
        var idx = pbRecordIds.indexOf(recordId);

        if (e.action === 'update' && idx >= 0) {
            DATA.sheets[idx] = {
                name: e.record.name || '',
                info: e.record.info || {},
                outputs: e.record.outputs || [],
                budget: e.record.budget || [],
                workplan: e.record.workplan || [],
                researchers: e.record.researchers || []
            };
            if (DATA.sheets[idx].info && !DATA.sheets[idx].info.extendDates) {
                DATA.sheets[idx].info.extendDates = DATA.sheets[idx].info.extendDate
                    ? [DATA.sheets[idx].info.extendDate, '', ''] : ['', '', ''];
            }
            renderSheetList();
            renderCurrentPage();
        } else if (e.action === 'create') {
            DATA.sheets.push({
                name: e.record.name || '',
                info: e.record.info || {},
                outputs: e.record.outputs || [],
                budget: e.record.budget || [],
                workplan: e.record.workplan || [],
                researchers: e.record.researchers || []
            });
            pbRecordIds.push(e.record.id);
            renderSheetList();
        } else if (e.action === 'delete' && idx >= 0) {
            DATA.sheets.splice(idx, 1);
            pbRecordIds.splice(idx, 1);
            if (currentSheet >= DATA.sheets.length) currentSheet = Math.max(0, DATA.sheets.length - 1);
            renderSheetList();
            renderCurrentPage();
        }
    });
}

// ============================================================
// Render Helper
// ============================================================

function renderCurrentPage() {
    if (currentPage === 'dashboard') {
        renderDashboard();
    } else if (currentPage === 'budget') {
        renderBudgetPage();
    } else if (currentPage === 'workplan') {
        renderWorkplanPage();
    } else if (currentPage === 'researchers') {
        renderResearchersPage();
    } else {
        renderComparison();
    }
}

// ============================================================
// Save Functions
// ============================================================

// บันทึกทุก project (เรียกจากหลาย ๆ ที่)
function saveAllProjects() {
    if (pbRecordIds.length === 0) {
        // ยังไม่เคย seed → สร้างใหม่ทั้งหมด
        seedProjectsToPocketBase();
        return;
    }

    _savingInProgress = true;
    var promises = [];

    DATA.sheets.forEach(function(sheet, idx) {
        var recordId = pbRecordIds[idx];
        if (recordId) {
            promises.push(
                pb.collection('projects').update(recordId, {
                    name: sheet.name || '',
                    info: sheet.info || {},
                    outputs: sheet.outputs || [],
                    budget: sheet.budget || [],
                    workplan: sheet.workplan || [],
                    researchers: sheet.researchers || []
                })
            );
        } else {
            // record ใหม่ที่ยังไม่มี ID
            promises.push(
                pb.collection('projects').create({
                    name: sheet.name || '',
                    info: sheet.info || {},
                    outputs: sheet.outputs || [],
                    budget: sheet.budget || [],
                    workplan: sheet.workplan || [],
                    researchers: sheet.researchers || []
                }).then(function(record) {
                    pbRecordIds[idx] = record.id;
                })
            );
        }
    });

    Promise.all(promises)
        .then(function() { console.log('Data saved to PocketBase'); })
        .catch(function(err) { console.error('Save error:', err); })
        .finally(function() { _savingInProgress = false; });
}

// Seed ข้อมูลเริ่มต้นขึ้น PocketBase
function seedProjectsToPocketBase() {
    _savingInProgress = true;
    pbRecordIds = [];
    var promises = DATA.sheets.map(function(sheet) {
        return pb.collection('projects').create({
            name: sheet.name || '',
            info: sheet.info || {},
            outputs: sheet.outputs || [],
            budget: sheet.budget || [],
            workplan: sheet.workplan || [],
            researchers: sheet.researchers || []
        }).then(function(record) {
            pbRecordIds.push(record.id);
        });
    });

    Promise.all(promises)
        .then(function() { console.log('Seeded', DATA.sheets.length, 'projects to PocketBase'); })
        .catch(function(err) { console.error('Seed error:', err); })
        .finally(function() { _savingInProgress = false; });
}

// ลบ project จาก PocketBase
function deleteProjectFromPocketBase(sheetIdx) {
    var recordId = pbRecordIds[sheetIdx];
    if (!recordId) return Promise.resolve();
    return pb.collection('projects').delete(recordId).then(function() {
        pbRecordIds.splice(sheetIdx, 1);
    });
}

// ============================================================
// User Functions (ใช้ PocketBase users collection)
// ============================================================

function loadUsers() {
    return pb.collection('users').getFullList().then(function(records) {
        return records.map(function(r) {
            return {
                id: r.id,
                username: r.username,
                role: r.role || 'leader',
                displayName: r.displayName || r.username
            };
        });
    });
}

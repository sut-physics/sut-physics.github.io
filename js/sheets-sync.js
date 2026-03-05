// ============================================================
// Data Save Module
// บันทึกข้อมูลที่แก้ไขบน Dashboard ลง Firebase
// ============================================================

// บันทึก info field (ชื่อโครงการ, งบประมาณ, ฯลฯ)
function saveInfoField(sheetIdx, field, value) {
    var sheet = DATA.sheets[sheetIdx];
    if (!sheet) return;

    // อัปเดต DATA
    sheet.info[field] = value;

    // เมื่อแก้งบประมาณ → คำนวณ remainingBudget + อัปเดต warning
    if (field === 'budget') {
        var budget = parseNum(sheet.info.budget);
        var used = parseNum(sheet.info.usedBudget);
        sheet.info.remainingBudget = String(budget - used);
        var remainEl = document.querySelector('[data-field="remainingBudget"]');
        if (remainEl && !remainEl.querySelector('input')) {
            remainEl.textContent = formatNumber(sheet.info.remainingBudget);
        }
        updateBudgetMismatchWarning(sheet);
    }

    // Save Firebase
    saveAllToFirebase();
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
}

// บันทึก names
function saveOutputNames(sheetIdx, catIdx, itemIdx, names) {
    var sheet = DATA.sheets[sheetIdx];
    if (!sheet) return;

    // อัปเดต DATA
    sheet.outputs[catIdx].items[itemIdx].names = names;

    // Save Firebase
    saveAllToFirebase();
}

// ============================================================
// Sync Budget Totals → Info
// คำนวณผลรวมจากหน้ารายละเอียดงบ แล้วอัปเดต info
// ============================================================

function syncBudgetToInfo(sheet) {
    if (!sheet || !sheet.budget || !sheet.info) return;

    var totalAllocated = 0, totalUsed = 0;
    sheet.budget.forEach(function(bt) {
        if (!bt || !bt.categories) return;
        bt.categories.forEach(function(cat) {
            if (!cat || !cat.items) return;
            cat.items.forEach(function(item) {
                totalAllocated += parseNum(item.budget);
                totalUsed += parseNum(item.used);
            });
        });
    });

    // อัปเดต info
    sheet.info.usedBudget = String(totalUsed);
    var masterBudget = parseNum(sheet.info.budget);
    sheet.info.remainingBudget = String(masterBudget - totalUsed);

    // อัปเดต UI ใน Dashboard (ถ้ากำลังแสดงอยู่)
    var usedEl = document.querySelector('[data-field="usedBudget"]');
    if (usedEl && !usedEl.querySelector('input')) {
        usedEl.textContent = formatNumber(sheet.info.usedBudget);
    }
    var remainEl = document.querySelector('[data-field="remainingBudget"]');
    if (remainEl && !remainEl.querySelector('input')) {
        remainEl.textContent = formatNumber(sheet.info.remainingBudget);
    }

    // อัปเดต budget mismatch warning
    updateBudgetMismatchWarning(sheet);
}

function updateBudgetMismatchWarning(sheet) {
    var warningEl = document.getElementById('budgetMismatchWarning');
    if (!warningEl) return;

    var totalAllocated = 0;
    if (sheet.budget) {
        sheet.budget.forEach(function(bt) {
            if (!bt || !bt.categories) return;
            bt.categories.forEach(function(cat) {
                if (!cat || !cat.items) return;
                cat.items.forEach(function(item) {
                    totalAllocated += parseNum(item.budget);
                });
            });
        });
    }

    var masterBudget = parseNum(sheet.info.budget);
    var diff = totalAllocated - masterBudget;

    if (diff === 0 || totalAllocated === 0) {
        warningEl.style.display = 'none';
        warningEl.textContent = '';
    } else if (diff > 0) {
        warningEl.style.display = 'block';
        warningEl.textContent = 'จัดสรรเกินงบ ' + formatNumber(String(diff)) + ' บาท';
        warningEl.className = 'budget-mismatch-warning over';
    } else {
        warningEl.style.display = 'block';
        warningEl.textContent = 'จัดสรรไม่ครบ ขาดอีก ' + formatNumber(String(Math.abs(diff))) + ' บาท';
        warningEl.className = 'budget-mismatch-warning under';
    }
}

// ============================================================
// Export Modal + Multi-project Export (Excel & PDF)
// ============================================================

function showExportModal() {
    var listEl = document.getElementById('exportSheetList');
    listEl.innerHTML = '';
    DATA.sheets.forEach(function(sheet, idx) {
        var item = document.createElement('div');
        item.className = 'export-sheet-item';
        var checked = idx === currentSheet ? 'checked' : '';
        item.innerHTML = '<input type="checkbox" id="exportSheet' + idx + '" value="' + idx + '" ' + checked + '>' +
            '<span>' + (sheet.info.projectName || sheet.name || 'โครงการ ' + (idx + 1)) + '</span>';
        item.onclick = function(e) {
            if (e.target.tagName !== 'INPUT') {
                var cb = item.querySelector('input');
                cb.checked = !cb.checked;
            }
        };
        listEl.appendChild(item);
    });
    document.getElementById('exportModal').style.display = 'flex';
}

function hideExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

function exportSelectAll(selectAll) {
    var checkboxes = document.querySelectorAll('#exportSheetList input[type="checkbox"]');
    checkboxes.forEach(function(cb) { cb.checked = selectAll; });
}

function confirmExport() {
    var checkboxes = document.querySelectorAll('#exportSheetList input[type="checkbox"]:checked');
    var selectedIndices = [];
    checkboxes.forEach(function(cb) { selectedIndices.push(Number(cb.value)); });

    if (selectedIndices.length === 0) {
        showStatus('error', 'กรุณาเลือกอย่างน้อย 1 โครงการ');
        return;
    }

    var format = document.querySelector('input[name="exportFormat"]:checked').value;
    hideExportModal();

    if (format === 'pdf') {
        exportToPDF(selectedIndices);
    } else {
        exportToExcel(selectedIndices);
    }
}

function getDateStr() {
    var today = new Date();
    return today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
}

// --- Excel Export (multi-project) ---
function exportToExcel(indices) {
    var wb = XLSX.utils.book_new();

    indices.forEach(function(idx, i) {
        var sheet = DATA.sheets[idx];
        if (!sheet) return;
        var info = sheet.info || {};
        var suffix = indices.length > 1 ? ' (' + (i + 1) + ')' : '';

        // Sheet: ข้อมูลโครงการ
        var infoData = [
            ['ชื่อโครงการ (ไทย)', info.projectName || ''],
            ['ชื่อโครงการ (อังกฤษ)', info.projectNameEng || ''],
            ['หัวหน้าโครงการ', info.leader || ''],
            ['ระยะเวลาดำเนินการ', info.duration || ''],
            ['วันเริ่มต้น', info.startDate || ''],
            ['วันสิ้นสุด', info.endDate || ''],
            ['วันขยายเวลา', info.extendDate || ''],
            ['ขยายเวลาครั้งที่ 1', (info.extendDates && info.extendDates[0]) || ''],
            ['ขยายเวลาครั้งที่ 2', (info.extendDates && info.extendDates[1]) || ''],
            ['ขยายเวลาครั้งที่ 3', (info.extendDates && info.extendDates[2]) || ''],
            ['ปีงบประมาณ', info.fiscalYear || ''],
            ['งบประมาณ', parseNum(info.budget)],
            ['งบประมาณที่ใช้ไป', parseNum(info.usedBudget)],
            ['งบประมาณคงเหลือ', parseNum(info.remainingBudget)],
            ['รหัสโครงการ', info.projectCode || '']
        ];
        var wsInfo = XLSX.utils.aoa_to_sheet([['หัวข้อ', 'ข้อมูล']].concat(infoData));
        wsInfo['!cols'] = [{ wch: 25 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, wsInfo, ('ข้อมูล' + suffix).substring(0, 31));

        // Sheet: ผลผลิต
        var outputHeader = ['หมวด', 'รายการ', 'เป้าหมาย', 'แล้วเสร็จ'];
        for (var n = 1; n <= 10; n++) outputHeader.push('รายชื่อ ' + n);
        var outputRows = [outputHeader];
        if (sheet.outputs) {
            sheet.outputs.forEach(function(cat) {
                cat.items.forEach(function(item) {
                    var row = [cat.name, item.name, item.target || 0, item.completed || 0];
                    var names = item.names || [];
                    for (var j = 0; j < 10; j++) row.push(names[j] || '');
                    outputRows.push(row);
                });
            });
        }
        var wsOutput = XLSX.utils.aoa_to_sheet(outputRows);
        wsOutput['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsOutput, ('ผลผลิต' + suffix).substring(0, 31));

        // Sheet: งบประมาณ
        var budgetHeader = ['ประเภทงบ', 'หมวด', 'รายการ', 'งบประมาณ (บาท)', 'ใช้จ่าย (บาท)', 'คงเหลือ (บาท)'];
        var budgetRows = [budgetHeader];
        if (sheet.budget) {
            sheet.budget.forEach(function(bt) {
                bt.categories.forEach(function(cat) {
                    cat.items.forEach(function(item) {
                        if (!item.name) return;
                        budgetRows.push([
                            bt.type, cat.name, item.name,
                            parseNum(item.budget),
                            parseNum(item.used),
                            parseNum(item.remaining)
                        ]);
                    });
                    budgetRows.push([
                        '', 'รวม ' + cat.name, '',
                        parseNum(cat.totalBudget),
                        parseNum(cat.totalUsed),
                        parseNum(cat.totalRemaining)
                    ]);
                });
            });
        }
        var wsBudget = XLSX.utils.aoa_to_sheet(budgetRows);
        wsBudget['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, wsBudget, ('งบประมาณ' + suffix).substring(0, 31));
    });

    var dateStr = getDateStr();
    var fileName;
    if (indices.length === 1) {
        var s = DATA.sheets[indices[0]];
        fileName = ((s.info.projectName || s.name || 'export') + '_' + dateStr + '.xlsx');
    } else {
        fileName = 'export_' + indices.length + '_projects_' + dateStr + '.xlsx';
    }

    XLSX.writeFile(wb, fileName);
    showStatus('success', 'Export เรียบร้อย: ' + fileName);
}

// --- PDF Export (multi-project, Thai font) ---
function exportToPDF(indices) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Register Sarabun Thai font
    doc.addFileToVFS('Sarabun-Regular.ttf', SARABUN_REGULAR);
    doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
    doc.addFileToVFS('Sarabun-Bold.ttf', SARABUN_BOLD);
    doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold');
    doc.setFont('Sarabun');

    var tableFont = { font: 'Sarabun' };

    indices.forEach(function(idx, i) {
        var sheet = DATA.sheets[idx];
        if (!sheet) return;
        var info = sheet.info || {};

        if (i > 0) doc.addPage();

        // Title
        doc.setFont('Sarabun', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30, 58, 138);
        doc.text(info.projectName || sheet.name || 'โครงการ ' + (idx + 1), 14, 15);

        doc.setFont('Sarabun', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        if (info.projectNameEng) doc.text(info.projectNameEng, 14, 21);

        // Project Info Table
        var infoBody = [
            ['หัวหน้าโครงการ', info.leader || '-'],
            ['ระยะเวลา', info.duration || '-'],
            ['วันเริ่มต้น', info.startDate || '-'],
            ['วันสิ้นสุด', info.endDate || '-'],
            ['วันขยายเวลา', info.extendDate || '-'],
            ['ปีงบประมาณ', info.fiscalYear || '-'],
            ['งบประมาณ', formatNumber(info.budget) || '-'],
            ['ใช้ไป', formatNumber(info.usedBudget) || '-'],
            ['คงเหลือ', formatNumber(info.remainingBudget) || '-'],
            ['รหัสโครงการ', info.projectCode || '-']
        ];
        doc.autoTable({
            startY: 25,
            head: [['หัวข้อ', 'ข้อมูล']],
            body: infoBody,
            theme: 'grid',
            styles: Object.assign({ fontSize: 9, cellPadding: 2 }, tableFont),
            headStyles: { fillColor: [30, 58, 138], fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 50 } },
            margin: { left: 14 }
        });

        // Outputs Table (right side)
        var outputBody = [];
        if (sheet.outputs) {
            sheet.outputs.forEach(function(cat) {
                cat.items.forEach(function(item) {
                    var filteredNames = (item.names || []).filter(function(n) { return n; });
                    var nameList = filteredNames.map(function(n, i) { return (i + 1) + '. ' + n; }).join('\n');
                    outputBody.push([cat.name, item.name, item.target || 0, item.completed || 0, nameList]);
                });
            });
        }
        if (outputBody.length > 0) {
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 10,
                head: [['หมวด', 'รายการ', 'เป้าหมาย', 'แล้วเสร็จ', 'รายชื่อ']],
                body: outputBody,
                theme: 'grid',
                styles: Object.assign({ fontSize: 8, cellPadding: 1.5 }, tableFont),
                headStyles: { fillColor: [30, 58, 138], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 20, halign: 'center' }
                },
                margin: { left: 14 }
            });
        }

        // Budget Table (new page)
        var budgetBody = [];
        if (sheet.budget) {
            sheet.budget.forEach(function(bt) {
                bt.categories.forEach(function(cat) {
                    cat.items.forEach(function(item) {
                        if (!item.name) return;
                        budgetBody.push([
                            bt.type, cat.name, item.name,
                            formatNumber(item.budget),
                            formatNumber(item.used),
                            formatNumber(item.remaining)
                        ]);
                    });
                    budgetBody.push([
                        { content: '', styles: { fontStyle: 'bold' } },
                        { content: 'รวม ' + cat.name, styles: { fontStyle: 'bold' } },
                        '',
                        { content: formatNumber(cat.totalBudget), styles: { fontStyle: 'bold' } },
                        { content: formatNumber(cat.totalUsed), styles: { fontStyle: 'bold' } },
                        { content: formatNumber(cat.totalRemaining), styles: { fontStyle: 'bold' } }
                    ]);
                });
            });
        }
        if (budgetBody.length > 0) {
            doc.addPage();
            doc.setFont('Sarabun', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(30, 58, 138);
            doc.text('งบประมาณ: ' + (info.projectName || sheet.name || ''), 14, 15);

            doc.autoTable({
                startY: 20,
                head: [['ประเภทงบ', 'หมวด', 'รายการ', 'งบประมาณ (บาท)', 'ใช้จ่าย (บาท)', 'คงเหลือ (บาท)']],
                body: budgetBody,
                theme: 'grid',
                styles: Object.assign({ fontSize: 9, cellPadding: 2 }, tableFont),
                headStyles: { fillColor: [30, 58, 138], fontStyle: 'bold' },
                columnStyles: {
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' }
                }
            });
        }
    });

    var dateStr = getDateStr();
    var fileName;
    if (indices.length === 1) {
        var s = DATA.sheets[indices[0]];
        fileName = ((s.info.projectName || s.name || 'export') + '_' + dateStr + '.pdf');
    } else {
        fileName = 'export_' + indices.length + '_projects_' + dateStr + '.pdf';
    }

    doc.save(fileName);
    showStatus('success', 'Export PDF เรียบร้อย: ' + fileName);
}

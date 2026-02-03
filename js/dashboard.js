function renderSheetList() {
    var list = document.getElementById('sheetList');
    list.innerHTML = DATA.sheets.map(function(sheet, idx) {
        return '<li class="sheet-item ' + (idx === currentSheet ? 'active' : '') + '" data-index="' + idx + '">' +
            '<span class="radio"></span>' +
            '<span>' + sheet.name + '</span>' +
            '<button class="delete-btn" data-index="' + idx + '" title="\u0e25\u0e1a Sheet \u0e19\u0e35\u0e49">\u00d7</button>' +
        '</li>';
    }).join('');

    list.querySelectorAll('.sheet-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-btn')) return;
            var idx = parseInt(e.currentTarget.dataset.index);
            currentSheet = idx;
            renderSheetList();
            renderDashboard();
        });
    });

    list.querySelectorAll('.delete-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var idx = parseInt(e.target.dataset.index);
            deleteSheet(idx);
        });
    });
}

function renderDashboard() {
    var sheet = DATA.sheets[currentSheet];
    var info = sheet.info;

    document.getElementById('projectTitle').textContent = info.projectName || '\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23\u0e27\u0e34\u0e08\u0e31\u0e22';
    document.getElementById('projectLeader').textContent = '\u0e2b\u0e31\u0e27\u0e2b\u0e19\u0e49\u0e32\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23: ' + (info.leader || '-');

    document.getElementById('projectInfo').innerHTML =
        '<div class="info-box" style="grid-column: span 2;">' +
            '<div class="value" style="font-size: 1.2rem;">' + (info.projectCode || '-') + '</div>' +
            '<div class="label">\u0e23\u0e2b\u0e31\u0e2a\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23</div>' +
        '</div>' +
        '<div class="info-box" style="grid-column: span 2;">' +
            '<div class="value" style="font-size: 0.9rem;">' + (info.projectNameEng || '-') + '</div>' +
            '<div class="label">\u0e0a\u0e37\u0e48\u0e2d\u0e20\u0e32\u0e29\u0e32\u0e2d\u0e31\u0e07\u0e01\u0e24\u0e29</div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value">' + (info.fiscalYear || '-') + '</div>' +
            '<div class="label">\u0e1b\u0e35\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13</div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value">' + (info.startDate || '-') + '</div>' +
            '<div class="label">\u0e40\u0e23\u0e34\u0e48\u0e21\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23</div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value">' + (info.endDate || '-') + '</div>' +
            '<div class="label">\u0e08\u0e1a\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23</div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value">' + formatNumber(info.budget) + '</div>' +
            '<div class="label">\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13 (\u0e1a\u0e32\u0e17)</div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value" style="color: #e74c3c;">' + formatNumber(info.usedBudget) + '</div>' +
            '<div class="label">งบประมาณที่ใช้ไป (บาท)</div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value" style="color: #2ecc71;">' + formatNumber(info.remainingBudget) + '</div>' +
            '<div class="label">งบประมาณคงเหลือ (บาท)</div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value">' + (info.extendDate || '-') + '</div>' +
            '<div class="label">\u0e02\u0e22\u0e32\u0e22\u0e40\u0e27\u0e25\u0e32\u0e16\u0e36\u0e07</div>' +
        '</div>' +
        '<div class="info-box">' +
            '<div class="value">' + (info.duration || '-') + '</div>' +
            '<div class="label">\u0e23\u0e30\u0e22\u0e30\u0e40\u0e27\u0e25\u0e32\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23</div>' +
        '</div>';

    var summaries = calculateSummary(sheet.outputs);
    document.getElementById('summaryCards').innerHTML = summaries.map(function(s) {
        return '<div class="summary-card">' +
            '<div class="value">' + s.completed + '/' + s.target + '</div>' +
            '<div class="label">' + s.name + '</div>' +
        '</div>';
    }).join('');

    var tableHTML = '';
    sheet.outputs.forEach(function(cat) {
        tableHTML += '<tr class="category-row"><td colspan="5">' + cat.name + '</td></tr>';

        cat.items.forEach(function(item) {
            var percent = item.target > 0 ? Math.min((item.completed / item.target) * 100, 100) : 0;
            var fillClass = percent >= 100 ? '' : percent >= 50 ? 'warning' : 'danger';

            var namesHTML = '-';
            if (item.names && item.names.length > 0) {
                namesHTML = '<div class="names-list">' + item.names.map(function(n, i) {
                    return '<div class="name-item">' + (i+1) + '. ' + n + '</div>';
                }).join('') + '</div>';
            }

            tableHTML += '<tr>' +
                '<td style="padding-left: 30px">' + item.name + '</td>' +
                '<td class="number target">' + (item.target || '-') + '</td>' +
                '<td class="number completed">' + (item.completed || '-') + '</td>' +
                '<td>' +
                    '<div class="progress-bar">' +
                        '<div class="fill ' + fillClass + '" style="width: ' + percent + '%"></div>' +
                    '</div>' +
                    '<small style="color: #666">' + percent.toFixed(0) + '%</small>' +
                '</td>' +
                '<td>' + namesHTML + '</td>' +
            '</tr>';
        });
    });
    document.getElementById('outputTable').innerHTML = tableHTML;
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

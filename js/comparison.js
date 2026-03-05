var budgetComparisonChart = null;

function renderComparison() {
    // Auto-select sheets if none selected
    if (selectedSheetsForComparison.length === 0 && DATA.sheets.length > 0) {
        selectedSheetsForComparison = [];
        for (var i = 0; i < Math.min(DATA.sheets.length, MAX_COMPARISON_SHEETS); i++) {
            selectedSheetsForComparison.push(i);
        }
    }
    renderSheetSelector();
    renderComparisonContent();
}

function renderComparisonContent() {
    var selectedSheets = selectedSheetsForComparison.map(function(i) { return DATA.sheets[i]; });
    var sheetNames = selectedSheets.map(function(s) { return s.name; });

    // Render project info comparison
    renderProjectInfoComparison(selectedSheets, sheetNames);

    // Render budget comparison chart
    renderBudgetComparisonChart(selectedSheets, sheetNames);

    var mainCategories = [
        { number: 1, title: '\u0e01\u0e33\u0e25\u0e31\u0e07\u0e04\u0e19\u0e2b\u0e23\u0e37\u0e2d\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19\u0e17\u0e35\u0e48\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e01\u0e32\u0e23\u0e1e\u0e31\u0e12\u0e19\u0e32\u0e17\u0e31\u0e01\u0e29\u0e30', outputIndex: 0 },
        { number: 2, title: '\u0e15\u0e49\u0e19\u0e09\u0e1a\u0e31\u0e1a\u0e1a\u0e17\u0e04\u0e27\u0e32\u0e21\u0e27\u0e34\u0e08\u0e31\u0e22 (Manuscript)', outputIndex: 1 },
        { number: 3, title: '\u0e2b\u0e19\u0e31\u0e07\u0e2a\u0e37\u0e2d', outputIndex: 2 },
        { number: 4, title: '\u0e15\u0e49\u0e19\u0e41\u0e1a\u0e1a\u0e1c\u0e25\u0e34\u0e15\u0e20\u0e31\u0e13\u0e11\u0e4c\u0e2b\u0e23\u0e37\u0e2d\u0e40\u0e17\u0e04\u0e42\u0e19\u0e42\u0e25\u0e22\u0e35/\u0e01\u0e23\u0e30\u0e1a\u0e27\u0e19\u0e01\u0e32\u0e23\u0e43\u0e2b\u0e21\u0e48\u0e2b\u0e23\u0e37\u0e2d\u0e19\u0e27\u0e31\u0e15\u0e01\u0e23\u0e23\u0e21\u0e17\u0e32\u0e07\u0e2a\u0e31\u0e07\u0e04\u0e21', outputIndex: 3 },
        { number: 5, title: '\u0e17\u0e23\u0e31\u0e1e\u0e22\u0e4c\u0e2a\u0e34\u0e19\u0e17\u0e32\u0e07\u0e1b\u0e31\u0e0d\u0e0d\u0e32', outputIndex: 4 },
        { number: 6, title: '\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e21\u0e37\u0e2d\u0e41\u0e25\u0e30\u0e42\u0e04\u0e23\u0e07\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1e\u0e37\u0e49\u0e19\u0e10\u0e32\u0e19 (Facilities and Infrastructure) \u0e14\u0e49\u0e32\u0e19 \u0e27\u0e27\u0e19.', outputIndex: 5 },
        { number: 7, title: '\u0e10\u0e32\u0e19\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25/\u0e23\u0e30\u0e1a\u0e1a\u0e41\u0e25\u0e30\u0e01\u0e25\u0e44\u0e01', outputIndex: 6 },
        { number: 8, title: '\u0e40\u0e04\u0e23\u0e37\u0e2d\u0e02\u0e48\u0e32\u0e22', outputIndex: 7 },
        { number: 9, title: '\u0e02\u0e49\u0e2d\u0e40\u0e2a\u0e19\u0e2d\u0e41\u0e19\u0e30\u0e40\u0e0a\u0e34\u0e07\u0e19\u0e42\u0e22\u0e1a\u0e32\u0e22 (Policy Recommendation) \u0e41\u0e25\u0e30\u0e21\u0e32\u0e15\u0e23\u0e01\u0e32\u0e23 (Measures)', outputIndex: 8 }
    ];

    renderAccordion(mainCategories, selectedSheets, sheetNames);

    var progressPerSheet = selectedSheets.map(function(sheet) {
        var totalTarget = 0;
        var totalCompleted = 0;

        mainCategories.forEach(function(cat) {
            var output = sheet.outputs[cat.outputIndex];
            if (output && output.items) {
                output.items.forEach(function(item) {
                    totalTarget += item.target || 0;
                    totalCompleted += item.completed || 0;
                });
            }
        });

        return {
            target: totalTarget,
            completed: totalCompleted,
            percent: totalTarget > 0 ? (totalCompleted / totalTarget * 100).toFixed(1) : 0
        };
    });

    var ctx1 = document.getElementById('comparisonChart').getContext('2d');
    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: sheetNames,
            datasets: [{
                label: '\u0e04\u0e27\u0e32\u0e21\u0e04\u0e37\u0e1a\u0e2b\u0e19\u0e49\u0e32 (%)',
                data: progressPerSheet.map(function(p) { return p.percent; }),
                backgroundColor: progressPerSheet.map(function(p) {
                    return parseFloat(p.percent) >= 100 ? 'rgba(40, 167, 69, 0.7)' :
                        parseFloat(p.percent) >= 50 ? 'rgba(255, 193, 7, 0.7)' :
                        'rgba(220, 53, 69, 0.7)';
                }),
                borderColor: progressPerSheet.map(function(p) {
                    return parseFloat(p.percent) >= 100 ? 'rgba(40, 167, 69, 1)' :
                        parseFloat(p.percent) >= 50 ? 'rgba(255, 193, 7, 1)' :
                        'rgba(220, 53, 69, 1)';
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '\u0e04\u0e27\u0e32\u0e21\u0e04\u0e37\u0e1a\u0e2b\u0e19\u0e49\u0e32\u0e23\u0e27\u0e21 10 \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e2b\u0e25\u0e31\u0e01'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) { return value + '%'; }
                    }
                }
            }
        }
    });
}

function renderProjectInfoComparison(selectedSheets, sheetNames) {
    var container = document.getElementById('comparisonProjectInfo');
    if (selectedSheets.length === 0) {
        container.innerHTML = '';
        return;
    }

    var html = '';

    // Section 1: Timeline & Duration
    html += '<div class="comparison-info-section">' +
        '<h3 class="comparison-info-title">ระยะเวลาโครงการ</h3>' +
        '<div class="comparison-info-table-wrap">' +
        '<table class="comparison-info-table">' +
        '<thead><tr><th>รายการ</th>';
    sheetNames.forEach(function(name) {
        html += '<th>' + name + '</th>';
    });
    html += '</tr></thead><tbody>';

    var timelineFields = [
        { key: 'fiscalYear', label: 'ปีงบประมาณ' },
        { key: 'duration', label: 'ระยะเวลาโครงการ' },
        { key: 'startDate', label: 'เริ่มโครงการ' },
        { key: 'endDate', label: 'จบโครงการ' },
        { key: 'extendDate', label: 'ขยายเวลาถึง' }
    ];

    timelineFields.forEach(function(field) {
        html += '<tr><td class="field-label">' + field.label + '</td>';
        selectedSheets.forEach(function(sheet) {
            var val = (sheet.info && sheet.info[field.key]) ? sheet.info[field.key] : '-';
            html += '<td>' + val + '</td>';
        });
        html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    // Section 2: Budget
    html += '<div class="comparison-info-section">' +
        '<h3 class="comparison-info-title">งบประมาณ</h3>' +
        '<div class="comparison-info-table-wrap">' +
        '<table class="comparison-info-table">' +
        '<thead><tr><th>รายการ</th>';
    sheetNames.forEach(function(name) {
        html += '<th>' + name + '</th>';
    });
    html += '</tr></thead><tbody>';

    var budgetFields = [
        { key: 'budget', label: 'งบประมาณรวม' },
        { key: 'usedBudget', label: 'งบที่ใช้ไป' },
        { key: 'remainingBudget', label: 'คงเหลือ' }
    ];

    budgetFields.forEach(function(field) {
        html += '<tr><td class="field-label">' + field.label + '</td>';
        selectedSheets.forEach(function(sheet) {
            var val = (sheet.info && sheet.info[field.key]) ? sheet.info[field.key] : 0;
            var numVal = parseFloat(String(val).replace(/,/g, ''));
            if (!isNaN(numVal) && numVal !== 0) {
                html += '<td class="number">' + formatNumber(numVal) + ' <small>บาท</small></td>';
            } else {
                html += '<td class="number">-</td>';
            }
        });
        html += '</tr>';
    });

    // Budget usage percentage
    html += '<tr class="highlight-row"><td class="field-label">สัดส่วนการใช้งบ</td>';
    selectedSheets.forEach(function(sheet) {
        var budget = parseFloat(String((sheet.info && sheet.info.budget) || 0).replace(/,/g, ''));
        var used = parseFloat(String((sheet.info && sheet.info.usedBudget) || 0).replace(/,/g, ''));
        if (budget > 0) {
            var pct = (used / budget * 100).toFixed(1);
            var color = parseFloat(pct) > 90 ? 'var(--danger)' : parseFloat(pct) > 60 ? 'var(--warning)' : 'var(--success)';
            html += '<td class="number"><span style="color:' + color + '; font-weight: 600;">' + pct + '%</span></td>';
        } else {
            html += '<td class="number">-</td>';
        }
    });
    html += '</tr>';

    html += '</tbody></table></div></div>';

    container.innerHTML = html;
}

function renderBudgetComparisonChart(selectedSheets, sheetNames) {
    var ctx = document.getElementById('budgetComparisonChart').getContext('2d');
    if (budgetComparisonChart) budgetComparisonChart.destroy();

    var budgets = selectedSheets.map(function(sheet) {
        return parseFloat(String((sheet.info && sheet.info.budget) || 0).replace(/,/g, '')) || 0;
    });
    var usedBudgets = selectedSheets.map(function(sheet) {
        return parseFloat(String((sheet.info && sheet.info.usedBudget) || 0).replace(/,/g, '')) || 0;
    });
    var remainingBudgets = selectedSheets.map(function(sheet) {
        return parseFloat(String((sheet.info && sheet.info.remainingBudget) || 0).replace(/,/g, '')) || 0;
    });

    budgetComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sheetNames,
            datasets: [
                {
                    label: 'งบประมาณรวม',
                    data: budgets,
                    backgroundColor: 'rgba(120, 235, 54, 0.7)',
                    borderColor: 'rgb(120, 235, 54, 1)',
                    borderWidth: 1
                },
                {
                    label: 'ใช้ไป',
                    data: usedBudgets,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'คงเหลือ',
                    data: remainingBudgets,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                            return value;
                        }
                    }
                }
            }
        }
    });
}

function renderSheetSelector() {
    var container = document.getElementById('sheetCheckboxes');

    container.innerHTML = DATA.sheets.map(function(sheet, idx) {
        var isSelected = selectedSheetsForComparison.indexOf(idx) >= 0;
        var isDisabled = !isSelected && selectedSheetsForComparison.length >= MAX_COMPARISON_SHEETS;

        return '<label class="sheet-checkbox ' + (isSelected ? 'selected' : '') + ' ' + (isDisabled ? 'disabled' : '') + '" data-index="' + idx + '">' +
            '<span class="check-icon"></span>' +
            '<span>' + sheet.name + '</span>' +
        '</label>';
    }).join('');

    if (DATA.sheets.length === 0) {
        container.innerHTML = '<span style="color: #999; font-style: italic;">\u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25</span>';
    }

    container.querySelectorAll('.sheet-checkbox').forEach(function(checkbox) {
        checkbox.addEventListener('click', function(e) {
            var idx = parseInt(e.currentTarget.dataset.index);
            toggleSheetSelection(idx);
        });
    });
}

function toggleSheetSelection(index) {
    var currentIdx = selectedSheetsForComparison.indexOf(index);

    if (currentIdx >= 0) {
        if (selectedSheetsForComparison.length > 1) {
            selectedSheetsForComparison.splice(currentIdx, 1);
        }
    } else {
        if (selectedSheetsForComparison.length < MAX_COMPARISON_SHEETS) {
            selectedSheetsForComparison.push(index);
            selectedSheetsForComparison.sort(function(a, b) { return a - b; });
        }
    }

    renderSheetSelector();
    renderComparisonContent();
}

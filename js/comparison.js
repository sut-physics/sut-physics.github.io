function renderComparison() {
    renderFiscalYearFilter();
    renderSheetSelector();
    renderComparisonContent();
}

function renderFiscalYearFilter() {
    var container = document.getElementById('fiscalYearFilter');

    var fiscalYearSet = {};
    DATA.sheets.forEach(function(s) {
        var y = s.info.fiscalYear;
        if (y && y !== '-') fiscalYearSet[y] = true;
    });
    var fiscalYears = Object.keys(fiscalYearSet).sort();

    if (selectedFiscalYears.length === 0 && fiscalYears.length > 0) {
        selectedFiscalYears = fiscalYears.slice();
    }

    container.innerHTML = fiscalYears.map(function(year) {
        var isSelected = selectedFiscalYears.indexOf(year) >= 0;
        return '<label class="sheet-checkbox ' + (isSelected ? 'selected' : '') + '" data-year="' + year + '">' +
            '<span class="check-icon"></span>' +
            '<span>' + year + '</span>' +
        '</label>';
    }).join('');

    if (fiscalYears.length > 1) {
        container.innerHTML += '<label class="sheet-checkbox ' + (selectedFiscalYears.length === fiscalYears.length ? 'selected' : '') + '" data-year="all" style="background: var(--secondary); color: white;">' +
            '<span>\u0e41\u0e2a\u0e14\u0e07\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14</span>' +
        '</label>';
    }

    container.querySelectorAll('.sheet-checkbox').forEach(function(checkbox) {
        checkbox.addEventListener('click', function(e) {
            var year = e.currentTarget.dataset.year;
            toggleFiscalYearFilter(year, fiscalYears);
        });
    });
}

function toggleFiscalYearFilter(year, allYears) {
    if (year === 'all') {
        if (selectedFiscalYears.length === allYears.length) {
            selectedFiscalYears = [allYears[0]];
        } else {
            selectedFiscalYears = allYears.slice();
        }
    } else {
        var idx = selectedFiscalYears.indexOf(year);
        if (idx >= 0) {
            if (selectedFiscalYears.length > 1) {
                selectedFiscalYears.splice(idx, 1);
            }
        } else {
            selectedFiscalYears.push(year);
        }
    }

    updateSheetSelectionByFiscalYear();
    renderComparison();
}

function updateSheetSelectionByFiscalYear() {
    var filteredIndices = [];
    DATA.sheets.forEach(function(sheet, idx) {
        if (selectedFiscalYears.indexOf(sheet.info.fiscalYear) >= 0) {
            filteredIndices.push(idx);
        }
    });

    selectedSheetsForComparison = selectedSheetsForComparison.filter(function(i) {
        return filteredIndices.indexOf(i) >= 0;
    });

    if (selectedSheetsForComparison.length === 0 && filteredIndices.length > 0) {
        selectedSheetsForComparison = filteredIndices.slice(0, MAX_COMPARISON_SHEETS);
    }
}

function renderComparisonContent() {
    var selectedSheets = selectedSheetsForComparison.map(function(i) { return DATA.sheets[i]; });
    var sheetNames = selectedSheets.map(function(s) { return s.name; });

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

function renderSheetSelector() {
    var container = document.getElementById('sheetCheckboxes');

    var filteredSheets = [];
    DATA.sheets.forEach(function(sheet, idx) {
        if (selectedFiscalYears.length === 0 || selectedFiscalYears.indexOf(sheet.info.fiscalYear) >= 0) {
            filteredSheets.push({ sheet: sheet, idx: idx });
        }
    });

    container.innerHTML = filteredSheets.map(function(item) {
        var isSelected = selectedSheetsForComparison.indexOf(item.idx) >= 0;
        var isDisabled = !isSelected && selectedSheetsForComparison.length >= MAX_COMPARISON_SHEETS;

        return '<label class="sheet-checkbox ' + (isSelected ? 'selected' : '') + ' ' + (isDisabled ? 'disabled' : '') + '" data-index="' + item.idx + '">' +
            '<span class="check-icon"></span>' +
            '<span>' + item.sheet.name + ' (' + (item.sheet.info.fiscalYear || '-') + ')</span>' +
        '</label>';
    }).join('');

    if (filteredSheets.length === 0) {
        container.innerHTML = '<span style="color: #999; font-style: italic;">\u0e44\u0e21\u0e48\u0e21\u0e35 Sheet \u0e43\u0e19\u0e1b\u0e35\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13\u0e17\u0e35\u0e48\u0e40\u0e25\u0e37\u0e2d\u0e01</span>';
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

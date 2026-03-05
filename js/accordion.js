function renderAccordion(categories, sheets, sheetNames) {
    var container = document.getElementById('accordionContainer');

    var html = '';
    categories.forEach(function(cat, catIdx) {
        var totalTarget = 0;
        var totalCompleted = 0;

        sheets.forEach(function(sheet) {
            var output = sheet.outputs[cat.outputIndex];
            if (output && output.items) {
                output.items.forEach(function(item) {
                    totalTarget += item.target || 0;
                    totalCompleted += item.completed || 0;
                });
            }
        });

        var overallPercent = totalTarget > 0 ? (totalCompleted / totalTarget * 100).toFixed(0) : 0;

        var referenceOutput = sheets[0] ? sheets[0].outputs[cat.outputIndex] : null;
        var items = referenceOutput ? (referenceOutput.items || []) : [];

        html += '<div class="accordion-item" data-index="' + catIdx + '">' +
            '<div class="accordion-header" onclick="toggleAccordion(' + catIdx + ')">' +
                '<div class="header-left">' +
                    '<span class="header-number">' + cat.number + '</span>' +
                    '<span class="header-title">' + cat.title + '</span>' +
                '</div>' +
                '<div class="header-right">' +
                    '<span class="header-summary">' + totalCompleted + '/' + totalTarget + ' (' + overallPercent + '%)</span>' +
                    '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<polyline points="6,9 12,15 18,9"></polyline>' +
                    '</svg>' +
                '</div>' +
            '</div>' +
            '<div class="accordion-content">' +
                '<div class="accordion-inner">' +
                    renderAccordionTable(items, sheets, sheetNames, cat.outputIndex) +
                '</div>' +
            '</div>' +
        '</div>';
    });

    container.innerHTML = html;
}

function toggleAccordion(index) {
    var item = document.querySelector('.accordion-item[data-index="' + index + '"]');
    if (item) {
        item.classList.toggle('open');
    }
}

function renderAccordionTable(items, sheets, sheetNames, outputIndex) {
    if (items.length === 0) {
        return '<p class="no-data">\u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25</p>';
    }

    var html = '<table class="accordion-table"><thead><tr>' +
        '<th style="width: 25%">\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e22\u0e48\u0e2d\u0e22</th>';
    sheetNames.forEach(function(name) {
        html += '<th style="text-align: center">' + name + '</th>';
    });
    html += '</tr></thead><tbody>';

    var sheetTotals = sheets.map(function() { return { target: 0, completed: 0 }; });

    items.forEach(function(item) {
        html += '<tr><td class="item-name">' + item.name + '</td>';

        sheets.forEach(function(sheet, sheetIdx) {
            var output = sheet.outputs[outputIndex];
            var found = null;
            if (output) {
                found = output.items.find(function(i) { return i.name === item.name; });
            }

            if (found && (found.target > 0 || found.completed > 0)) {
                var percent = found.target > 0 ? Math.min((found.completed / found.target) * 100, 100) : 0;
                var fillColor = percent >= 100 ? 'var(--success)' : percent >= 50 ? 'var(--warning)' : 'var(--danger)';

                sheetTotals[sheetIdx].target += found.target || 0;
                sheetTotals[sheetIdx].completed += found.completed || 0;

                html += '<td class="sheet-data">' +
                    '<div class="progress-mini">' +
                        '<span class="values">' + found.completed + '/' + found.target + '</span>' +
                        '<div class="bar">' +
                            '<div class="fill" style="width: ' + percent + '%; background: ' + fillColor + '"></div>' +
                        '</div>' +
                        '<span class="percent">' + percent.toFixed(0) + '%</span>' +
                    '</div>' +
                '</td>';
            } else {
                html += '<td class="sheet-data"><span class="no-data">-</span></td>';
            }
        });

        html += '</tr>';
    });

    html += '<tr class="summary-row"><td><strong>\u0e23\u0e27\u0e21</strong></td>';
    sheetTotals.forEach(function(totals) {
        var percent = totals.target > 0 ? (totals.completed / totals.target * 100).toFixed(0) : 0;
        html += '<td class="sheet-data">' +
            '<strong>' + totals.completed + '/' + totals.target + '</strong>' +
            '<br><small style="color: var(--text-muted)">(' + percent + '%)</small>' +
        '</td>';
    });
    html += '</tr></tbody></table>';

    return html;
}

async function handleFileUpload(event) {
    var files = event.target.files;
    if (!files.length) return;

    var statusEl = document.getElementById('uploadStatus');
    statusEl.className = 'upload-status';
    statusEl.textContent = '\u0e01\u0e33\u0e25\u0e31\u0e07\u0e1b\u0e23\u0e30\u0e21\u0e27\u0e25\u0e1c\u0e25...';
    statusEl.style.display = 'block';

    var successCount = 0;
    var errorMessages = [];

    for (var f = 0; f < files.length; f++) {
        var file = files[f];
        try {
            var sheetsData = await parseExcelFile(file);
            sheetsData.forEach(function(sheetData) {
                var existingIdx = DATA.sheets.findIndex(function(s) { return s.name === sheetData.name; });
                if (existingIdx >= 0) {
                    DATA.sheets[existingIdx] = sheetData;
                } else {
                    DATA.sheets.push(sheetData);
                }
            });
            successCount += sheetsData.length;
        } catch (err) {
            errorMessages.push(file.name + ': ' + err.message);
        }
    }

    if (successCount > 0) {
        saveAllToFirebase();
        selectedSheetsForComparison = DATA.sheets.slice(0, MAX_COMPARISON_SHEETS).map(function(_, i) { return i; });
    }

    if (errorMessages.length === 0) {
        statusEl.className = 'upload-status success';
        statusEl.textContent = '\u0e40\u0e1e\u0e34\u0e48\u0e21 ' + successCount + ' Sheet \u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 (synced)';
    } else {
        statusEl.className = 'upload-status error';
        statusEl.textContent = errorMessages.join('; ');
    }

    event.target.value = '';

    setTimeout(function() {
        statusEl.style.display = 'none';
    }, 3000);
}

async function parseExcelFile(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, { type: 'array' });

                var parsedSheets = [];

                workbook.SheetNames.forEach(function(sheetName) {
                    if (sheetName.toLowerCase() === 'readme' || sheetName.toLowerCase() === 'template') {
                        return;
                    }

                    var worksheet = workbook.Sheets[sheetName];
                    var sheetData = parseWorksheet(worksheet, sheetName);
                    if (sheetData) {
                        parsedSheets.push(sheetData);
                    }
                });

                if (parsedSheets.length === 0) {
                    reject(new Error('\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e17\u0e35\u0e48\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07'));
                } else {
                    resolve(parsedSheets);
                }
            } catch (err) {
                reject(new Error('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2d\u0e48\u0e32\u0e19\u0e44\u0e1f\u0e25\u0e4c\u0e44\u0e14\u0e49: ' + err.message));
            }
        };
        reader.onerror = function() { reject(new Error('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2d\u0e48\u0e32\u0e19\u0e44\u0e1f\u0e25\u0e4c\u0e44\u0e14\u0e49')); };
        reader.readAsArrayBuffer(file);
    });
}

function parseWorksheet(worksheet, sheetName) {
    var getCell = function(ref) {
        var cell = worksheet[ref];
        return cell ? (cell.v !== undefined ? cell.v : '') : '';
    };

    var formatDate = function(value) {
        if (!value) return '';
        if (value instanceof Date) {
            return value.toLocaleDateString('th-TH');
        }
        if (typeof value === 'number') {
            var date = new Date((value - 25569) * 86400 * 1000);
            return date.toLocaleDateString('th-TH');
        }
        return String(value);
    };

    var info = {
        projectName: getCell('B2') || sheetName,
        projectNameEng: getCell('B3') || '',
        leader: getCell('B4') || '',
        duration: String(getCell('B6') || ''),
        fiscalYear: String(getCell('B7') || ''),
        budget: String(getCell('B8') || ''),
        projectCode: String(getCell('B9') || sheetName),
        startDate: formatDate(getCell('E6')),
        endDate: formatDate(getCell('G6')),
        extendDate: formatDate(getCell('I6') || '')
    };

    var outputCategories = [
        {
            name: '\u0e01\u0e33\u0e25\u0e31\u0e07\u0e04\u0e19\u0e2b\u0e23\u0e37\u0e2d\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19',
            items: [
                { name: '\u0e23\u0e30\u0e14\u0e31\u0e1a\u0e1b\u0e23\u0e34\u0e0d\u0e0d\u0e32\u0e15\u0e23\u0e35 (\u0e23\u0e48\u0e27\u0e21\u0e27\u0e34\u0e08\u0e31\u0e22)', row: 15 },
                { name: '\u0e23\u0e30\u0e14\u0e31\u0e1a\u0e1b\u0e23\u0e34\u0e0d\u0e0d\u0e32\u0e42\u0e17 (\u0e23\u0e48\u0e27\u0e21\u0e27\u0e34\u0e08\u0e31\u0e22)', row: 16 },
                { name: '\u0e23\u0e30\u0e14\u0e31\u0e1a\u0e1b\u0e23\u0e34\u0e0d\u0e0d\u0e32\u0e40\u0e2d\u0e01 (\u0e23\u0e48\u0e27\u0e21\u0e27\u0e34\u0e08\u0e31\u0e22)', row: 17 },
                { name: '\u0e19\u0e31\u0e01\u0e27\u0e34\u0e08\u0e31\u0e22\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19\u0e23\u0e31\u0e10 (\u0e23\u0e48\u0e27\u0e21\u0e27\u0e34\u0e08\u0e31\u0e22)', row: 18 },
                { name: '\u0e40\u0e14\u0e47\u0e01\u0e41\u0e25\u0e30\u0e40\u0e22\u0e32\u0e27\u0e0a\u0e19 (\u0e23\u0e48\u0e27\u0e21\u0e2d\u0e1a\u0e23\u0e21)', row: 19 },
                { name: '\u0e19\u0e34\u0e2a\u0e34\u0e15/\u0e19\u0e31\u0e01\u0e28\u0e36\u0e01\u0e29\u0e32 \u0e1b.\u0e15\u0e23\u0e35 (\u0e23\u0e48\u0e27\u0e21\u0e2d\u0e1a\u0e23\u0e21)', row: 20 },
                { name: '\u0e1a\u0e38\u0e04\u0e25\u0e32\u0e01\u0e23\u0e20\u0e32\u0e04\u0e23\u0e31\u0e10 (\u0e23\u0e48\u0e27\u0e21\u0e2d\u0e1a\u0e23\u0e21)', row: 21 }
            ]
        },
        {
            name: '\u0e15\u0e49\u0e19\u0e09\u0e1a\u0e31\u0e1a\u0e1a\u0e17\u0e04\u0e27\u0e32\u0e21\u0e27\u0e34\u0e08\u0e31\u0e22',
            items: [
                { name: 'TIER1', row: 23 },
                { name: 'Q1', row: 24 },
                { name: 'Q2', row: 25 },
                { name: 'Q3', row: 26 },
                { name: '\u0e23\u0e30\u0e14\u0e31\u0e1a\u0e0a\u0e32\u0e15\u0e34', row: 27 },
                { name: 'Proceeding', row: 28 }
            ]
        },
        {
            name: '\u0e2b\u0e19\u0e31\u0e07\u0e2a\u0e37\u0e2d',
            items: [{ name: '\u0e2b\u0e19\u0e31\u0e07\u0e2a\u0e37\u0e2d', row: 30 }]
        },
        {
            name: '\u0e15\u0e49\u0e19\u0e41\u0e1a\u0e1a\u0e1c\u0e25\u0e34\u0e15\u0e20\u0e31\u0e13\u0e11\u0e4c/\u0e40\u0e17\u0e04\u0e42\u0e19\u0e42\u0e25\u0e22\u0e35',
            items: [
                { name: '\u0e15\u0e49\u0e19\u0e41\u0e1a\u0e1a\u0e1c\u0e25\u0e34\u0e15\u0e20\u0e31\u0e13\u0e11\u0e4c', row: 32 },
                { name: '\u0e40\u0e17\u0e04\u0e42\u0e19\u0e42\u0e25\u0e22\u0e35/\u0e01\u0e23\u0e30\u0e1a\u0e27\u0e19\u0e01\u0e32\u0e23\u0e43\u0e2b\u0e21\u0e48', row: 33 },
                { name: '\u0e19\u0e27\u0e31\u0e15\u0e01\u0e23\u0e23\u0e21\u0e17\u0e32\u0e07\u0e2a\u0e31\u0e07\u0e04\u0e21', row: 34 }
            ]
        },
        {
            name: '\u0e17\u0e23\u0e31\u0e1e\u0e22\u0e4c\u0e2a\u0e34\u0e19\u0e17\u0e32\u0e07\u0e1b\u0e31\u0e0d\u0e0d\u0e32',
            items: [{ name: '\u0e2d\u0e19\u0e38\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e1a\u0e31\u0e15\u0e23', row: 36 }]
        },
        {
            name: '\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e21\u0e37\u0e2d\u0e41\u0e25\u0e30\u0e42\u0e04\u0e23\u0e07\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1e\u0e37\u0e49\u0e19\u0e10\u0e32\u0e19',
            items: [{ name: '\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e21\u0e37\u0e2d \u0e27\u0e27\u0e19.', row: 38 }]
        },
        {
            name: '\u0e10\u0e32\u0e19\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25/\u0e23\u0e30\u0e1a\u0e1a\u0e41\u0e25\u0e30\u0e01\u0e25\u0e44\u0e01',
            items: [{ name: '\u0e10\u0e32\u0e19\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25', row: 40 }]
        },
        {
            name: '\u0e40\u0e04\u0e23\u0e37\u0e2d\u0e02\u0e48\u0e32\u0e22',
            items: [
                { name: '\u0e23\u0e30\u0e14\u0e31\u0e1a\u0e1b\u0e23\u0e30\u0e40\u0e17\u0e28', row: 42 },
                { name: '\u0e23\u0e30\u0e14\u0e31\u0e1a\u0e19\u0e32\u0e19\u0e32\u0e0a\u0e32\u0e15\u0e34', row: 43 }
            ]
        },
        {
            name: '\u0e01\u0e32\u0e23\u0e25\u0e07\u0e17\u0e38\u0e19\u0e27\u0e34\u0e08\u0e31\u0e22\u0e41\u0e25\u0e30\u0e19\u0e27\u0e31\u0e15\u0e01\u0e23\u0e23\u0e21',
            items: [
                { name: '\u0e01\u0e2d\u0e07\u0e17\u0e38\u0e19\u0e43\u0e19\u0e1b\u0e23\u0e30\u0e40\u0e17\u0e28', row: 45 },
                { name: '\u0e01\u0e2d\u0e07\u0e17\u0e38\u0e19\u0e15\u0e48\u0e32\u0e07\u0e1b\u0e23\u0e30\u0e40\u0e17\u0e28', row: 46 }
            ]
        }
    ];

    var outputs = outputCategories.map(function(cat) {
        return {
            name: cat.name,
            items: cat.items.map(function(item) {
                var target = parseInt(getCell('B' + item.row)) || 0;
                var completed = parseInt(getCell('D' + item.row)) || 0;

                var names = [];
                var nameCols = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];
                nameCols.forEach(function(col) {
                    var name = getCell(col + item.row);
                    if (name && String(name).trim()) {
                        names.push(String(name).trim());
                    }
                });

                return {
                    name: item.name,
                    target: target,
                    completed: completed,
                    names: names
                };
            })
        };
    });

    return {
        name: sheetName,
        info: info,
        outputs: outputs
    };
}

function deleteSheet(index) {
    if (DATA.sheets.length <= 1) {
        alert('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e25\u0e1a\u0e44\u0e14\u0e49 \u0e15\u0e49\u0e2d\u0e07\u0e21\u0e35\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e19\u0e49\u0e2d\u0e22 1 Sheet');
        return;
    }

    var sheetName = DATA.sheets[index].name;
    if (!confirm('\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e25\u0e1a Sheet "' + sheetName + '" \u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48?')) {
        return;
    }

    DATA.sheets.splice(index, 1);

    if (currentSheet >= DATA.sheets.length) {
        currentSheet = DATA.sheets.length - 1;
    }

    selectedSheetsForComparison = selectedSheetsForComparison
        .filter(function(i) { return i !== index; })
        .map(function(i) { return i > index ? i - 1 : i; });

    if (selectedSheetsForComparison.length === 0 && DATA.sheets.length > 0) {
        selectedSheetsForComparison = [0];
    }

    saveAllToFirebase();
    showStatus('success', '\u0e25\u0e1a Sheet "' + sheetName + '" \u0e41\u0e25\u0e49\u0e27');
}

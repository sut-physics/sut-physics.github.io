function parseNum(val) {
    if (val === null || val === undefined || val === '') return 0;
    var n = Number(String(val).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

function formatNumber(num) {
    var n = parseNum(num);
    if (n === 0 && num !== 0 && num !== '0') return '-';
    return n.toLocaleString('th-TH');
}

function showStatus(type, message) {
    var statusEl = document.getElementById('uploadStatus');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'uploadStatus';
        document.body.appendChild(statusEl);
    }
    statusEl.className = 'upload-status ' + type;
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    setTimeout(function() { statusEl.style.display = 'none'; }, 3000);
}

function parseNum(val) {
    if (!val && val !== 0) return 0;
    return Number(String(val).replace(/,/g, '')) || 0;
}

function formatNumber(num) {
    if (!num && num !== 0) return '-';
    var n = parseNum(num);
    if (isNaN(n)) return '-';
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

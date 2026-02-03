function formatNumber(num) {
    if (!num) return '-';
    return Number(num).toLocaleString('th-TH');
}

function showStatus(type, message) {
    var statusEl = document.getElementById('uploadStatus');
    statusEl.className = 'upload-status ' + type;
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    setTimeout(function() { statusEl.style.display = 'none'; }, 3000);
}

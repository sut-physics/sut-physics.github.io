function checkLogin() {
    if (sessionStorage.getItem('dashboard_authenticated') === 'true') {
        showApp();
    }
}

function attemptLogin() {
    var password = document.getElementById('passwordInput').value;
    var errorEl = document.getElementById('loginError');

    if (password === APP_PASSWORD) {
        sessionStorage.setItem('dashboard_authenticated', 'true');
        showApp();
    } else {
        errorEl.style.display = 'block';
        document.getElementById('passwordInput').value = '';
    }
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContent').classList.add('visible');
    initializeFirebase();
}

function logout() {
    sessionStorage.removeItem('dashboard_authenticated');
    location.reload();
}

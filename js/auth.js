function checkLogin() {
    // PocketBase SDK เก็บ token ใน localStorage อัตโนมัติ
    if (pb.authStore.isValid) {
        var user = pb.authStore.record;
        currentUser = {
            username: user.username,
            role: user.role || 'leader',
            displayName: user.displayName || user.username
        };
        showApp();
    }
}

function attemptLogin() {
    var username = document.getElementById('usernameInput').value.trim();
    var password = document.getElementById('passwordInput').value;
    var errorEl = document.getElementById('loginError');

    if (!username || !password) {
        errorEl.style.display = 'block';
        return;
    }

    // แปลง username เป็น email format สำหรับ PocketBase auth
    var identity = username.indexOf('@') >= 0 ? username : username + '@coe.local';
    pb.collection('users').authWithPassword(identity, password).then(function(authData) {
        var user = authData.record;
        currentUser = {
            username: user.username,
            role: user.role || 'leader',
            displayName: user.displayName || user.username
        };
        errorEl.style.display = 'none';
        showApp();
    }).catch(function(err) {
        console.error('Login error:', err);
        errorEl.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        errorEl.style.display = 'block';
        document.getElementById('passwordInput').value = '';
    });
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContent').classList.add('visible');

    // Display user info in header
    var userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        var roleLabel = currentUser.role === 'admin' ? 'Admin' : 'หัวหน้าโครง';
        userDisplay.textContent = currentUser.displayName + ' (' + roleLabel + ')';
    }

    applyRolePermissions();
    initializePocketBase();
}

function applyRolePermissions() {
    var isAdmin = currentUser.role === 'admin';

    // Sidebar actions (add/delete project) - admin only
    var sidebarActions = document.querySelector('.sidebar-actions');
    if (sidebarActions) {
        sidebarActions.style.display = isAdmin ? '' : 'none';
    }

    // User management button - admin only
    var userMgmtBtn = document.getElementById('userManagementBtn');
    if (userMgmtBtn) {
        userMgmtBtn.style.display = isAdmin ? '' : 'none';
    }

    // File upload (import) - admin only
    var fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.closest('.upload-section') && (fileInput.style.display = isAdmin ? '' : 'none');
    }
}

function logout() {
    pb.authStore.clear();
    currentUser = { username: '', role: '', displayName: '' };
    location.reload();
}

function checkLogin() {
    var savedUser = sessionStorage.getItem('dashboard_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
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

    // Initialize Firebase first if not done
    if (!_firebaseInitialized) {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        _firebaseInitialized = true;
    }

    // Load users from Firebase and validate
    loadUsersFromFirebase().then(function(users) {
        if (!users || users.length === 0) {
            // Seed default users first
            database.ref('users').set(DEFAULT_USERS).then(function() {
                users = DEFAULT_USERS;
                validateLogin(users, username, password, errorEl);
            });
        } else {
            validateLogin(users, username, password, errorEl);
        }
    }).catch(function(err) {
        console.error('Login error:', err);
        errorEl.textContent = 'ไม่สามารถเชื่อมต่อระบบได้';
        errorEl.style.display = 'block';
    });
}

function validateLogin(users, username, password, errorEl) {
    var found = null;
    for (var i = 0; i < users.length; i++) {
        if (users[i].username === username && users[i].password === password) {
            found = users[i];
            break;
        }
    }

    if (found) {
        currentUser = {
            username: found.username,
            role: found.role,
            displayName: found.displayName
        };
        sessionStorage.setItem('dashboard_user', JSON.stringify(currentUser));
        errorEl.style.display = 'none';
        showApp();
    } else {
        errorEl.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        errorEl.style.display = 'block';
        document.getElementById('passwordInput').value = '';
    }
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
    initializeFirebase();
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
    sessionStorage.removeItem('dashboard_user');
    currentUser = { username: '', role: '', displayName: '' };
    location.reload();
}

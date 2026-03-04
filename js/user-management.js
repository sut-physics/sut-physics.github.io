function showUserManagementModal() {
    if (currentUser.role !== 'admin') return;

    var modal = document.getElementById('userManagementModal');
    modal.style.display = 'flex';
    hideAddUserStatus();
    renderUserList();
}

function hideUserManagementModal() {
    document.getElementById('userManagementModal').style.display = 'none';
}

function showAddUserStatus(type, msg) {
    var el = document.getElementById('addUserStatus');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
    if (type === 'success') {
        el.style.background = '#d4edda';
        el.style.color = '#155724';
        el.style.border = '1px solid #c3e6cb';
    } else {
        el.style.background = '#f8d7da';
        el.style.color = '#721c24';
        el.style.border = '1px solid #f5c6cb';
    }
    if (type === 'success') {
        setTimeout(function() { el.style.display = 'none'; }, 3000);
    }
}

function hideAddUserStatus() {
    var el = document.getElementById('addUserStatus');
    if (el) el.style.display = 'none';
}

function renderUserList() {
    loadUsersFromFirebase().then(function(users) {
        var container = document.getElementById('userManagementList');
        if (!users || users.length === 0) {
            container.innerHTML = '<p style="color: #999;">ไม่มีผู้ใช้ในระบบ</p>';
            return;
        }

        var html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">' +
            '<thead><tr>' +
                '<th style="text-align: left; padding: 8px; border-bottom: 2px solid #eee;">ชื่อผู้ใช้</th>' +
                '<th style="text-align: left; padding: 8px; border-bottom: 2px solid #eee;">ชื่อแสดง</th>' +
                '<th style="text-align: left; padding: 8px; border-bottom: 2px solid #eee;">สิทธิ์</th>' +
                '<th style="text-align: center; padding: 8px; border-bottom: 2px solid #eee;">จัดการ</th>' +
            '</tr></thead><tbody>';

        users.forEach(function(user, idx) {
            var roleLabel = user.role === 'admin' ? 'Admin' : 'หัวหน้าโครง';
            html += '<tr>' +
                '<td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">' + user.username + '</td>' +
                '<td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">' + user.displayName + '</td>' +
                '<td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">' + roleLabel + '</td>' +
                '<td style="padding: 8px; border-bottom: 1px solid #f0f0f0; text-align: center;">' +
                    (user.username !== 'admin' ?
                        '<button onclick="deleteUser(' + idx + ')" style="background: #e74c3c; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">ลบ</button>' :
                        '<span style="color: #999; font-size: 0.8rem;">-</span>') +
                '</td>' +
            '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    });
}

function addNewUser() {
    var username = document.getElementById('newUserUsername').value.trim();
    var password = document.getElementById('newUserPassword').value;
    var displayName = document.getElementById('newUserDisplayName').value.trim();
    var role = document.getElementById('newUserRole').value;

    if (!username || !password || !displayName) {
        showAddUserStatus('error', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
        return;
    }

    loadUsersFromFirebase().then(function(users) {
        // Check duplicate username
        for (var i = 0; i < users.length; i++) {
            if (users[i].username === username) {
                showAddUserStatus('error', 'ชื่อผู้ใช้ "' + username + '" มีอยู่แล้ว');
                return;
            }
        }

        users.push({
            username: username,
            password: password,
            role: role,
            displayName: displayName
        });

        saveUsersToFirebase(users).then(function() {
            // Clear form
            document.getElementById('newUserUsername').value = '';
            document.getElementById('newUserPassword').value = '';
            document.getElementById('newUserDisplayName').value = '';
            document.getElementById('newUserRole').value = 'leader';
            renderUserList();
            showAddUserStatus('success', 'เพิ่มผู้ใช้ "' + displayName + '" เรียบร้อยแล้ว');
        }).catch(function(err) {
            console.error('Save user error:', err);
            showAddUserStatus('error', 'ไม่สามารถบันทึกได้: ' + err.message);
        });
    }).catch(function(err) {
        console.error('Load users error:', err);
        showAddUserStatus('error', 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้: ' + err.message);
    });
}

function deleteUser(idx) {
    if (!confirm('ต้องการลบผู้ใช้นี้?')) return;

    loadUsersFromFirebase().then(function(users) {
        if (users[idx] && users[idx].username !== 'admin') {
            users.splice(idx, 1);
            saveUsersToFirebase(users).then(function() {
                renderUserList();
                showAddUserStatus('success', 'ลบผู้ใช้เรียบร้อยแล้ว');
            });
        }
    });
}

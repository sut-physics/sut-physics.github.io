var _firebaseInitialized = false;

function initializeFirebase() {
    if (!_firebaseInitialized) {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        _firebaseInitialized = true;
    }

    var sheetsRef = database.ref('sheets');

    sheetsRef.on('value', function(snapshot) {
        var data = snapshot.val();

        if (data) {
            // ตรวจสอบว่าใน DATA (ที่อาจโหลดจาก JSON มาแล้ว) มีงบประมาณ แต่ Firebase ยังไม่มีหรือไม่
            var localHasNewData = DATA.sheets[0] && DATA.sheets[0].info && DATA.sheets[0].info.usedBudget;
            var firebaseHasNewData = data[0] && data[0].info && data[0].info.usedBudget;

            if (localHasNewData && !firebaseHasNewData) {
                console.log("กำลังอัปเดตข้อมูลใหม่จาก JSON ขึ้น Firebase...");
                saveAllToFirebase(); 
                return; 
            }
            
            DATA.sheets = Array.isArray(data) ? data : Object.values(data);
            // ensure extendDates array exists for all sheets
            DATA.sheets.forEach(function(s) {
                if (s.info && !s.info.extendDates) {
                    s.info.extendDates = s.info.extendDate ? [s.info.extendDate, '', ''] : ['', '', ''];
                }
            });
        } else {
            DATA.sheets = DEFAULT_DATA.sheets;
            saveAllToFirebase();
        }

        renderSheetList();
        if (currentPage === 'dashboard') {
            renderDashboard();
        } else if (currentPage === 'budget') {
            renderBudgetPage();
        } else if (currentPage === 'workplan') {
            renderWorkplanPage();
        } else {
            renderComparison();
        }

        console.log('Data synced from Firebase:', DATA.sheets.length, 'sheets');
    }, function(error) {
        console.error('Firebase sync error:', error);
        showStatus('error', '\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e40\u0e0a\u0e37\u0e48\u0e2d\u0e21\u0e15\u0e48\u0e2d Firebase \u0e44\u0e14\u0e49');
    });
}

function initializeUsers() {
    var usersRef = database.ref('users');
    return usersRef.once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (!data) {
            usersRef.set(DEFAULT_USERS);
        }
    });
}

function loadUsersFromFirebase() {
    return database.ref('users').once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (!data) return [];
        // Firebase อาจคืน object แทน array → แปลงให้เป็น array เสมอ
        if (Array.isArray(data)) return data;
        return Object.values(data);
    });
}

function saveUsersToFirebase(users) {
    return database.ref('users').set(users);
}

function saveAllToFirebase() {
    database.ref('sheets').set(DATA.sheets)
        .then(function() { console.log('Data saved to Firebase'); })
        .catch(function(err) { console.error('Save error:', err); });
}


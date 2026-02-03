function setupEventListeners() {
    document.querySelectorAll('.nav-tab').forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            var page = e.target.dataset.page;
            switchPage(page);
        });
    });

    document.querySelectorAll('.page-tab').forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            var outputType = e.target.dataset.output;
            currentOutputType = outputType;
            document.querySelectorAll('.page-tab').forEach(function(t) { t.classList.remove('active'); });
            e.target.classList.add('active');
            renderComparison();
        });
    });

    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
}

function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelector('.nav-tab[data-page="' + page + '"]').classList.add('active');

    if (page === 'dashboard') {
        document.getElementById('dashboardPage').classList.remove('hidden');
        document.getElementById('comparisonPage').classList.add('hidden');
    } else {
        document.getElementById('dashboardPage').classList.add('hidden');
        document.getElementById('comparisonPage').classList.remove('hidden');
        renderComparison();
    }
}

// เพิ่มฟังก์ชันโหลดข้อมูลใน app.js
function initApp() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            console.log("ได้ข้อมูลใหม่จาก JSON:", data);
            DATA = data; 
            renderSheetList();
            renderDashboard();

            // เพิ่มบรรทัดนี้: ถ้าโหลด JSON สำเร็จ ให้ส่งค่างบประมาณไปเก็บที่ Firebase ด้วย
            if (typeof saveDataToFirebase === 'function') {
                saveDataToFirebase(DATA);
                console.log("อัปเดตงบประมาณขึ้น Firebase สำเร็จ!");
            }
        })
        .catch(err => {
            console.warn("ใช้ข้อมูลจาก Firebase/Default แทน");
            renderSheetList();
            renderDashboard();
        });
}

// รวม EventListener ไว้ที่เดียว
document.addEventListener('DOMContentLoaded', function() {
    checkLogin();          // 1. ตรวจสอบสิทธิ์เข้าใช้งาน
    setupEventListeners(); // 2. เตรียมปุ่มกดต่างๆ ให้พร้อม
    initApp();             // 3. ดึงข้อมูลจริงมาแสดงผล
});

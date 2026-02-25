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

    var fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.addEventListener('change', handleFileUpload);
}

function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelector('.nav-tab[data-page="' + page + '"]').classList.add('active');

    // Hide all pages
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('budgetPage').classList.add('hidden');
    document.getElementById('comparisonPage').classList.add('hidden');

    // Show selected page
    if (page === 'dashboard') {
        document.getElementById('dashboardPage').classList.remove('hidden');
    } else if (page === 'budget') {
        document.getElementById('budgetPage').classList.remove('hidden');
        renderBudgetPage();
    } else if (page === 'comparison') {
        document.getElementById('comparisonPage').classList.remove('hidden');
        renderComparison();
    }
}

// รวม EventListener ไว้ที่เดียว
document.addEventListener('DOMContentLoaded', function() {
    checkLogin();          // 1. ตรวจสอบสิทธิ์เข้าใช้งาน
    setupEventListeners(); // 2. เตรียมปุ่มกดต่างๆ ให้พร้อม
});

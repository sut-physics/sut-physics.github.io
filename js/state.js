// Live data object (will be synced with Firebase)
// var DATA = { sheets: [] };
// ใน js/state.js
var DATA = { 
    sheets: [
        {
            name: "Format",
            info: {
                projectName: "ชื่อโครงการ",
                usedBudget: "765467",      // ใส่เลขทดสอบตรงนี้
                remainingBudget: "9234532"  // ใส่เลขทดสอบตรงนี้
            },
            outputs: []
        }
    ] 
};
// UI state
var currentSheet = 0;
var currentPage = 'dashboard';
var editMode = { info: false, output: false };
var currentOutputType = 'hr';
var comparisonChart = null;
var selectedSheetsForComparison = [];
var selectedFiscalYears = [];

// Firebase database reference (set after Firebase init)
var database = null;

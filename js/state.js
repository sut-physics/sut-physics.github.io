// PocketBase instance
var pb = new PocketBase(PB_URL);

// Live data object (will be synced with PocketBase)
var DATA = { sheets: [] };

// Mapping: sheetIdx → PocketBase record ID
var pbRecordIds = [];

// UI state
var currentSheet = 0;
var currentPage = 'dashboard';
var editMode = { info: false, output: false };
var currentOutputType = 'hr';
var comparisonChart = null;
var selectedSheetsForComparison = [];
var selectedFiscalYears = [];
var sidebarFilters = { fiscalYears: [], leaders: [] };

// Current logged-in user
var currentUser = { username: '', role: '', displayName: '' };

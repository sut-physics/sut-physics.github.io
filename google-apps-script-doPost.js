// ============================================================
// เพิ่มโค้ดนี้ใน Google Apps Script ที่มีอยู่แล้ว
// เพื่อให้ Dashboard สามารถเขียนข้อมูลกลับมาที่ Google Sheets ได้
// ============================================================

// รับ POST request จาก Dashboard แล้วเขียนลง Google Sheets
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(data.sheetName);

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, error: 'Sheet "' + data.sheetName + '" not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // รองรับทั้งแบบ single cell และ multiple cells
    var updates = data.updates || [{ cell: data.cell, value: data.value }];

    updates.forEach(function(u) {
      var range = sheet.getRange(u.cell);
      // ถ้าเป็นตัวเลข ให้แปลงเป็น Number
      var val = u.value;
      if (val !== '' && !isNaN(val)) {
        val = Number(val);
      }
      range.setValue(val);
    });

    // Sync กลับไป Firebase ด้วย (optional - ถ้าต้องการให้ข้อมูลตรงกัน)
    // syncSheetsToFirebase();

    return ContentService.createTextOutput(JSON.stringify({
      success: true, updated: updates.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// รองรับ CORS preflight request
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok', message: 'Dashboard API is ready'
  })).setMimeType(ContentService.MimeType.JSON);
}

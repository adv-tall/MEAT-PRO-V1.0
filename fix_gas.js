const fs = require('fs');

const gasCode = `/**
 * WMS Master - Google Sheets Backend
 * Handles GET and POST requests from the Frontend
 */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    // Check if postData exists
    if (!e || !e.postData || !e.postData.contents) {
      return createResponse("error", "No data provided");
    }

    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const sheetName = params.sheet;
    const data = params.data;
    
    // Check API Key
    const EXPECTED_API_KEY = "your_secret_key_here"; 
    // if (params.apiKey !== EXPECTED_API_KEY) return createResponse("error", "Unauthorized");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Auto-Provisioning: Create sheet if it doesn't exist
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet && sheetName) {
      sheet = ss.insertSheet(sheetName);
    }
    
    if (!sheet) {
      return createResponse("error", "Sheet not found and could not be created: " + sheetName);
    }

    switch (action) {
      case 'read':
        return readData(sheet, params);
      case 'write': // Upsert (insert or update)
        return writeData(sheet, data);
      case 'sync': // Overwrite all data
        return syncFullData(sheet, data);
      case 'delete':
        return deleteData(sheet, data);
      default:
        return createResponse("error", "Unknown action: " + action);
    }
  } catch (err) {
    return createResponse("error", err.toString());
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return createResponse("success", "WMS Master API is active. Please use POST for data operations.");
}

// --- Action Handlers ---

function readData(sheet, params) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow === 0 || lastCol === 0) {
     return createResponse("success", "Data retrieved", { items: [], totalCount: 0 });
  }

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0];
  let data = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
        if (h) obj[h] = row[i];
    });
    return obj;
  });

  return createResponse("success", "Data retrieved", { items: data, totalCount: data.length });
}

function syncFullData(sheet, data) {
  if (!data || !Array.isArray(data)) return createResponse("error", "Data must be an array for sync");
  
  sheet.clear();
  
  if (data.length === 0) {
    return createResponse("success", "Sheet cleared");
  }

  let headerSet = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => headerSet.add(key));
  });
  
  const headers = Array.from(headerSet);
  if (headers.includes('id')) {
    headers.splice(headers.indexOf('id'), 1);
    headers.unshift('id');
  }

  const rows = data.map(item => headers.map(h => {
     let val = item[h];
     if (typeof val === 'object') return JSON.stringify(val);
     return val === undefined ? '' : val;
  }));

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  cleanUpEmptyRows(sheet);
  
  return createResponse("success", "Data synced successfully");
}

function writeData(sheet, data) {
  if (!Array.isArray(data)) data = [data];
  if (data.length === 0) return createResponse("success", "No data to write");

  let lastRow = sheet.getLastRow();
  let lastCol = sheet.getLastColumn();
  let headers = [];
  
  if (lastRow > 0 && lastCol > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }

  let headersChanged = false;
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (!headers.includes(key) && key !== '') {
        headers.push(key);
        headersChanged = true;
      }
    });
  });

  if (headersChanged) {
    if (headers.includes('id') && headers.indexOf('id') !== 0) {
       headers.splice(headers.indexOf('id'), 1);
       headers.unshift('id');
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    lastCol = headers.length;
  }

  let existingData = [];
  let idColIndex = headers.indexOf('id');
  if (lastRow > 1 && idColIndex !== -1) {
    existingData = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues().map(r => r[0]);
  }

  let rowsToAppend = [];
  
  data.forEach(item => {
    if (item.id && idColIndex !== -1) {
      let rowIndex = existingData.indexOf(item.id);
      if (rowIndex !== -1) {
        let rowNum = rowIndex + 2; 
        let rowTemplate = sheet.getRange(rowNum, 1, 1, lastCol).getValues()[0];
        const updateRow = headers.map((h, i) => {
           let val = item[h] !== undefined ? item[h] : rowTemplate[i];
           if (typeof val === 'object') return JSON.stringify(val);
           return val;
        });
        sheet.getRange(rowNum, 1, 1, lastCol).setValues([updateRow]);
        return; 
      }
    }
    
    const newRow = headers.map(h => {
       let val = item[h];
       if (typeof val === 'object') return JSON.stringify(val);
       return val === undefined ? '' : val;
    });
    if (idColIndex !== -1 && !newRow[idColIndex]) {
        newRow[idColIndex] = 'gas-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
    }
    rowsToAppend.push(newRow);
  });
  
  if (rowsToAppend.length > 0) {
    sheet.getRange(lastRow + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }
  
  cleanUpEmptyRows(sheet);
  
  return createResponse("success", "Data written successfully");
}

function deleteData(sheet, data) {
  if (!Array.isArray(data)) data = [data];
  if (data.length === 0) return createResponse("success", "No items to delete");

  let lastRow = sheet.getLastRow();
  let lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return createResponse("success", "Sheet empty");

  let headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let idColIndex = headers.indexOf('id');
  if (idColIndex === -1) return createResponse("error", "No 'id' column found");

  let idValues = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues().map(r => r[0]);
  
  let rowsToDelete = [];
  data.forEach(id => {
    if (typeof id === "object" && id.id) id = id.id; 
    let rowIndex = idValues.indexOf(id);
    if (rowIndex !== -1) {
      // mark for deletion
      rowsToDelete.push(rowIndex + 2);
    }
  });
  
  rowsToDelete.sort((a, b) => b - a);
  rowsToDelete.forEach(rowNum => {
    sheet.deleteRow(rowNum);
  });

  return createResponse("success", "Data deleted successfully");
}

function cleanUpEmptyRows(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const maxRows = sheet.getMaxRows();
  if (maxRows > lastRow + 10) {
    sheet.deleteRows(lastRow + 1, maxRows - lastRow - 10);
  }
}

function createResponse(status, message, data = null) {
  const result = { status: status, message: message, data: data };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
\`;

let content = fs.readFileSync('GOOGLE_APPS_SCRIPT.md', 'utf8');
const newContent = content.replace(/\`\`\`javascript[\\s\\S]*?\`\`\`/, '\`\`\`javascript\\n' + gasCode + '\\n\`\`\`');
fs.writeFileSync('GOOGLE_APPS_SCRIPT.md', newContent);
console.log("Updated GOOGLE_APPS_SCRIPT.md");

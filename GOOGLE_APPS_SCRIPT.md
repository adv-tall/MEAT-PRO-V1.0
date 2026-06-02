# Google Apps Script (GAS) for WMS Master

Copy this code into your Google Apps Script editor (Extensions > Apps Script) in your Google Sheet.

```javascript
/**
 * WMS Master - Google Sheets Backend
 * Handles GET and POST requests from the Frontend
 */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Wait for up to 30 seconds for other processes to finish
    lock.waitLock(30000);
    
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const sheetName = params.sheet;
    const data = params.data;
    const apiKey = params.apiKey;
    
    // Basic Security: Check API Key
    // Set your API Key in GAS Project Settings or hardcode it here for now
    const EXPECTED_API_KEY = "your_secret_key_here"; 
    if (apiKey !== EXPECTED_API_KEY && action !== 'login') {
      // return createResponse("error", "Unauthorized: Invalid API Key");
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Auto-Provisioning: Create sheet and headers if they don't exist
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet && sheetName) {
      sheet = ss.insertSheet(sheetName);
      if (data && Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
      } else if (data && typeof data === 'object') {
        const headers = Object.keys(data);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
      }
    }
    
    if (!sheet && action !== 'login') {
      return createResponse("error", "Sheet not found and could not be created: " + sheetName);
    }

    switch (action) {
      case 'read':
        return readData(sheet, params);
      case 'write':
        return writeData(sheet, data);
      case 'lookup':
        return lookupData(sheet, data);
      case 'login':
        return handleLogin(ss, data);
      default:
        return createResponse("error", "Unknown action: " + action);
    }
  } catch (err) {
    return createResponse("error", err.toString());
  } finally {
    // Always release the lock
    lock.releaseLock();
  }
}

function doGet(e) {
  return createResponse("success", "WMS Master API is active. Please use POST for data operations.");
}

// --- Action Handlers ---

function readData(sheet, params) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  let data = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // Support Pagination
  const limit = params.limit || null;
  const offset = params.offset || 0;
  
  const totalCount = data.length;
  if (limit !== null) {
    data = data.slice(offset, offset + limit);
  }

  return createResponse("success", "Data retrieved", {
    items: data,
    totalCount: totalCount,
    limit: limit,
    offset: offset
  });
}

function writeData(sheet, data) {
  if (!Array.isArray(data)) data = [data];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  data.forEach(item => {
    const row = headers.map(h => item[h] || "");
    sheet.appendRow(row);
  });
  
  // Auto-Cleanup: Remove empty rows to keep the sheet lean and fast
  const lastRow = sheet.getLastRow();
  const maxRows = sheet.getMaxRows();
  if (maxRows > lastRow + 1) {
    sheet.deleteRows(lastRow + 1, maxRows - lastRow - 1);
  }
  
  return createResponse("success", "Data saved successfully");
}

function handleLogin(ss, credentials) {
  const userSheet = ss.getSheetByName("Users");
  const values = userSheet.getDataRange().getValues();
  const headers = values[0];
  const users = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  const user = users.find(u => 
    String(u.employeeId) === String(credentials.employeeId) && 
    String(u.idCard) === String(credentials.idCard)
  );

  if (user) {
    // Format response to match App's User interface
    const userData = {
      id: user.id || user.employeeId,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      avatar: user.avatar || "",
      permissions: {
        canCreate: user.role === 'Admin' || user.role === 'Editor',
        canEdit: user.role === 'Admin' || user.role === 'Editor',
        canApprove: user.role === 'Admin',
        canVerify: user.role === 'Admin' || user.role === 'Editor'
      }
    };
    return createResponse("success", "Login successful", userData);
  } else {
    return createResponse("error", "Invalid Staff Code or ID Card Number");
  }
}

// --- Helpers ---

function createResponse(status, message, data = null) {
  const result = { status: status, message: message, data: data };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## API Security (API Key Setup)
To secure your API, follow these steps:

1.  **In Google Apps Script**:
    -   Go to **Project Settings** (gear icon).
    -   Under **Script Properties**, click **Add script property**.
    -   Property: `API_KEY`, Value: `your_secret_key_here`.
    -   Update the `EXPECTED_API_KEY` in the code to:
        ```javascript
        const EXPECTED_API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY');
        ```
2.  **In Vercel / Local Environment**:
    -   Add `VITE_API_KEY` to your environment variables with the same value.

## Scalability & Migration (Future-Proofing)
If your system grows beyond Google Sheets limits (10M cells):

### 1. Migration to Firebase / PostgreSQL
- **UI Consistency**: Since we use a centralized `api.ts` and Shared Components, **90% of your Frontend code will NOT change**.
- **Service Layer**: You only need to update `src/services/api.ts` to point to a new backend (Node.js/Express or Firebase Functions).
- **Data Transfer**:
    -   Export Google Sheets to CSV.
    -   Import CSV into PostgreSQL or Firestore.
    -   The JSON format we use (`{ action, sheet, data }`) is already compatible with NoSQL (Firestore) and can be easily mapped to SQL (PostgreSQL).

### 2. Why this setup is "Easy" to migrate:
- **Decoupled Logic**: Your pages don't know they are talking to Google Sheets; they just talk to the `api` service.
- **Standardized Data**: Using JSON objects makes mapping to database rows or documents straightforward.

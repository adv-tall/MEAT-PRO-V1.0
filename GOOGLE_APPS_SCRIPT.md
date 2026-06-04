# Google Apps Script Setup (MEAT PRO)

This file contains the complete Apps Script code required for the backend, integrating dynamic `GLOBAL_SHEETS_CONFIG`, synchronization, and CRUD capabilities.

1. Go to Google Sheets -> Extensions -> Apps Script.
2. Select your `Code.gs` file and overwrite its contents with the code below.
3. Run `setupDatabase` directly in the editor to provision all specific sheets and columns instantly.
4. Go to **Deploy -> New Deployment**.
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
5. Click **Deploy**, authorize permissions, and copy the Web App URL.
6. Paste the deployed Web App URL in your Frontend config (`src/services/GoogleAppsScriptService.ts`).

```javascript
// Please copy the contents from /backend/Code.gs to paste over your Google Apps Script editor.
// A synced configuration to support front-end sync is ready.
```

(Note: See `/backend/Code.gs` for the raw script file).

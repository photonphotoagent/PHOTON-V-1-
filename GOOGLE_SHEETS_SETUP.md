# Google Sheets Email Collection Setup

## Step 1: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Photon Waitlist" (or whatever you prefer)
4. In Row 1, add these headers:
   - A1: `Email`
   - B1: `Timestamp`
   - C1: `Source`

## Step 2: Add the Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any code in the editor
3. Paste this code:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.email,
      new Date().toISOString(),
      data.source || 'website'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Save** (Ctrl+S)
5. Name the project "Photon Waitlist Script"

## Step 3: Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Set these options:
   - Description: "Photon Email Collection"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts
6. **COPY THE WEB APP URL** - you'll need this!

The URL will look like:
```
https://script.google.com/macros/s/AKfycbw.../exec
```

## Step 4: Add Your URL to the App

Once you have the URL, tell me and I'll add it to the WelcomeScreen component.

Or set it as an environment variable:
```
VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

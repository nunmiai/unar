# Google Sheets Form Integration Setup

Follow these steps to connect your contact form to Google Sheets.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Unar Contact Form Submissions"
4. In **Row 1**, add these headers:
   - A1: `Timestamp`
   - B1: `Name`
   - C1: `Email`
   - D1: `Phone`
   - E1: `Fragrance`
   - F1: `Message`

## Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code and paste the following:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name,
      data.email,
      data.phone,
      data.fragrance,
      data.message
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
    .createTextOutput("Form submission endpoint is working!")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

3. Click **Save** (Ctrl+S / Cmd+S)
4. Name the project "Unar Form Handler"

## Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: "Unar Contact Form"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts
   - If you see "Google hasn't verified this app", click **Advanced → Go to Unar Form Handler (unsafe)**
   - Click **Allow**
6. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/XXXXX/exec`)

## Step 4: Update Your Website

1. Open `script.js`
2. Find this line near the top of the file:
   ```javascript
   const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with your copied Web App URL

## Testing

1. Open your website and submit a test message through the contact form
2. Check your Google Sheet - a new row should appear with the form data

## Troubleshooting

- **Form submits but no data appears**: Make sure the Web App URL is correct and deployed with "Anyone" access
- **Authorization errors**: Re-deploy the script and authorize again
- **CORS errors in console**: These can be ignored when using `mode: 'no-cors'` - the data still submits

## Optional: Email Notifications

Add this to your Apps Script to receive email notifications:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name,
      data.email,
      data.phone,
      data.fragrance,
      data.message
    ]);
    
    // Send email notification
    MailApp.sendEmail({
      to: "unar.consciousliving@gmail.com",
      subject: "New Contact Form Submission - " + data.name,
      body: `New message from ${data.name}\n\nEmail: ${data.email}\nPhone: ${data.phone}\nPreferred Fragrance: ${data.fragrance}\n\nMessage:\n${data.message}`
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

After adding email notifications, click **Deploy → Manage deployments → Edit (pencil icon) → Version: New version → Deploy** to update.

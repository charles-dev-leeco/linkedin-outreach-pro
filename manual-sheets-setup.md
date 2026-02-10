# Manual Google Sheets Setup (2 minutes)

The auto-setup script needs API permissions to be enabled. Let's do it manually - it's actually faster!

## 📝 Quick Steps:

### 1. Enable Google Sheets API
```bash
# Open this URL:
https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=charles-environment

# Click "Enable" button
```

### 2. Create Google Sheet Manually

**Option A - Click this link (easiest):**
https://docs.google.com/spreadsheets/create

**Option B - Go to Google Sheets:**
1. Go to: https://docs.google.com/spreadsheets/
2. Click "+ Blank" to create new sheet
3. Name it: "LinkedIn_Outreach_Master"

### 3. Share with Service Account

**IMPORTANT:** Share the sheet with this email:
```
linkedin-outreach-bot@charles-environment.iam.gserviceaccount.com
```

**How to share:**
1. Click "Share" button (top right)
2. Paste the email above
3. Set permission to "Editor"
4. Uncheck "Notify people"
5. Click "Share"

### 4. Add Sheet Tab & Headers

1. Rename the first tab to: `Campaigns`
2. Add these headers in row 1:

```
Campaign_ID | Name | Goal | Target_Audience | Tone | Status | Templates_JSON | Schedule_Days | Schedule_Time_EST | Daily_Limit | Total_Prospects | Sent | Accepted | Rejected | Pending | Created_At | Last_Run
```

### 5. Get Sheet ID

From the URL, copy the ID:
```
https://docs.google.com/spreadsheets/d/COPY_THIS_PART/edit
                                        ^^^^^^^^^^^^^^^^
```

Example:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```
Sheet ID = `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 6. Update .env File

```bash
# Edit this file:
nano /Users/charlesdev/.openclaw/workspace/linkedin-outreach-pro/apps/api/.env

# Find this line:
GOOGLE_SHEETS_MASTER_SHEET_ID=your-master-sheet-id

# Replace with your actual Sheet ID:
GOOGLE_SHEETS_MASTER_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# Save: Ctrl+O, Enter, Ctrl+X
```

---

## ✅ Then You're Ready!

**Start the application:**

**Terminal 1 - API:**
```bash
cd /Users/charlesdev/.openclaw/workspace/linkedin-outreach-pro
npm run api
```

**Terminal 2 - Web:**
```bash
cd /Users/charlesdev/.openclaw/workspace/linkedin-outreach-pro
npm run web
```

**Chrome Extension:**
1. Open: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: `/Users/charlesdev/.openclaw/workspace/linkedin-outreach-pro/apps/extension/dist`

---

## 🎯 Final Check

Visit: http://localhost:3000
- Should see the dashboard
- Click "New Campaign"
- Try generating templates
- Everything should work!

---

**This is actually faster than the auto-setup! Let me know once you've shared the sheet with the service account email.** 🚀

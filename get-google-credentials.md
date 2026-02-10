# Get Google Sheets Credentials - Step by Step

## 🎯 What You Need

A Google Cloud Service Account JSON file to access Google Sheets.

---

## 📝 Steps (5 minutes)

### 1. Go to Google Cloud Console
Open: https://console.cloud.google.com/

### 2. Create or Select Project
- Click project dropdown at top
- Click "New Project" or select existing project
- Project name: "LinkedIn Outreach" (or any name)
- Click "Create"

### 3. Enable Google Sheets API
- In search bar, type "Sheets API"
- Click "Google Sheets API"
- Click "Enable"

### 4. Create Service Account
- Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
- Click "Create Service Account"
- Service account name: `linkedin-outreach-bot`
- Service account ID: (auto-filled)
- Click "Create and Continue"
- Role: Select "Editor"
- Click "Continue"
- Click "Done"

### 5. Create Key
- Click on the service account you just created
- Go to "Keys" tab
- Click "Add Key" → "Create New Key"
- Select "JSON"
- Click "Create"
- **File will download automatically** → Save it!

### 6. Save the Credentials File
```bash
# Move the downloaded file to:
mv ~/Downloads/linkedin-outreach-*.json /Users/charlesdev/.openclaw/workspace/linkedin-outreach-pro/apps/api/credentials.json
```

Or just drag and drop the file to:
`/Users/charlesdev/.openclaw/workspace/linkedin-outreach-pro/apps/api/credentials.json`

---

## ✅ Then Run Auto-Setup

Once you have `credentials.json` in place:

```bash
cd /Users/charlesdev/.openclaw/workspace/linkedin-outreach-pro
node setup-sheets.js
```

This will:
- ✅ Create the master Google Sheet
- ✅ Add proper headers
- ✅ Update .env with Sheet ID
- ✅ Give you the sheet URL to share

---

## 🆘 Need Help?

Just tell me "I'm stuck on step X" and I'll help you!

---

## 🎁 Shortcut (If You Have gcloud CLI)

```bash
# Create service account
gcloud iam service-accounts create linkedin-outreach-bot \
    --display-name="LinkedIn Outreach Bot"

# Get email
SA_EMAIL=$(gcloud iam service-accounts list --filter="displayName:LinkedIn Outreach Bot" --format='value(email)')

# Create key
gcloud iam service-accounts keys create credentials.json \
    --iam-account=$SA_EMAIL

# Move to project
mv credentials.json /Users/charlesdev/.openclaw/workspace/linkedin-outreach-pro/apps/api/

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/editor"

# Enable API
gcloud services enable sheets.googleapis.com
```

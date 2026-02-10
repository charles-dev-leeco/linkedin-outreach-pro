# Quick Start Guide 🚀

Get LinkedIn Outreach Pro running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd /Users/charlesdev/.openclaw/workspace/linkedin-outreach-pro
npm install
```

## Step 2: Setup Google AI (Gemini)

1. Get your Google AI API key:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Copy the API key

2. Create `apps/api/.env`:

```bash
cat > apps/api/.env << 'EOF'
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
GOOGLE_AI_MODEL=gemini-pro

GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials.json
GOOGLE_SHEETS_MASTER_SHEET_ID=will-add-later

PORT=3001
NODE_ENV=development
EOF
```

## Step 3: Setup Google Sheets

### Get Service Account Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project or select existing
3. Enable "Google Sheets API"
4. Go to "Credentials" → "Create Credentials" → "Service Account"
5. Create service account with "Editor" role
6. Click on the service account email
7. Go to "Keys" tab → "Add Key" → "Create New Key" → JSON
8. Download and save as `apps/api/credentials.json`

### Create Master Sheet

1. Create a new Google Sheet named "LinkedIn_Outreach_Master"
2. Create a sheet tab called "Campaigns"
3. Add this header row:
   ```
   Campaign_ID | Name | Goal | Target_Audience | Tone | Status | Templates_JSON | Schedule_Days | Schedule_Time_EST | Daily_Limit | Total_Prospects | Sent | Accepted | Rejected | Pending | Created_At | Last_Run
   ```
4. Share sheet with the service account email (from JSON file)
5. Copy Sheet ID from URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
6. Update `.env` with the Sheet ID

## Step 4: Start the App

### Terminal 1: API Server

```bash
npm run api
```

Should see: `🚀 API server running on http://localhost:3001`

### Terminal 2: Web Dashboard

```bash
npm run web
```

Should see: `Local: http://localhost:3000`

### Terminal 3: Build Extension

```bash
cd apps/extension
npm install
npm run build
```

## Step 5: Load Chrome Extension

1. Open Chrome and go to: `chrome://extensions/`
2. Toggle "Developer mode" (top right)
3. Click "Load unpacked"
4. Navigate to: `apps/extension/dist`
5. Extension should appear in toolbar

## Step 6: Create Your First Campaign

1. Open http://localhost:3000
2. Click "New Campaign"
3. Fill in:
   - Campaign Name: "Test Campaign"
   - Goal: "Connect with software engineers"
   - Target Audience: "Senior Software Engineers at startups"
   - Tone: "Friendly"
4. Click "Generate Templates"
5. Review and approve templates
6. Upload prospects CSV with columns:
   ```
   LinkedIn_URL, First_Name, Last_Name, Company, Role
   ```
7. Create campaign!

## Step 7: Run the Campaign

1. Set campaign to "Active"
2. Make sure you're logged into LinkedIn in Chrome
3. Click extension icon
4. Click "Check for Tasks"
5. Extension will open LinkedIn and start sending requests

## Testing Without Real LinkedIn

For testing the template generation and campaign creation:

1. Create a campaign with fake prospect data
2. Don't set it to "Active"
3. Test the AI template generation
4. Verify Google Sheets updates

## Common Issues

### "Google Gemini error"
- Verify API key is correct and active
- Check you have API access enabled
- Ensure you're not hitting rate limits

### "Google Sheets error"
- Verify credentials.json is in the right place
- Check service account has access to sheet
- Make sure Sheet ID is correct

### "Extension not working"
- Verify you're logged into LinkedIn
- Check extension permissions
- Look at Chrome console for errors

### "Templates not generating"
- Open browser console (F12)
- Check Network tab for errors
- Verify Google AI API key is correct
- Check API is enabled in Google AI Studio

## Next Steps

- Create multiple campaigns
- Import larger prospect lists
- Monitor acceptance rates
- Refine templates based on performance

## Need Help?

Check the full README.md for detailed documentation and troubleshooting.

---

**Ready to automate your LinkedIn outreach! 🎉**

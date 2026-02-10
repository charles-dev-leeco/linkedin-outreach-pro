# LinkedIn Outreach Pro 🚀

A full-stack LinkedIn outreach automation platform with AI-powered template generation.

## Features

✅ **AI-Powered Templates** - Generate personalized connection request messages using Google Gemini  
✅ **Smart Campaign Management** - Create, schedule, and monitor multiple outreach campaigns  
✅ **Google Sheets Integration** - All data stored in Google Sheets for easy access and collaboration  
✅ **Chrome Extension** - Automated connection requests with human-like behavior  
✅ **Acceptance Tracking** - Monitor who accepts/rejects your connection requests  
✅ **Safety Features** - Daily limits, random delays, anti-detection measures  

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Vite
- TanStack Query

**Backend:**
- Node.js + Express + TypeScript
- Google Gemini API
- Google Sheets API
- node-cron

**Extension:**
- Chrome Extension (Manifest V3)
- Content scripts for LinkedIn automation

## Setup

### Prerequisites

- Node.js 18+ installed
- Google AI API key (for Gemini)
- Google Cloud project with Sheets API enabled
- Google Service Account credentials

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Gemini

Create `apps/api/.env`:

```env
GOOGLE_AI_API_KEY=your-google-ai-api-key
GOOGLE_AI_MODEL=gemini-pro

GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials.json
GOOGLE_SHEETS_MASTER_SHEET_ID=your-sheet-id

PORT=3001
NODE_ENV=development
```

### 3. Setup Google Sheets

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create a Service Account
5. Download credentials JSON and save as `apps/api/credentials.json`
6. Create a new Google Sheet with the name "LinkedIn_Outreach_Master"
7. Add a sheet called "Campaigns" with headers:
   ```
   Campaign_ID | Name | Goal | Target_Audience | Tone | Status | Templates_JSON | Schedule_Days | Schedule_Time_EST | Daily_Limit | Total_Prospects | Sent | Accepted | Rejected | Pending | Created_At | Last_Run
   ```
8. Share the sheet with the service account email
9. Copy the Sheet ID from the URL and add to `.env`

### 4. Start Development

```bash
# Terminal 1: Start API server
npm run api

# Terminal 2: Start web app
npm run web

# Terminal 3: Build extension (watch mode)
cd apps/extension
npm run dev
```

### 5. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/dist` folder
5. Pin the extension to toolbar

## Usage

### Creating a Campaign

1. Open the web dashboard at `http://localhost:3000`
2. Click "New Campaign"
3. Fill in campaign details:
   - Name, goal, target audience
   - Choose tone (professional/friendly/direct)
   - Add optional key points
4. Generate AI templates:
   - Review and edit templates
   - Provide feedback to refine
   - Add or regenerate as needed
5. Upload prospects (CSV/Excel):
   - Required: LinkedIn_URL, First_Name
   - Optional: Last_Name, Company, Role, Email
6. Review and create campaign

### Running a Campaign

1. Set campaign status to "Active"
2. Click the extension icon
3. Click "Check for Tasks"
4. Extension will automatically:
   - Open LinkedIn profiles
   - Send personalized connection requests
   - Add notes to each request
   - Wait 2-5 minutes between requests
   - Update Google Sheets with status

### Monitoring

- **Dashboard**: View overall stats and campaign performance
- **Campaign Detail**: See individual campaign progress and prospect status
- **Google Sheets**: Real-time data access and manual overrides
- **Extension Popup**: Quick status and controls

## Safety & Best Practices

⚠️ **Important Safety Features:**

- **Daily Limit**: Max 25 connections/day (configurable)
- **Random Delays**: 2-5 minutes between requests
- **Human-like Behavior**: Random typing speeds, scrolling, pauses
- **Schedule**: Only runs on configured days/times
- **Anti-Detection**: Uses your real browser session

🚨 **LinkedIn Terms of Service:**

This tool automates LinkedIn actions. While we've built in safety features, use at your own risk. LinkedIn prohibits automation and may suspend accounts. Recommendations:

- Start with low daily limits (10-15)
- Only run during business hours
- Use authentic, personalized messages
- Don't spam or send generic requests
- Respect people's privacy

## Project Structure

```
linkedin-outreach-pro/
├── apps/
│   ├── web/          # React frontend
│   ├── api/          # Express backend
│   └── extension/    # Chrome extension
├── packages/
│   ├── shared/       # Shared types & utilities
│   └── config/       # Shared configs
└── README.md
```

## API Endpoints

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create campaign
- `PATCH /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/:id/stats` - Get campaign statistics

### Templates
- `POST /api/templates/generate` - Generate AI templates
- `POST /api/templates/refine` - Refine a template
- `POST /api/templates/validate` - Validate template

### Prospects
- `GET /api/prospects/campaign/:id` - Get campaign prospects
- `POST /api/prospects/campaign/:id/import` - Import prospects
- `POST /api/prospects/parse` - Parse CSV/Excel file
- `PATCH /api/prospects/:campaignId/:profileUrl` - Update prospect

### Extension
- `GET /api/extension/pending-tasks` - Get tasks for extension
- `POST /api/extension/update-status` - Update task status
- `POST /api/extension/update-response` - Update acceptance status

## Troubleshooting

### Extension not working
- Make sure you're logged into LinkedIn
- Check extension has permissions for linkedin.com
- Look at browser console for errors
- Verify API server is running

### Templates not generating
- Check Google AI API key is correct
- Verify API access is enabled
- Check API quota/limits
- Look at backend logs

### Google Sheets errors
- Verify service account has access to sheet
- Check credentials.json is in correct location
- Ensure Sheet ID is correct in .env
- Verify sheet has correct structure

## Contributing

This is a private tool. For questions or issues, contact the development team.

## License

Private - All Rights Reserved

---

**Built with ❤️ for efficient LinkedIn outreach**

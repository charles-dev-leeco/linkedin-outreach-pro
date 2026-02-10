#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function setupGoogleSheets() {
  console.log('📊 Setting up Google Sheets...\n');

  // Check for credentials
  const credPath = path.join(__dirname, 'apps/api/credentials.json');
  
  if (!fs.existsSync(credPath)) {
    console.error('❌ credentials.json not found!');
    console.log('\nPlease follow these steps:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a project or select existing');
    console.log('3. Enable Google Sheets API');
    console.log('4. Create Service Account with Editor role');
    console.log('5. Download JSON key and save as apps/api/credentials.json');
    console.log('\nThen run this script again.');
    process.exit(1);
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Create master spreadsheet
    console.log('Creating master spreadsheet...');
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'LinkedIn_Outreach_Master',
        },
        sheets: [{
          properties: {
            title: 'Campaigns',
          },
        }],
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    console.log('✅ Created spreadsheet:', spreadsheetId);

    // Add headers
    const headers = [
      'Campaign_ID', 'Name', 'Goal', 'Target_Audience', 'Tone', 'Status',
      'Templates_JSON', 'Schedule_Days', 'Schedule_Time_EST', 'Daily_Limit',
      'Total_Prospects', 'Sent', 'Accepted', 'Rejected', 'Pending',
      'Created_At', 'Last_Run'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Campaigns!A1:Q1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    console.log('✅ Added headers to Campaigns sheet');

    // Format header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  fontSize: 11,
                  bold: true,
                },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        }],
      },
    });

    console.log('✅ Formatted header row');

    // Update .env file
    const envPath = path.join(__dirname, 'apps/api/.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/GOOGLE_SHEETS_MASTER_SHEET_ID=.*/, `GOOGLE_SHEETS_MASTER_SHEET_ID=${spreadsheetId}`);
    } else {
      envContent = `GOOGLE_AI_API_KEY=your-google-ai-api-key
GOOGLE_AI_MODEL=gemini-pro

GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials.json
GOOGLE_SHEETS_MASTER_SHEET_ID=${spreadsheetId}

PORT=3001
NODE_ENV=development
`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with Sheet ID');

    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log(`1. Open the sheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    console.log(`2. Share it with: ${credentials.client_email}`);
    console.log('3. Get Google AI API key from: https://makersuite.google.com/app/apikey');
    console.log('4. Update GOOGLE_AI_API_KEY in apps/api/.env');
    console.log('5. Run: npm run api');
    console.log('6. Run: npm run web');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupGoogleSheets().catch(console.error);

#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

async function enableAPIAndSetup() {
  console.log('🔧 Enabling Google Sheets API and creating sheet...\n');

  const credentials = JSON.parse(
    fs.readFileSync('./apps/api/credentials.json', 'utf-8')
  );

  const projectId = credentials.project_id;
  const clientEmail = credentials.client_email;

  console.log(`Project ID: ${projectId}`);
  console.log(`Service Account: ${clientEmail}\n`);

  // Step 1: Try to enable the API
  console.log('📡 Step 1: Enabling Sheets API...');
  console.log('Opening browser to enable API...\n');

  const enableUrl = `https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=${projectId}`;
  
  // Open browser automatically
  const { exec } = require('child_process');
  exec(`open "${enableUrl}"`, (err) => {
    if (err) {
      console.log(`\n👉 Please open this URL manually: ${enableUrl}`);
    }
  });

  console.log('⚠️  ACTION REQUIRED:');
  console.log('   1. Browser will open (or use URL above)');
  console.log('   2. Click "ENABLE" button');
  console.log('   3. Wait 30 seconds');
  console.log('   4. Press Enter here to continue...\n');

  // Wait for user
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  console.log('\n✅ API should now be enabled! Attempting sheet creation...\n');

  // Step 2: Create the sheet
  try {
    const { google } = require('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Creating master spreadsheet...');
    
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

    console.log('✅ Added headers');

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

    console.log('✅ Formatted headers');

    // Update .env
    const envPath = './apps/api/.env';
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(
      /GOOGLE_SHEETS_MASTER_SHEET_ID=.*/,
      `GOOGLE_SHEETS_MASTER_SHEET_ID=${spreadsheetId}`
    );
    fs.writeFileSync(envPath, envContent);

    console.log('✅ Updated .env file\n');

    console.log('🎉 Setup complete!\n');
    console.log('📋 Next steps:');
    console.log(`   1. View sheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    console.log('   2. Run: npm run api');
    console.log('   3. Run: npm run web');
    console.log('\n✅ Ready to launch! 🚀');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('permission')) {
      console.log('\n💡 The API might need a few more seconds to activate.');
      console.log('   Wait 1 minute and run this script again:');
      console.log('   node enable-api-and-setup.js');
    }
    
    process.exit(1);
  }
}

enableAPIAndSetup().catch(console.error);

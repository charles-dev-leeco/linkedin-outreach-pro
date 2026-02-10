#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function createSheetWithDrive() {
  console.log('📊 Creating Google Sheet using Drive API...\n');

  const credPath = path.join(__dirname, 'apps/api/credentials.json');
  
  if (!fs.existsSync(credPath)) {
    console.error('❌ credentials.json not found!');
    process.exit(1);
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📝 Creating spreadsheet file...');
    
    // Create spreadsheet using Drive API
    const fileMetadata = {
      name: 'LinkedIn_Outreach_Master',
      mimeType: 'application/vnd.google-apps.spreadsheet'
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id'
    });

    const spreadsheetId = file.data.id;
    console.log('✅ Created spreadsheet:', spreadsheetId);

    // Now use Sheets API to set it up
    console.log('📊 Setting up sheet structure...');

    // Add "Campaigns" sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          updateSheetProperties: {
            properties: {
              sheetId: 0,
              title: 'Campaigns',
            },
            fields: 'title',
          },
        }],
      },
    });

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

    // Update .env file
    const envPath = path.join(__dirname, 'apps/api/.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(
      /GOOGLE_SHEETS_MASTER_SHEET_ID=.*/,
      `GOOGLE_SHEETS_MASTER_SHEET_ID=${spreadsheetId}`
    );
    fs.writeFileSync(envPath, envContent);

    console.log('✅ Updated .env file');

    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log(`1. View sheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    console.log('2. Service account:', credentials.client_email);
    console.log('3. Run: npm run api (Terminal 1)');
    console.log('4. Run: npm run web (Terminal 2)');
    console.log('5. Load extension: apps/extension/dist/');
    console.log('\n✅ Ready to launch! 🚀');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nFull error:', error);
    
    if (error.message.includes('drive')) {
      console.log('\n💡 Drive API may need to be enabled.');
      console.log('   Visit: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=charles-environment');
      console.log('   Click "Enable" and run this script again.');
    }
    
    process.exit(1);
  }
}

createSheetWithDrive().catch(console.error);

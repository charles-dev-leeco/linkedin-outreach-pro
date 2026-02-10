#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');

async function createSheetInSharedDrive() {
  console.log('📊 Creating Google Sheet in Shared Drive...\n');

  const credentials = JSON.parse(
    fs.readFileSync('./apps/api/credentials.json', 'utf-8')
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ],
  });

  const drive = google.drive({ version: 'v3', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Step 1: List shared drives the service account has access to
    console.log('🔍 Looking for shared drives...');
    const drivesList = await drive.drives.list({
      pageSize: 10,
      fields: 'drives(id, name)'
    });

    if (!drivesList.data.drives || drivesList.data.drives.length === 0) {
      console.log('❌ No shared drives found. Trying regular Drive...\n');
      
      // Try regular approach with supportsAllDrives
      console.log('📝 Attempting to create in regular Drive with supportsAllDrives...');
      const file = await drive.files.create({
        supportsAllDrives: true,
        requestBody: {
          name: 'LinkedIn_Outreach_Master',
          mimeType: 'application/vnd.google-apps.spreadsheet'
        },
        fields: 'id'
      });
      
      console.log('✅ Created spreadsheet:', file.data.id);
      await setupSheet(sheets, file.data.id, credentials);
      return;
    }

    console.log('✅ Found shared drives:');
    drivesList.data.drives.forEach((d, i) => {
      console.log(`   ${i + 1}. ${d.name} (ID: ${d.id})`);
    });

    // Use the first shared drive
    const sharedDrive = drivesList.data.drives[0];
    console.log(`\n📁 Using shared drive: ${sharedDrive.name}`);

    // Step 2: Create spreadsheet in the shared drive
    console.log('📝 Creating spreadsheet in shared drive...');
    const file = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: 'LinkedIn_Outreach_Master',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [sharedDrive.id]
      },
      fields: 'id'
    });

    const spreadsheetId = file.data.id;
    console.log('✅ Created spreadsheet:', spreadsheetId);

    await setupSheet(sheets, spreadsheetId, credentials);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.errors) {
      console.log('Details:', JSON.stringify(error.errors, null, 2));
    }
    
    process.exit(1);
  }
}

async function setupSheet(sheets, spreadsheetId, credentials) {
  console.log('\n📊 Setting up sheet structure...');

  // Rename default sheet to "Campaigns"
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
  const envPath = './apps/api/.env';
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
  console.log('2. Run: npm run api (Terminal 1)');
  console.log('3. Run: npm run web (Terminal 2)');
  console.log('4. Load extension: apps/extension/dist/');
  console.log('\n✅ Ready to launch! 🚀');
}

createSheetInSharedDrive().catch(console.error);

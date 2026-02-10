#!/usr/bin/env node

require('dotenv').config({ path: './apps/api/.env' });
const { google } = require('googleapis');
const fs = require('fs');

async function migrateSheet() {
  console.log('🔄 Migrating Google Sheet...');

  const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH.startsWith('./') 
    ? `./apps/api/${process.env.GOOGLE_SHEETS_CREDENTIALS_PATH.substring(2)}`
    : process.env.GOOGLE_SHEETS_CREDENTIALS_PATH;

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(fs.readFileSync(credentialsPath, 'utf-8')),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_MASTER_SHEET_ID;

  // Update header row (add Sheet_ID at column R)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Campaigns!R1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [['Sheet_ID']],
    },
  });

  console.log('✅ Added Sheet_ID header');
}

migrateSheet().catch(console.error);

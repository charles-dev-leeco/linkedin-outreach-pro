#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');

async function checkDriveStorage() {
  console.log('🔍 Checking Drive storage for service account...\n');

  const credentials = JSON.parse(
    fs.readFileSync('./apps/api/credentials.json', 'utf-8')
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // Get storage info
    console.log('📊 Fetching storage quota...');
    const about = await drive.about.get({
      fields: 'storageQuota,user'
    });

    console.log('\n✅ Storage Information:');
    const quota = about.data.storageQuota;
    
    if (quota) {
      const limit = parseInt(quota.limit || 0);
      const usage = parseInt(quota.usage || 0);
      const usageInDrive = parseInt(quota.usageInDrive || 0);
      
      const limitGB = (limit / (1024**3)).toFixed(2);
      const usageGB = (usage / (1024**3)).toFixed(2);
      const usageInDriveGB = (usageInDrive / (1024**3)).toFixed(2);
      const percentUsed = limit > 0 ? ((usage / limit) * 100).toFixed(1) : 'N/A';

      console.log(`   Total Limit: ${limitGB} GB`);
      console.log(`   Used: ${usageGB} GB (${percentUsed}%)`);
      console.log(`   Used in Drive: ${usageInDriveGB} GB`);
      console.log(`   Available: ${(limit - usage) / (1024**3) >= 0 ? ((limit - usage) / (1024**3)).toFixed(2) : 'Unlimited'} GB`);
    } else {
      console.log('   ℹ️  No storage quota info available (might be unlimited for service accounts)');
    }

    // List files to see what's using space
    console.log('\n📁 Recent files in Drive:');
    const files = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType, size, createdTime)',
      orderBy: 'createdTime desc'
    });

    if (files.data.files.length > 0) {
      files.data.files.forEach(file => {
        const sizeMB = file.size ? (parseInt(file.size) / (1024**2)).toFixed(2) : 'N/A';
        console.log(`   - ${file.name} (${sizeMB} MB) - ${file.mimeType}`);
      });
    } else {
      console.log('   (No files found)');
    }

    console.log('\n💡 Analysis:');
    if (quota && quota.limit && parseInt(quota.usage) >= parseInt(quota.limit) * 0.9) {
      console.log('   ⚠️  Storage is nearly full or exceeded!');
      console.log('\n   Solutions:');
      console.log('   1. Delete unnecessary files from service account Drive');
      console.log('   2. Request storage increase for the service account');
      console.log('   3. Use a Shared Drive (if available in Google Workspace)');
      console.log('   4. Create files in user Drive instead (recommended)');
    } else {
      console.log('   ✅ Storage looks fine. The error might be a temporary API issue.');
      console.log('   💡 Try running create-sheet-with-drive.js again in 30 seconds.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('quota')) {
      console.log('\n💡 This appears to be a quota issue.');
      console.log('   Check: https://console.cloud.google.com/iam-admin/quotas?project=charles-environment');
    }
  }
}

checkDriveStorage().catch(console.error);

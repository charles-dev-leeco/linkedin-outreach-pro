import { google } from 'googleapis';
import type { Campaign, Prospect } from '@linkedin-outreach-pro/shared';
import { formatDate } from '@linkedin-outreach-pro/shared';
import fs from 'fs';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

// Lazy getters to ensure env vars are loaded
function getMasterSheetId() {
  const id = process.env.GOOGLE_SHEETS_MASTER_SHEET_ID;
  if (!id) {
    throw new Error('GOOGLE_SHEETS_MASTER_SHEET_ID is not set');
  }
  return id;
}

function getSharedDriveId() {
  return process.env.GOOGLE_SHARED_DRIVE_ID;
}

let authClient: any;

async function getAuthClient() {
  if (authClient) return authClient;

  const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || './credentials.json';
  
  if (!fs.existsSync(credentialsPath)) {
    throw new Error('Google Sheets credentials file not found');
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  
  authClient = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return authClient;
}

async function getSheets() {
  const auth = await getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

// Master Sheet Operations
export async function getCampaigns(): Promise<Campaign[]> {
  const sheets = await getSheets();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getMasterSheetId(),
    range: 'Campaigns!A2:R1000', // Skip header row
  });

  const rows = response.data.values || [];
  
  return rows.map(row => ({
    id: row[0] || '',
    name: row[1] || '',
    goal: row[2] || '',
    targetAudience: row[3] || '',
    tone: row[4] as any || 'professional',
    status: row[5] as any || 'draft',
    templates: JSON.parse(row[6] || '[]'),
    scheduleDays: JSON.parse(row[7] || '[]'),
    scheduleTime: row[8] || '10:00',
    dailyLimit: parseInt(row[9] || '25'),
    totalProspects: parseInt(row[10] || '0'),
    sent: parseInt(row[11] || '0'),
    accepted: parseInt(row[12] || '0'),
    rejected: parseInt(row[13] || '0'),
    pending: parseInt(row[14] || '0'),
    createdAt: row[15] || '',
    lastRun: row[16] || undefined,
    sheetId: row[17] || undefined,
  }));
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const campaigns = await getCampaigns();
  return campaigns.find(c => c.id === id) || null;
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> {
  const sheets = await getSheets();
  const id = `campaign_${Date.now()}`;
  const createdAt = formatDate(new Date());
  
  const newCampaign: Campaign = {
    ...campaign,
    id,
    createdAt,
  };

  const row = [
    newCampaign.id,
    newCampaign.name,
    newCampaign.goal,
    newCampaign.targetAudience,
    newCampaign.tone,
    newCampaign.status,
    JSON.stringify(newCampaign.templates),
    JSON.stringify(newCampaign.scheduleDays),
    newCampaign.scheduleTime,
    newCampaign.dailyLimit,
    newCampaign.totalProspects,
    newCampaign.sent,
    newCampaign.accepted,
    newCampaign.rejected,
    newCampaign.pending,
    newCampaign.createdAt,
    newCampaign.lastRun || '',
    newCampaign.sheetId || '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getMasterSheetId(),
    range: 'Campaigns!A:R',
    valueInputOption: 'RAW',
    requestBody: {
      values: [row],
    },
  });

  return newCampaign;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<void> {
  const sheets = await getSheets();
  const campaigns = await getCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Campaign not found');
  }

  const campaign = { ...campaigns[index], ...updates };
  const rowNumber = index + 2; // +2 because of header and 0-indexing

  const row = [
    campaign.id,
    campaign.name,
    campaign.goal,
    campaign.targetAudience,
    campaign.tone,
    campaign.status,
    JSON.stringify(campaign.templates),
    JSON.stringify(campaign.scheduleDays),
    campaign.scheduleTime,
    campaign.dailyLimit,
    campaign.totalProspects,
    campaign.sent,
    campaign.accepted,
    campaign.rejected,
    campaign.pending,
    campaign.createdAt,
    campaign.lastRun || '',
    campaign.sheetId || '',
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: getMasterSheetId(),
    range: `Campaigns!A${rowNumber}:R${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [row],
    },
  });
}

export async function deleteCampaign(id: string): Promise<void> {
  const sheets = await getSheets();
  const campaigns = await getCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Campaign not found');
  }

  const rowNumber = index + 2;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getMasterSheetId(),
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 0, // Assuming first sheet
            dimension: 'ROWS',
            startIndex: rowNumber - 1,
            endIndex: rowNumber,
          },
        },
      }],
    },
  });
}

// Campaign-specific sheet operations
export async function createCampaignSheet(campaignId: string, campaignName: string): Promise<string> {
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  const sheets = await getSheets();
  
  // Create new spreadsheet in shared drive
  const fileMetadata: any = {
    name: `Campaign_${campaignName}_${campaignId}`,
    mimeType: 'application/vnd.google-apps.spreadsheet'
  };

  // If shared drive is configured, create in shared drive
  if (getSharedDriveId()) {
    fileMetadata.parents = [getSharedDriveId()];
  }

  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: fileMetadata,
    fields: 'id'
  });

  const sheetId = file.data.id!;

  // Rename default sheet to "Prospects"
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [{
        updateSheetProperties: {
          properties: {
            sheetId: 0,
            title: 'Prospects',
          },
          fields: 'title',
        },
      }],
    },
  });

  // Add headers
  const headers = [
    'Profile URL', 'First Name', 'Last Name', 'Company', 'Role', 'Email',
    'Template Used', 'Personalized Note', 'Status', 'Sent Date',
    'Response Status', 'Response Date', 'Error Message', 'Mutual Connections'
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'Prospects!A1:N1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [headers],
    },
  });

  return sheetId;
}

export async function addProspects(campaignSheetId: string, prospects: Prospect[]): Promise<void> {
  const sheets = await getSheets();
  
  const rows = prospects.map(p => [
    p.profileUrl,
    p.firstName,
    p.lastName || '',
    p.company || '',
    p.role || '',
    p.email || '',
    p.templateUsed?.toString() || '',
    p.personalizedNote || '',
    p.status,
    p.sentDate || '',
    p.responseStatus || '',
    p.responseDate || '',
    p.errorMessage || '',
    p.mutualConnections?.toString() || '',
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: campaignSheetId,
    range: 'Prospects!A:N',
    valueInputOption: 'RAW',
    requestBody: {
      values: rows,
    },
  });
}

export async function getProspects(campaignSheetId: string): Promise<Prospect[]> {
  const sheets = await getSheets();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: campaignSheetId,
    range: 'Prospects!A2:N10000',
  });

  const rows = response.data.values || [];
  
  return rows.map(row => ({
    profileUrl: row[0] || '',
    firstName: row[1] || '',
    lastName: row[2] || undefined,
    company: row[3] || undefined,
    role: row[4] || undefined,
    email: row[5] || undefined,
    templateUsed: row[6] ? parseInt(row[6]) : undefined,
    personalizedNote: row[7] || undefined,
    status: row[8] as any || 'pending',
    sentDate: row[9] || undefined,
    responseStatus: row[10] || undefined,
    responseDate: row[11] || undefined,
    errorMessage: row[12] || undefined,
    mutualConnections: row[13] ? parseInt(row[13]) : undefined,
  }));
}

export async function updateProspectStatus(
  campaignSheetId: string,
  profileUrl: string,
  updates: Partial<Prospect>
): Promise<void> {
  const sheets = await getSheets();
  const prospects = await getProspects(campaignSheetId);
  const index = prospects.findIndex(p => p.profileUrl === profileUrl);
  
  if (index === -1) {
    throw new Error('Prospect not found');
  }

  const prospect = { ...prospects[index], ...updates };
  const rowNumber = index + 2;

  const row = [
    prospect.profileUrl,
    prospect.firstName,
    prospect.lastName || '',
    prospect.company || '',
    prospect.role || '',
    prospect.email || '',
    prospect.templateUsed?.toString() || '',
    prospect.personalizedNote || '',
    prospect.status,
    prospect.sentDate || '',
    prospect.responseStatus || '',
    prospect.responseDate || '',
    prospect.errorMessage || '',
    prospect.mutualConnections?.toString() || '',
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: campaignSheetId,
    range: `Prospects!A${rowNumber}:N${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [row],
    },
  });
}

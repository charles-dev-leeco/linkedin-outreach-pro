import express from 'express';
import type { Prospect } from '@linkedin-outreach-pro/shared';
import * as sheetsService from '../services/googleSheets';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

const router = express.Router();

// Get all prospects for a campaign
router.get('/campaign/:campaignId', async (req, res, next) => {
  try {
    const campaign = await sheetsService.getCampaign(req.params.campaignId);
    if (!campaign || !campaign.sheetId) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const prospects = await sheetsService.getProspects(campaign.sheetId);
    res.json({ success: true, data: prospects });
  } catch (error) {
    next(error);
  }
});

// Add prospects to campaign (bulk import)
router.post('/campaign/:campaignId/import', async (req, res, next) => {
  try {
    const campaign = await sheetsService.getCampaign(req.params.campaignId);
    if (!campaign || !campaign.sheetId) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const { prospects } = req.body;
    
    if (!prospects || !Array.isArray(prospects)) {
      return res.status(400).json({
        success: false,
        error: 'Prospects array is required',
      });
    }

    // Validate and normalize prospects
    const validProspects: Prospect[] = prospects
      .filter(p => p.profileUrl && p.firstName)
      .map(p => ({
        profileUrl: p.profileUrl,
        firstName: p.firstName,
        lastName: p.lastName,
        company: p.company,
        role: p.role,
        email: p.email,
        status: 'pending' as const,
      }));

    if (validProspects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid prospects found',
      });
    }

    await sheetsService.addProspects(campaign.sheetId, validProspects);
    
    // Update campaign total prospects count
    await sheetsService.updateCampaign(campaign.id, {
      totalProspects: campaign.totalProspects + validProspects.length,
      pending: campaign.pending + validProspects.length,
    });

    res.json({
      success: true,
      data: {
        imported: validProspects.length,
        skipped: prospects.length - validProspects.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Parse CSV/Excel file
router.post('/parse', async (req, res, next) => {
  try {
    const { fileContent, fileType } = req.body;

    if (!fileContent || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'File content and type are required',
      });
    }

    let prospects: any[] = [];

    if (fileType === 'csv') {
      prospects = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const buffer = Buffer.from(fileContent, 'base64');
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      prospects = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file type',
      });
    }

    // Normalize column names (case-insensitive mapping)
    const normalized = prospects.map(p => {
      const keys = Object.keys(p).reduce((acc, key) => {
        acc[key.toLowerCase().replace(/\s+/g, '_')] = p[key];
        return acc;
      }, {} as Record<string, any>);

      return {
        profileUrl: keys.profile_url || keys.linkedin_url || keys.url || '',
        firstName: keys.first_name || keys.firstname || '',
        lastName: keys.last_name || keys.lastname || '',
        company: keys.company || '',
        role: keys.role || keys.title || keys.position || '',
        email: keys.email || '',
      };
    });

    // Filter out invalid entries
    const valid = normalized.filter(p => p.profileUrl && p.firstName);
    const invalid = normalized.length - valid.length;

    res.json({
      success: true,
      data: {
        prospects: valid,
        total: normalized.length,
        valid: valid.length,
        invalid,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update prospect status
router.patch('/:campaignId/:profileUrl', async (req, res, next) => {
  try {
    const { campaignId, profileUrl } = req.params;
    const campaign = await sheetsService.getCampaign(campaignId);
    
    if (!campaign || !campaign.sheetId) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const decodedUrl = decodeURIComponent(profileUrl);
    await sheetsService.updateProspectStatus(campaign.sheetId, decodedUrl, req.body);

    res.json({ success: true, message: 'Prospect updated' });
  } catch (error) {
    next(error);
  }
});

export default router;

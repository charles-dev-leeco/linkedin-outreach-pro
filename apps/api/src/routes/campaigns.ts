import express from 'express';
import type { Campaign } from '@linkedin-outreach-pro/shared';
import * as sheetsService from '../services/googleSheets';

const router = express.Router();

// Get all campaigns
router.get('/', async (req, res, next) => {
  try {
    const campaigns = await sheetsService.getCampaigns();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
});

// Get campaign by ID
router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await sheetsService.getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

// Create new campaign
router.post('/', async (req, res, next) => {
  try {
    const campaignData: Omit<Campaign, 'id' | 'createdAt'> = {
      name: req.body.name,
      goal: req.body.goal,
      targetAudience: req.body.targetAudience,
      tone: req.body.tone || 'professional',
      status: 'draft',
      templates: req.body.templates || [],
      scheduleDays: req.body.scheduleDays || [2, 3, 4], // Tue, Wed, Thu
      scheduleTime: req.body.scheduleTime || '10:00',
      dailyLimit: req.body.dailyLimit || 25,
      totalProspects: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      pending: 0,
    };

    const campaign = await sheetsService.createCampaign(campaignData);
    
    // Create campaign-specific sheet
    const sheetId = await sheetsService.createCampaignSheet(campaign.id, campaign.name);
    
    // Update campaign with sheetId
    await sheetsService.updateCampaign(campaign.id, { sheetId });

    res.json({ success: true, data: { ...campaign, sheetId } });
  } catch (error) {
    next(error);
  }
});

// Update campaign
router.patch('/:id', async (req, res, next) => {
  try {
    await sheetsService.updateCampaign(req.params.id, req.body);
    const updated = await sheetsService.getCampaign(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Delete campaign
router.delete('/:id', async (req, res, next) => {
  try {
    await sheetsService.deleteCampaign(req.params.id);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    next(error);
  }
});

// Get campaign statistics
router.get('/:id/stats', async (req, res, next) => {
  try {
    const campaign = await sheetsService.getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const acceptanceRate = campaign.sent > 0
      ? Math.round((campaign.accepted / campaign.sent) * 100 * 10) / 10
      : 0;

    const stats = {
      total: campaign.totalProspects,
      sent: campaign.sent,
      pending: campaign.pending,
      accepted: campaign.accepted,
      rejected: campaign.rejected,
      acceptanceRate,
      progress: campaign.totalProspects > 0
        ? Math.round((campaign.sent / campaign.totalProspects) * 100)
        : 0,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;

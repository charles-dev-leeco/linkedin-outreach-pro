import express from 'express';
import * as sheetsService from '../services/googleSheets';
import { fillTemplate, formatDate } from '@linkedin-outreach-pro/shared';

const router = express.Router();

// Get pending tasks for extension
router.get('/pending-tasks', async (req, res, next) => {
  try {
    const campaigns = await sheetsService.getCampaigns();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    const tasks: any[] = [];

    for (const campaign of activeCampaigns) {
      if (!campaign.sheetId) continue;

      const prospects = await sheetsService.getProspects(campaign.sheetId);
      const pending = prospects.filter(p => p.status === 'pending');

      // Check if we've hit the daily limit
      const today = new Date().toISOString().split('T')[0];
      const sentToday = prospects.filter(
        p => p.status === 'sent' && p.sentDate?.startsWith(today)
      ).length;

      if (sentToday >= campaign.dailyLimit) {
        continue; // Skip this campaign, daily limit reached
      }

      // Get prospects to send
      const toSend = pending.slice(0, campaign.dailyLimit - sentToday);

      for (const prospect of toSend) {
        // Select template (rotate)
        const templateIndex = tasks.length % campaign.templates.length;
        const template = campaign.templates[templateIndex];

        // Personalize template
        const personalizedNote = fillTemplate(template, {
          firstName: prospect.firstName,
          lastName: prospect.lastName || '',
          company: prospect.company || '',
          role: prospect.role || '',
        });

        tasks.push({
          campaignId: campaign.id,
          campaignSheetId: campaign.sheetId,
          profileUrl: prospect.profileUrl,
          personalizedNote,
          templateUsed: templateIndex + 1,
        });
      }
    }

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// Update task status (called by extension after sending)
router.post('/update-status', async (req, res, next) => {
  try {
    const { campaignId, campaignSheetId, profileUrl, status, errorMessage, mutualConnections } = req.body;

    if (!campaignId || !campaignSheetId || !profileUrl || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const updates: any = {
      status,
      sentDate: formatDate(new Date()),
    };

    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }

    if (mutualConnections !== undefined) {
      updates.mutualConnections = mutualConnections;
    }

    await sheetsService.updateProspectStatus(campaignSheetId, profileUrl, updates);

    // Update campaign stats
    const campaign = await sheetsService.getCampaign(campaignId);
    if (campaign) {
      const statsUpdate: any = {
        lastRun: formatDate(new Date()),
      };

      if (status === 'sent') {
        statsUpdate.sent = campaign.sent + 1;
        statsUpdate.pending = Math.max(0, campaign.pending - 1);
      } else if (status === 'failed') {
        statsUpdate.pending = Math.max(0, campaign.pending - 1);
      }

      await sheetsService.updateCampaign(campaignId, statsUpdate);
    }

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    next(error);
  }
});

// Update acceptance/rejection status (from periodic checks)
router.post('/update-response', async (req, res, next) => {
  try {
    const { campaignId, campaignSheetId, profileUrl, responseStatus } = req.body;

    if (!campaignId || !campaignSheetId || !profileUrl || !responseStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    await sheetsService.updateProspectStatus(campaignSheetId, profileUrl, {
      responseStatus,
      responseDate: formatDate(new Date()),
    });

    // Update campaign stats
    const campaign = await sheetsService.getCampaign(campaignId);
    if (campaign) {
      const statsUpdate: any = {};

      if (responseStatus === 'accepted') {
        statsUpdate.accepted = campaign.accepted + 1;
      } else if (responseStatus === 'rejected') {
        statsUpdate.rejected = campaign.rejected + 1;
      }

      if (Object.keys(statsUpdate).length > 0) {
        await sheetsService.updateCampaign(campaignId, statsUpdate);
      }
    }

    res.json({ success: true, message: 'Response status updated' });
  } catch (error) {
    next(error);
  }
});

// Health check for extension
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

export default router;

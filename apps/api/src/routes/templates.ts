import express from 'express';
import { TemplateGenerationRequestSchema } from '@linkedin-outreach-pro/shared';
import { parseTemplateVariables } from '@linkedin-outreach-pro/shared';
import * as aiService from '../services/geminiAI';

const router = express.Router();

// Generate templates with AI
router.post('/generate', async (req, res, next) => {
  try {
    const requestData = TemplateGenerationRequestSchema.parse(req.body);
    const templates = await aiService.generateTemplates(requestData);
    
    // Parse variables from each template
    const templatesWithVariables = templates.map(template => ({
      text: template,
      variables: parseTemplateVariables(template),
    }));

    res.json({ success: true, data: { templates: templatesWithVariables } });
  } catch (error) {
    next(error);
  }
});

// Refine a specific template
router.post('/refine', async (req, res, next) => {
  try {
    const { template, feedback, context } = req.body;

    if (!template || !feedback) {
      return res.status(400).json({
        success: false,
        error: 'Template and feedback are required',
      });
    }

    const refined = await aiService.refineTemplate(template, feedback, context || {});
    
    res.json({
      success: true,
      data: {
        template: refined,
        variables: parseTemplateVariables(refined),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Validate template
router.post('/validate', (req, res) => {
  try {
    const { template } = req.body;

    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'Template is required',
      });
    }

    const variables = parseTemplateVariables(template);
    const length = template.length;
    const isValid = length <= 300;

    res.json({
      success: true,
      data: {
        isValid,
        length,
        maxLength: 300,
        variables,
        warnings: length > 300 ? ['Template exceeds 300 character limit'] : [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Validation failed' });
  }
});

export default router;

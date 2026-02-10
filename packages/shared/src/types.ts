import { z } from 'zod';

// Campaign Types
export const CampaignStatus = z.enum(['draft', 'active', 'paused', 'completed']);
export type CampaignStatus = z.infer<typeof CampaignStatus>;

export const CampaignTone = z.enum(['professional', 'friendly', 'direct', 'custom']);
export type CampaignTone = z.infer<typeof CampaignTone>;

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string(),
  targetAudience: z.string(),
  tone: CampaignTone,
  status: CampaignStatus,
  templates: z.array(z.string()),
  scheduleDays: z.array(z.number()), // 0-6 for Sun-Sat
  scheduleTime: z.string(), // "10:00" in EST
  dailyLimit: z.number().default(25),
  totalProspects: z.number().default(0),
  sent: z.number().default(0),
  accepted: z.number().default(0),
  rejected: z.number().default(0),
  pending: z.number().default(0),
  createdAt: z.string(),
  lastRun: z.string().optional(),
  sheetId: z.string().optional(),
});

export type Campaign = z.infer<typeof CampaignSchema>;

// Prospect Types
export const ProspectStatus = z.enum(['pending', 'sent', 'accepted', 'rejected', 'failed', 'already_connected']);
export type ProspectStatus = z.infer<typeof ProspectStatus>;

export const ProspectSchema = z.object({
  profileUrl: z.string().url(),
  firstName: z.string(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email().optional(),
  templateUsed: z.number().optional(),
  personalizedNote: z.string().optional(),
  status: ProspectStatus,
  sentDate: z.string().optional(),
  responseStatus: z.string().optional(),
  responseDate: z.string().optional(),
  errorMessage: z.string().optional(),
  mutualConnections: z.number().optional(),
});

export type Prospect = z.infer<typeof ProspectSchema>;

// Template Generation Types
export const TemplateGenerationRequestSchema = z.object({
  goal: z.string(),
  targetAudience: z.string(),
  tone: CampaignTone,
  keyPoints: z.string().optional(),
  existingTemplates: z.array(z.string()).optional(),
  feedback: z.string().optional(),
});

export type TemplateGenerationRequest = z.infer<typeof TemplateGenerationRequestSchema>;

export const TemplateGenerationResponseSchema = z.object({
  templates: z.array(z.object({
    text: z.string(),
    variables: z.array(z.string()),
  })),
});

export type TemplateGenerationResponse = z.infer<typeof TemplateGenerationResponseSchema>;

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Extension Message Types
export const ExtensionMessageType = z.enum([
  'GET_PENDING_TASKS',
  'UPDATE_PROSPECT_STATUS',
  'GET_PROFILE_DATA',
  'SEND_CONNECTION_REQUEST',
  'CHECK_INVITATION_STATUS',
]);

export type ExtensionMessageType = z.infer<typeof ExtensionMessageType>;

export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload: any;
}

export interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

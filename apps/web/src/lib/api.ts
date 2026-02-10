import axios from 'axios';
import type { Campaign, Prospect, TemplateGenerationRequest, ApiResponse } from '@linkedin-outreach-pro/shared';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Campaigns
export const campaignsApi = {
  getAll: () => api.get<ApiResponse<Campaign[]>>('/campaigns').then(r => r.data),
  getById: (id: string) => api.get<ApiResponse<Campaign>>(`/campaigns/${id}`).then(r => r.data),
  create: (data: Partial<Campaign>) => api.post<ApiResponse<Campaign>>('/campaigns', data).then(r => r.data),
  update: (id: string, data: Partial<Campaign>) => api.patch<ApiResponse<Campaign>>(`/campaigns/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete<ApiResponse>(`/campaigns/${id}`).then(r => r.data),
  getStats: (id: string) => api.get<ApiResponse<any>>(`/campaigns/${id}/stats`).then(r => r.data),
};

// Templates
export const templatesApi = {
  generate: (data: TemplateGenerationRequest) => 
    api.post<ApiResponse<{ templates: Array<{ text: string; variables: string[] }> }>>('/templates/generate', data).then(r => r.data),
  refine: (template: string, feedback: string, context: any) => 
    api.post<ApiResponse<{ template: string; variables: string[] }>>('/templates/refine', { template, feedback, context }).then(r => r.data),
  validate: (template: string) => 
    api.post<ApiResponse<any>>('/templates/validate', { template }).then(r => r.data),
};

// Prospects
export const prospectsApi = {
  getByCampaign: (campaignId: string) => 
    api.get<ApiResponse<Prospect[]>>(`/prospects/campaign/${campaignId}`).then(r => r.data),
  import: (campaignId: string, prospects: Partial<Prospect>[]) => 
    api.post<ApiResponse<{ imported: number; skipped: number }>>(`/prospects/campaign/${campaignId}/import`, { prospects }).then(r => r.data),
  parse: (fileContent: string, fileType: string) => 
    api.post<ApiResponse<{ prospects: Prospect[]; total: number; valid: number; invalid: number }>>('/prospects/parse', { fileContent, fileType }).then(r => r.data),
  updateStatus: (campaignId: string, profileUrl: string, updates: Partial<Prospect>) => 
    api.patch<ApiResponse>(`/prospects/${campaignId}/${encodeURIComponent(profileUrl)}`, updates).then(r => r.data),
};

export default api;

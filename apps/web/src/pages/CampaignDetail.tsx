import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Edit, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import { campaignsApi, prospectsApi } from '../lib/api';
import type { Prospect } from '@linkedin-outreach-pro/shared';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: campaignResponse, isLoading: loadingCampaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getById(id!),
  });

  const { data: prospectsResponse, isLoading: loadingProspects } = useQuery({
    queryKey: ['prospects', id],
    queryFn: () => prospectsApi.getByCampaign(id!),
    enabled: !!id,
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['campaign-stats', id],
    queryFn: () => campaignsApi.getStats(id!),
  });

  const campaign = campaignResponse?.data;
  const prospects = prospectsResponse?.data || [];
  const stats = statsResponse?.data;

  const handleToggleCampaign = async () => {
    if (!campaign) return;
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    
    try {
      await campaignsApi.update(campaign.id, { status: newStatus as any });
      
      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      // If resuming, try to wake up the extension
      if (newStatus === 'active') {
        triggerExtensionCheck();
      }
    } catch (error) {
      console.error('Failed to update campaign:', error);
      alert('Failed to update status. Check console for details.');
    }
  };

  const triggerExtensionCheck = () => {
    console.log('Sending wake-up signal to extension...');
    
    // Set up listener for confirmation
    const confirmListener = (event: MessageEvent) => {
      if (event.data.type === 'EXTENSION_CHECK_TRIGGERED') {
        console.log('✅ Extension confirmed task check');
        window.removeEventListener('message', confirmListener);
      }
    };
    window.addEventListener('message', confirmListener);
    
    // Send trigger
    window.postMessage({ type: 'TRIGGER_EXTENSION_CHECK' }, '*');
    
    // Timeout fallback
    setTimeout(() => {
      window.removeEventListener('message', confirmListener);
    }, 5000);
  };

  if (loadingCampaign || loadingProspects) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Campaign not found</p>
        <Link to="/campaigns" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          Back to Campaigns
        </Link>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      case 'already_connected': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <Link to="/campaigns" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Campaigns</span>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-gray-600 mt-1">{campaign.goal}</p>
          <div className="flex items-center space-x-4 mt-3">
            <span className={`badge badge-${campaign.status}`}>
              {campaign.status}
            </span>
            <span className="text-sm text-gray-600">
              Target: {campaign.targetAudience}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleCampaign}
            className="btn btn-primary flex items-center space-x-2"
          >
            {campaign.status === 'active' ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </>
            )}
          </button>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Prospects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{campaign.totalProspects}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{campaign.sent}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{campaign.accepted}</p>
              {stats && (
                <p className="text-xs text-gray-500 mt-1">{stats.acceptanceRate}% rate</p>
              )}
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{campaign.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Campaign Progress</h3>
          <span className="text-sm text-gray-600">
            {campaign.sent}/{campaign.totalProspects} sent ({stats?.progress || 0}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-primary-600 h-4 rounded-full transition-all"
            style={{ width: `${stats?.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Templates */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Templates</h3>
        <div className="space-y-3">
          {campaign.templates.map((template, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Template {index + 1}</p>
              <p className="text-gray-900">{template}</p>
              <p className="text-xs text-gray-500 mt-2">{template.length}/300 characters</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prospects Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Prospects</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prospects.map((prospect, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={prospect.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {prospect.firstName} {prospect.lastName}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prospect.company || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {prospect.role || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadgeColor(prospect.status)}`}>
                      {prospect.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {prospect.sentDate ? new Date(prospect.sentDate).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

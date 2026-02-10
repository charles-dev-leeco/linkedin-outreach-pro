import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Play, Pause, Trash2 } from 'lucide-react';
import { campaignsApi } from '../lib/api';
import type { Campaign } from '@linkedin-outreach-pro/shared';

export default function CampaignList() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsApi.getAll,
  });

  const campaigns = response?.data || [];

  const handleToggleCampaign = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    await campaignsApi.update(campaign.id, { status: newStatus as any });
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await campaignsApi.delete(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage your LinkedIn outreach campaigns</p>
        </div>
        <Link to="/campaigns/new" className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Campaign</span>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No campaigns yet</p>
          <Link to="/campaigns/new" className="btn btn-primary">
            Create Your First Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link to={`/campaigns/${campaign.id}`} className="hover:text-primary-600">
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  </Link>
                  <span className={`badge badge-${campaign.status} mt-2`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleCampaign(campaign)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title={campaign.status === 'active' ? 'Pause' : 'Resume'}
                  >
                    {campaign.status === 'active' ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{campaign.goal}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {campaign.sent}/{campaign.totalProspects}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${campaign.totalProspects > 0
                        ? (campaign.sent / campaign.totalProspects) * 100
                        : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Sent</p>
                  <p className="text-lg font-semibold text-gray-900">{campaign.sent}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Accepted</p>
                  <p className="text-lg font-semibold text-green-600">{campaign.accepted}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rate</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {campaign.sent > 0
                      ? Math.round((campaign.accepted / campaign.sent) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

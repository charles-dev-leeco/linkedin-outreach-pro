import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import { campaignsApi } from '../lib/api';

export default function Dashboard() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsApi.getAll,
  });

  const campaigns = response?.data || [];
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalAccepted = campaigns.reduce((sum, c) => sum + c.accepted, 0);
  const totalPending = campaigns.reduce((sum, c) => sum + c.pending, 0);
  const acceptanceRate = totalSent > 0 ? Math.round((totalAccepted / totalSent) * 100) : 0;

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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your LinkedIn outreach campaigns</p>
        </div>
        <Link to="/campaigns/new" className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Campaign</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Campaigns</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{activeCampaigns.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalSent}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalAccepted}</p>
              <p className="text-xs text-green-600 mt-1">{acceptanceRate}% rate</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalPending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Campaigns</h2>
          <Link to="/campaigns" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No campaigns yet</p>
            <Link to="/campaigns/new" className="btn btn-primary">
              Create Your First Campaign
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.slice(0, 5).map(campaign => (
              <Link
                key={campaign.id}
                to={`/campaigns/${campaign.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                      <span className={`badge badge-${campaign.status}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{campaign.goal}</p>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500">Sent</p>
                      <p className="font-medium text-gray-900">{campaign.sent}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Accepted</p>
                      <p className="font-medium text-green-600">{campaign.accepted}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Rate</p>
                      <p className="font-medium text-gray-900">
                        {campaign.sent > 0
                          ? Math.round((campaign.accepted / campaign.sent) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

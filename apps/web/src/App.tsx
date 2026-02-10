import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CampaignList from './pages/CampaignList';
import CampaignDetail from './pages/CampaignDetail';
import CreateCampaign from './pages/CreateCampaign';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaigns" element={<CampaignList />} />
          <Route path="/campaigns/new" element={<CreateCampaign />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

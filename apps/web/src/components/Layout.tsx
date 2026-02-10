import { Link, useLocation } from 'react-router-dom';
import { Home, List, Settings, Linkedin } from 'lucide-react';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 flex-1">
          <div className="flex items-center space-x-2 mb-8">
            <Linkedin className="w-8 h-8 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Outreach Pro</h1>
          </div>

          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              to="/campaigns"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/campaigns')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="w-5 h-5" />
              <span className="font-medium">Campaigns</span>
            </Link>

            <Link
              to="/settings"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/settings')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-medium">K</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Keshav</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

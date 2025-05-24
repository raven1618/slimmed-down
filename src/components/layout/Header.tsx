import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Search, 
  User, 
  Settings,
  Database
} from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDemoPage = location.pathname === '/sample-data-demo';

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Medical Transport CRM
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {!isDemoPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/sample-data-demo')}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Demo Data
            </Button>
          )}
          
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

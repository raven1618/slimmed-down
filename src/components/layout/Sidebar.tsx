
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Building2, 
  UserCheck,
  FileText,
  ClipboardCheck,
  ChartBar,
  Settings,
  Menu,
  X
} from 'lucide-react';

type NavItem = {
  label: string;
  icon: React.ElementType;
  path: string;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Patient Cases', icon: FileText, path: '/patient-cases' },
  { label: 'Dispatch', icon: Truck, path: '/dispatch' },
  { label: 'Facilities', icon: Building2, path: '/facilities' },
  { label: 'Crew Members', icon: UserCheck, path: '/crew' },
  { label: 'Authorizations', icon: Users, path: '/authorizations' },
  { label: 'Tasks', icon: ClipboardCheck, path: '/tasks' },
  { label: 'Performance', icon: ChartBar, path: '/performance' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 h-screen transition-all duration-300`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="text-xl font-bold text-blue-600">MedTransport</div>
          )}
          <button 
            onClick={toggleSidebar}
            className={`p-2 rounded-md hover:bg-gray-100 ${collapsed ? 'mx-auto' : ''}`}
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex-1 py-6">
          <ul className="space-y-2 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.label}>
                  <Link 
                    to={item.path}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 border-t border-gray-200">
          {!collapsed && (
            <div className="text-xs text-gray-500">
              MedTransport v1.0.0
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

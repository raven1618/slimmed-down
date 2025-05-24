
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingScreen from './LoadingScreen';

interface AuthLayoutProps {
  requiredRoles?: string[];
}

export default function AuthLayout({ requiredRoles = [] }: AuthLayoutProps) {
  const { user, profile, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && profile?.role) {
    if (!requiredRoles.includes(profile.role)) {
      // Redirect based on user's role
      switch (profile.role) {
        case 'admin':
          return <Navigate to="/dashboard" replace />;
        case 'dispatcher':
          return <Navigate to="/dispatch" replace />;
        case 'medic':
          return <Navigate to="/patient-cases" replace />;
        case 'billing':
          return <Navigate to="/authorizations" replace />;
        case 'client':
          return <Navigate to="/dashboard" replace />;
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

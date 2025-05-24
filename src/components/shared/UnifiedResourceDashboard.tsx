
import React from 'react';
import QuickStatsCards from './QuickStatsCards';
import ActiveTransportsCard from './ActiveTransportsCard';
import FleetStatusCard from './FleetStatusCard';

export default function UnifiedResourceDashboard() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <QuickStatsCards />

      {/* Active Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveTransportsCard />
        <FleetStatusCard />
      </div>
    </div>
  );
}

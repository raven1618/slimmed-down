
import React from 'react';
import FleetStatsHeader from './FleetStatsHeader';
import FleetTabManager from './FleetTabManager';
import FleetDialogManager from './FleetDialogManager';

export default function FleetDashboard() {
  return (
    <div className="space-y-6">
      <FleetStatsHeader />
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <FleetTabManager />
        </div>
        <div className="ml-4">
          <FleetDialogManager />
        </div>
      </div>
    </div>
  );
}

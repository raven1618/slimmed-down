
import React from 'react';
import FleetDashboard from '@/components/fleet/FleetDashboard';

const Fleet = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Fleet Management</h1>
      </div>
      
      <FleetDashboard />
    </div>
  );
};

export default Fleet;

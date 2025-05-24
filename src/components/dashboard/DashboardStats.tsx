
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import StatCard from './StatCard';
import { Ambulance, Clock, Clipboard, Users } from 'lucide-react';

export const DashboardStats = () => {
  // Use static data for now to avoid loading issues
  const stats = {
    openEmergencies: 3,
    avgResponseTime: 12,
    pendingAuthorizations: 7,
    activeCrews: 4
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Open Emergencies"
        value={stats.openEmergencies}
        icon={<Ambulance className="h-6 w-6" />}
        color="orange"
      />
      
      <StatCard
        title="Avg. Response Time"
        value={`${stats.avgResponseTime}m`}
        icon={<Clock className="h-6 w-6" />}
        color="blue"
      />
      
      <StatCard
        title="Pending Authorizations"
        value={stats.pendingAuthorizations}
        icon={<Clipboard className="h-6 w-6" />}
        color="purple"
      />
      
      <StatCard
        title="Active Crews"
        value={stats.activeCrews}
        icon={<Users className="h-6 w-6" />}
        color="green"
      />
    </div>
  );
};

export default DashboardStats;

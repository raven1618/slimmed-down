
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { getTodayStats } from '@/services/patientCaseService';
import StatCard from './StatCard';
import { Ambulance, Clock, Clipboard, Users } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardStats = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      try {
        return await getTodayStats();
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        // Return default stats if there's an error
        return {
          openEmergencies: 0,
          avgResponseTime: 0,
          pendingAuthorizations: 0
        };
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-16 rounded-full mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Use default values if there's an error or no data
  const safeStats = stats || {
    openEmergencies: 0,
    avgResponseTime: 0,
    pendingAuthorizations: 0
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Open Emergencies"
        value={safeStats.openEmergencies || 0}
        icon={<Ambulance className="h-6 w-6" />}
        color="orange"
      />
      
      <StatCard
        title="Avg. Response Time"
        value={safeStats.avgResponseTime ? `${Math.round(safeStats.avgResponseTime)}m` : '0m'}
        icon={<Clock className="h-6 w-6" />}
        color="blue"
      />
      
      <StatCard
        title="Pending Authorizations"
        value={safeStats.pendingAuthorizations || 0}
        icon={<Clipboard className="h-6 w-6" />}
        color="purple"
      />
      
      <StatCard
        title="Active Crews"
        value="4"
        icon={<Users className="h-6 w-6" />}
        color="green"
      />
    </div>
  );
};

export default DashboardStats;

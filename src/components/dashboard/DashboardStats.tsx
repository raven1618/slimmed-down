
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { getTodayStats } from '@/services/patientCaseService';
import StatCard from './StatCard'; // Fixed import statement
import { Ambulance, Clock, Clipboard, Users } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardStats = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getTodayStats
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-1/2 mt-4" />
              <Skeleton className="h-8 w-1/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-500">
          Error loading dashboard stats
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Open Emergencies"
        value={stats?.openEmergencies || 0}
        icon={<Ambulance className="h-6 w-6" />}
        color="orange"
      />
      
      <StatCard
        title="Avg. Response Time"
        value={stats?.avgResponseTime ? `${Math.round(stats.avgResponseTime)}m` : 'N/A'}
        icon={<Clock className="h-6 w-6" />}
        color="blue"
      />
      
      <StatCard
        title="Pending Authorizations"
        value={stats?.pendingAuthorizations || 0}
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

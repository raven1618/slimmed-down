
import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, FileCheck } from 'lucide-react';
import { fetchDashboardStats } from '@/services/patientCaseService';
import StatCard from './StatCard';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    openEmergencies: 0,
    avgResponseTime: 0,
    pendingAuthorizations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await fetchDashboardStats();
        setStats({
          openEmergencies: data.openEmergencies || 0,
          avgResponseTime: data.avgResponseTime || 0,
          pendingAuthorizations: data.pendingAuthorizations || 0,
        });
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // Set up a refresh interval every 5 minutes
    const intervalId = setInterval(loadStats, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Format the average response time nicely
  const formatResponseTime = (minutes: number) => {
    if (minutes === 0 || !minutes) return 'N/A';
    
    if (minutes < 60) {
      return `${Math.round(minutes)} mins`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMins = Math.round(minutes % 60);
      return `${hours}h ${remainingMins}m`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard 
        title="Open Emergencies" 
        value={loading ? '...' : stats.openEmergencies.toString()}
        icon={<AlertTriangle className="h-6 w-6" />}
        color="red"
      />
      <StatCard 
        title="Avg Response Time (24h)"
        value={loading ? '...' : formatResponseTime(stats.avgResponseTime)}
        icon={<Clock className="h-6 w-6" />}
        color="blue"
      />
      <StatCard 
        title="Pending Authorizations"
        value={loading ? '...' : stats.pendingAuthorizations.toString()}
        icon={<FileCheck className="h-6 w-6" />}
        color="green"
      />
    </div>
  );
}

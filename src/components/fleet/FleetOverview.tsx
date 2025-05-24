
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Truck, Settings, AlertTriangle, CheckCircle } from 'lucide-react';

interface FleetStats {
  totalVehicles: number;
  availableVehicles: number;
  inServiceVehicles: number;
  maintenanceVehicles: number;
  overdueInspections: number;
}

export default function FleetOverview() {
  const [stats, setStats] = useState<FleetStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    inServiceVehicles: 0,
    maintenanceVehicles: 0,
    overdueInspections: 0
  });

  useEffect(() => {
    fetchFleetStats();
  }, []);

  const fetchFleetStats = async () => {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('status, next_inspection');

      if (error) throw error;

      const today = new Date();
      const overdueInspections = vehicles?.filter(v => 
        v.next_inspection && new Date(v.next_inspection) < today
      ).length || 0;

      const statusCounts = vehicles?.reduce((acc, vehicle) => {
        acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setStats({
        totalVehicles: vehicles?.length || 0,
        availableVehicles: statusCounts['available'] || 0,
        inServiceVehicles: statusCounts['in_service'] || 0,
        maintenanceVehicles: statusCounts['maintenance'] || 0,
        overdueInspections
      });
    } catch (error) {
      console.error('Error fetching fleet stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: Truck,
      color: 'text-blue-600'
    },
    {
      title: 'Available',
      value: stats.availableVehicles,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'In Service',
      value: stats.inServiceVehicles,
      icon: Truck,
      color: 'text-yellow-600'
    },
    {
      title: 'Maintenance',
      value: stats.maintenanceVehicles,
      icon: Settings,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.overdueInspections > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Overdue Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              {stats.overdueInspections} vehicle{stats.overdueInspections > 1 ? 's' : ''} 
              {stats.overdueInspections > 1 ? ' have' : ' has'} overdue inspections that require immediate attention.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

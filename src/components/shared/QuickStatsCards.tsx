
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useResource } from '@/context/ResourceContext';

export default function QuickStatsCards() {
  const { vehicles, activeTransports } = useResource();

  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const inServiceVehicles = vehicles.filter(v => v.status === 'in_service');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">{availableVehicles.length}</div>
          <p className="text-sm text-gray-600">Available</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">{activeTransports.length}</div>
          <p className="text-sm text-gray-600">Active</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{inServiceVehicles.length}</div>
          <p className="text-sm text-gray-600">In Service</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-orange-600">{maintenanceVehicles.length}</div>
          <p className="text-sm text-gray-600">Maintenance</p>
        </CardContent>
      </Card>
    </div>
  );
}

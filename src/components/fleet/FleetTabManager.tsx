
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VehicleList from './VehicleList';
import MaintenanceTracker from './MaintenanceTracker';
import AssignmentManager from './AssignmentManager';

export default function FleetTabManager() {
  return (
    <Tabs defaultValue="vehicles" className="w-full">
      <TabsList className="grid grid-cols-3 w-[400px]">
        <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
      </TabsList>

      <TabsContent value="vehicles" className="mt-4">
        <VehicleList />
      </TabsContent>

      <TabsContent value="maintenance" className="mt-4">
        <MaintenanceTracker />
      </TabsContent>

      <TabsContent value="assignments" className="mt-4">
        <AssignmentManager />
      </TabsContent>
    </Tabs>
  );
}


import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import FleetOverview from './FleetOverview';
import VehicleList from './VehicleList';
import MaintenanceTracker from './MaintenanceTracker';
import AssignmentManager from './AssignmentManager';
import CreateVehicleDialog from './CreateVehicleDialog';
import { Plus } from 'lucide-react';

export default function FleetDashboard() {
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);

  return (
    <div className="space-y-6">
      <FleetOverview />
      
      <Tabs defaultValue="vehicles" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setShowCreateVehicle(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

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

      <CreateVehicleDialog 
        open={showCreateVehicle} 
        onOpenChange={setShowCreateVehicle} 
      />
    </div>
  );
}

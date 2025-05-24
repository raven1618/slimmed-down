
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import CreateVehicleDialog from './CreateVehicleDialog';
import { Plus } from 'lucide-react';

export default function FleetDialogManager() {
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);

  return (
    <>
      <Button onClick={() => setShowCreateVehicle(true)} className="bg-blue-600 hover:bg-blue-700">
        <Plus className="h-4 w-4 mr-2" />
        Add Vehicle
      </Button>

      <CreateVehicleDialog 
        open={showCreateVehicle} 
        onOpenChange={setShowCreateVehicle} 
      />
    </>
  );
}

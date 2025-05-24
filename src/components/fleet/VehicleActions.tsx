
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Truck } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_number: string;
  status: string;
}

interface VehicleActionsProps {
  vehicle: Vehicle;
  onQuickDispatch: (vehicle: Vehicle) => void;
  onUpdateStatus: (vehicleId: string, status: string) => void;
}

export default function VehicleActions({ 
  vehicle, 
  onQuickDispatch, 
  onUpdateStatus 
}: VehicleActionsProps) {
  return (
    <div className="flex gap-2 pt-2">
      <Button variant="outline" size="sm" className="flex-1">
        <Eye className="h-3 w-3 mr-1" />
        View
      </Button>
      {vehicle.status === 'available' && (
        <Button 
          size="sm" 
          className="flex-1"
          onClick={() => onQuickDispatch(vehicle)}
        >
          <Truck className="h-3 w-3 mr-1" />
          Dispatch
        </Button>
      )}
      {vehicle.status === 'in_service' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => onUpdateStatus(vehicle.id, 'available')}
        >
          Complete
        </Button>
      )}
    </div>
  );
}

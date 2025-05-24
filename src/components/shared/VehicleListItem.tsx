
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Vehicle {
  id: string;
  vehicle_number: string;
  status: string;
  location?: string;
}

interface VehicleListItemProps {
  vehicle: Vehicle;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800';
    case 'in_service': return 'bg-blue-100 text-blue-800';
    case 'maintenance': return 'bg-orange-100 text-orange-800';
    case 'out_of_service': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function VehicleListItem({ vehicle }: VehicleListItemProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <span className="font-medium text-sm">{vehicle.vehicle_number}</span>
        {vehicle.location && (
          <p className="text-xs text-gray-500">{vehicle.location}</p>
        )}
      </div>
      <Badge className={getStatusColor(vehicle.status) + " text-xs"}>
        {vehicle.status}
      </Badge>
    </div>
  );
}


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transport } from '@/types/medicalTransport';
import VehicleDetails from './VehicleDetails';
import VehicleTransportInfo from './VehicleTransportInfo';
import VehicleActions from './VehicleActions';

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  make?: string;
  model?: string;
  year?: number;
  status: string;
  mileage?: number;
  fuel_level?: number;
  next_inspection?: string;
  location?: string;
  current_transport_id?: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  assignedTransport?: Transport;
  onQuickDispatch: (vehicle: Vehicle) => void;
  onUpdateStatus: (vehicleId: string, status: string) => void;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800';
    case 'in_service': return 'bg-blue-100 text-blue-800';
    case 'maintenance': return 'bg-orange-100 text-orange-800';
    case 'out_of_service': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function VehicleCard({ 
  vehicle, 
  assignedTransport, 
  onQuickDispatch, 
  onUpdateStatus 
}: VehicleCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{vehicle.vehicle_number}</CardTitle>
          <Badge className={getStatusBadgeColor(vehicle.status)}>
            {vehicle.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <VehicleDetails vehicle={vehicle} />
        
        {assignedTransport && (
          <VehicleTransportInfo transport={assignedTransport} />
        )}
        
        <VehicleActions 
          vehicle={vehicle}
          onQuickDispatch={onQuickDispatch}
          onUpdateStatus={onUpdateStatus}
        />
      </CardContent>
    </Card>
  );
}

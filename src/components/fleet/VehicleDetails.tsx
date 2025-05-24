
import React from 'react';
import { format } from 'date-fns';
import { Fuel, Calendar, MapPin } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  mileage?: number;
  fuel_level?: number;
  next_inspection?: string;
  location?: string;
}

interface VehicleDetailsProps {
  vehicle: Vehicle;
}

const getFuelLevelColor = (level?: number) => {
  if (!level) return 'text-gray-400';
  if (level < 25) return 'text-red-600';
  if (level < 50) return 'text-orange-600';
  return 'text-green-600';
};

export default function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Type:</span>
        <span className="font-medium">{vehicle.vehicle_type}</span>
      </div>
      
      {vehicle.mileage && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Mileage:</span>
          <span className="font-medium">{vehicle.mileage.toLocaleString()} mi</span>
        </div>
      )}
      
      {vehicle.fuel_level && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Fuel className="h-3 w-3 mr-1" />
            Fuel:
          </div>
          <span className={`font-medium ${getFuelLevelColor(vehicle.fuel_level)}`}>
            {vehicle.fuel_level}%
          </span>
        </div>
      )}
      
      {vehicle.next_inspection && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-3 w-3 mr-1" />
            Next Inspection:
          </div>
          <span className="font-medium">
            {format(new Date(vehicle.next_inspection), 'MMM dd, yyyy')}
          </span>
        </div>
      )}
      
      {vehicle.location && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <MapPin className="h-3 w-3 mr-1" />
            Location:
          </div>
          <span className="font-medium">{vehicle.location}</span>
        </div>
      )}
    </>
  );
}

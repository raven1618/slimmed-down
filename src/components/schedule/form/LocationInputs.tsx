
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface LocationInputsProps {
  pickupLocation: string;
  destinationLocation: string;
  onPickupChange: (location: string) => void;
  onDestinationChange: (location: string) => void;
}

export default function LocationInputs({
  pickupLocation,
  destinationLocation,
  onPickupChange,
  onDestinationChange
}: LocationInputsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="pickupLocation">Pickup Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="pickupLocation"
            value={pickupLocation}
            onChange={(e) => onPickupChange(e.target.value)}
            placeholder="Enter pickup location"
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="destinationLocation">Destination Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="destinationLocation"
            value={destinationLocation}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="Enter destination location"
            className="pl-9"
            required
          />
        </div>
      </div>
    </>
  );
}

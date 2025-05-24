
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Truck } from 'lucide-react';

interface CrewMember {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  number: string;
  type: string;
}

interface ResourceSelectorsProps {
  assignedCrewId: string;
  assignedVehicleId: string;
  crewMembers: CrewMember[];
  vehicles: Vehicle[];
  onCrewChange: (crewId: string) => void;
  onVehicleChange: (vehicleId: string) => void;
}

export default function ResourceSelectors({
  assignedCrewId,
  assignedVehicleId,
  crewMembers,
  vehicles,
  onCrewChange,
  onVehicleChange
}: ResourceSelectorsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="assignedCrew">Assigned Crew</Label>
        <Select value={assignedCrewId} onValueChange={onCrewChange}>
          <SelectTrigger>
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select crew member" />
          </SelectTrigger>
          <SelectContent>
            {crewMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedVehicle">Assigned Vehicle</Label>
        <Select value={assignedVehicleId} onValueChange={onVehicleChange}>
          <SelectTrigger>
            <Truck className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.number} ({vehicle.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

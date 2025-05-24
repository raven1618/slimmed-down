
import React from 'react';
import DateTimeSelector from './DateTimeSelector';
import LocationInputs from './LocationInputs';
import ResourceSelectors from './ResourceSelectors';
import TransportMetadata from './TransportMetadata';

interface FormData {
  scheduledTime: string;
  pickupLocation: string;
  destinationLocation: string;
  assignedCrewId: string;
  assignedVehicleId: string;
  transportType: string;
  priority: string;
  estimatedDuration: string;
  specialRequirements: string;
  notes: string;
}

interface CrewMember {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  number: string;
  type: string;
}

interface ScheduleFormFieldsProps {
  selectedDate: Date | undefined;
  formData: FormData;
  crewMembers: CrewMember[];
  vehicles: Vehicle[];
  onDateChange: (date: Date | undefined) => void;
  onFormChange: (data: Partial<FormData>) => void;
}

export default function ScheduleFormFields({
  selectedDate,
  formData,
  crewMembers,
  vehicles,
  onDateChange,
  onFormChange
}: ScheduleFormFieldsProps) {
  return (
    <div className="space-y-4">
      <DateTimeSelector
        selectedDate={selectedDate}
        scheduledTime={formData.scheduledTime}
        onDateChange={onDateChange}
        onTimeChange={(time) => onFormChange({ scheduledTime: time })}
      />

      <LocationInputs
        pickupLocation={formData.pickupLocation}
        destinationLocation={formData.destinationLocation}
        onPickupChange={(location) => onFormChange({ pickupLocation: location })}
        onDestinationChange={(location) => onFormChange({ destinationLocation: location })}
      />

      <ResourceSelectors
        assignedCrewId={formData.assignedCrewId}
        assignedVehicleId={formData.assignedVehicleId}
        crewMembers={crewMembers}
        vehicles={vehicles}
        onCrewChange={(crewId) => onFormChange({ assignedCrewId: crewId })}
        onVehicleChange={(vehicleId) => onFormChange({ assignedVehicleId: vehicleId })}
      />

      <TransportMetadata
        transportType={formData.transportType}
        priority={formData.priority}
        estimatedDuration={formData.estimatedDuration}
        specialRequirements={formData.specialRequirements}
        notes={formData.notes}
        onTransportTypeChange={(type) => onFormChange({ transportType: type })}
        onPriorityChange={(priority) => onFormChange({ priority })}
        onDurationChange={(duration) => onFormChange({ estimatedDuration: duration })}
        onRequirementsChange={(requirements) => onFormChange({ specialRequirements: requirements })}
        onNotesChange={(notes) => onFormChange({ notes })}
      />
    </div>
  );
}

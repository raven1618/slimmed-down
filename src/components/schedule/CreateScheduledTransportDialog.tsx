
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Truck } from 'lucide-react';
import ScheduleFormFields from './form/ScheduleFormFields';

interface CreateScheduledTransportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateScheduledTransportDialog({ open, onOpenChange }: CreateScheduledTransportDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    scheduledTime: '',
    pickupLocation: '',
    destinationLocation: '',
    assignedCrewId: '',
    assignedVehicleId: '',
    transportType: 'routine',
    priority: 'routine',
    estimatedDuration: '',
    specialRequirements: '',
    notes: ''
  });

  // Mock data for demonstration
  const crewMembers = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Mike Johnson' },
    { id: '4', name: 'Sarah Wilson' }
  ];

  const vehicles = [
    { id: '1', number: 'AMB-001', type: 'ambulance' },
    { id: '2', number: 'AMB-002', type: 'ambulance' },
    { id: '3', number: 'AMB-003', type: 'ambulance' },
    { id: '4', number: 'AMB-004', type: 'ambulance' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Creating scheduled transport:', { ...formData, date: selectedDate });
    onOpenChange(false);
    // Reset form
    setFormData({
      scheduledTime: '',
      pickupLocation: '',
      destinationLocation: '',
      assignedCrewId: '',
      assignedVehicleId: '',
      transportType: 'routine',
      priority: 'routine',
      estimatedDuration: '',
      specialRequirements: '',
      notes: ''
    });
    setSelectedDate(undefined);
  };

  const handleFormChange = (changes: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...changes }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Schedule New Transport
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <ScheduleFormFields
            selectedDate={selectedDate}
            formData={formData}
            crewMembers={crewMembers}
            vehicles={vehicles}
            onDateChange={setSelectedDate}
            onFormChange={handleFormChange}
          />

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Schedule Transport
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

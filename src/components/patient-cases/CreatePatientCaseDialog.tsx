
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CasePriority } from '@/types/medicalTransport';

interface CreatePatientCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  patient_hash: string;
  origin_facility: string;
  destination_facility: string;
  priority: CasePriority;
  notes: string;
}

export default function CreatePatientCaseDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreatePatientCaseDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    patient_hash: '',
    origin_facility: '',
    destination_facility: '',
    priority: 'Routine',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_hash || !formData.origin_facility) {
      toast.error('Patient hash and origin facility are required');
      return;
    }

    // For now, just show success - we'll implement actual creation later
    toast.success('Patient case created successfully');
    onSuccess();
    
    // Reset form
    setFormData({
      patient_hash: '',
      origin_facility: '',
      destination_facility: '',
      priority: 'Routine',
      notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Patient Case</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient_hash">Patient Hash</Label>
            <Input
              id="patient_hash"
              value={formData.patient_hash}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                patient_hash: e.target.value 
              }))}
              placeholder="PAT-001-XYZ"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin_facility">Origin Facility</Label>
            <Input
              id="origin_facility"
              value={formData.origin_facility}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                origin_facility: e.target.value 
              }))}
              placeholder="General Hospital"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_facility">Destination Facility</Label>
            <Input
              id="destination_facility"
              value={formData.destination_facility}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                destination_facility: e.target.value 
              }))}
              placeholder="Specialist Center"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority}
              onValueChange={(value: CasePriority) => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              placeholder="Additional notes or special instructions..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Case
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CasePriority, Facility, FacilityType } from '@/types/medicalTransport';

interface CreatePatientCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  patient_hash: string;
  priority: CasePriority;
  origin_facility: string;
  destination_facility: string;
}

export default function CreatePatientCaseDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreatePatientCaseDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    patient_hash: '',
    priority: 'Routine',
    origin_facility: '',
    destination_facility: ''
  });
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      if (!open) return;
      
      try {
        setLoadingFacilities(true);
        const { data, error } = await supabase
          .from('facility')
          .select('*')
          .order('name');

        if (error) throw error;
        
        // Cast the data to proper Facility type with FacilityType
        const typedFacilities: Facility[] = (data || []).map(facility => ({
          ...facility,
          type: facility.type as FacilityType
        }));
        
        setFacilities(typedFacilities);
      } catch (error) {
        console.error('Error fetching facilities:', error);
        toast.error('Failed to load facilities');
      } finally {
        setLoadingFacilities(false);
      }
    };

    fetchFacilities();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_hash.trim()) {
      toast.error('Please enter a patient identifier');
      return;
    }

    if (!formData.origin_facility) {
      toast.error('Please select an origin facility');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('patientcase')
        .insert({
          patient_hash: formData.patient_hash.trim(),
          priority: formData.priority,
          origin_facility: formData.origin_facility,
          destination_facility: formData.destination_facility || null,
          status: 'Pending',
          created_by: 'demo-user' // For demo purposes
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating patient case:', error);
        toast.error(`Failed to create patient case: ${error.message}`);
        return;
      }

      toast.success('Patient case created successfully');
      
      // Reset form
      setFormData({
        patient_hash: '',
        priority: 'Routine',
        origin_facility: '',
        destination_facility: ''
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating patient case:', error);
      toast.error('Failed to create patient case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Patient Case</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient_hash">Patient Identifier</Label>
            <Input
              id="patient_hash"
              value={formData.patient_hash}
              onChange={(e) => setFormData(prev => ({ ...prev, patient_hash: e.target.value }))}
              placeholder="Enter patient identifier"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: CasePriority) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin_facility">Origin Facility</Label>
            <Select 
              value={formData.origin_facility} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, origin_facility: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingFacilities ? "Loading..." : "Select origin facility"} />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name} ({facility.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_facility">Destination Facility (Optional)</Label>
            <Select 
              value={formData.destination_facility} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, destination_facility: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination facility (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name} ({facility.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Patient Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

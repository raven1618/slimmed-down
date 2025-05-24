
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { CasePriority, Facility, FacilityType } from '@/types/medicalTransport';
import { toast } from 'sonner';

interface CreatePatientCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreateCaseForm {
  patient_hash: string;
  origin_facility: string;
  destination_facility: string;
  priority: CasePriority;
}

export default function CreatePatientCaseDialog({ open, onOpenChange, onSuccess }: CreatePatientCaseDialogProps) {
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<CreateCaseForm>();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const { data, error } = await supabase
          .from('facility')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        // Cast the data to properly typed Facility objects
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

    if (open) {
      fetchFacilities();
    }
  }, [open]);

  const onSubmit = async (data: CreateCaseForm) => {
    try {
      const { error } = await supabase
        .from('patientcase')
        .insert({
          patient_hash: data.patient_hash,
          origin_facility: data.origin_facility,
          destination_facility: data.destination_facility || null,
          priority: data.priority,
          status: 'Pending',
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (error) throw error;

      toast.success('Patient case created successfully');
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating patient case:', error);
      toast.error('Failed to create patient case');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Patient Case</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="patient_hash">Patient ID</Label>
            <Input
              id="patient_hash"
              {...register('patient_hash', { required: 'Patient ID is required' })}
              placeholder="PAT-001-XYZ"
            />
            {errors.patient_hash && (
              <p className="text-sm text-red-600">{errors.patient_hash.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="origin_facility">Origin Facility</Label>
            <Select onValueChange={(value) => setValue('origin_facility', value)}>
              <SelectTrigger>
                <SelectValue placeholder={loadingFacilities ? "Loading facilities..." : "Select origin facility"} />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="destination_facility">Destination Facility (Optional)</Label>
            <Select onValueChange={(value) => setValue('destination_facility', value)}>
              <SelectTrigger>
                <SelectValue placeholder={loadingFacilities ? "Loading facilities..." : "Select destination facility"} />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select onValueChange={(value) => setValue('priority', value as CasePriority)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

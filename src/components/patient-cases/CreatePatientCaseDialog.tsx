
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePatientCaseForm } from '@/hooks/usePatientCaseForm';
import { useFacilities } from '@/hooks/useFacilities';
import { createPatientCase } from '@/services/patientCaseFormService';
import PatientIdentifierField from './form/PatientIdentifierField';
import PriorityField from './form/PriorityField';
import FacilityField from './form/FacilityField';
import { CasePriority } from '@/types/medicalTransport';

interface CreatePatientCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreatePatientCaseDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreatePatientCaseDialogProps) {
  const [loading, setLoading] = useState(false);
  const { formData, updateField, resetForm, validateForm } = usePatientCaseForm();
  const { facilities, loading: loadingFacilities } = useFacilities(open);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);
      await createPatientCase(formData);
      toast.success('Patient case created successfully');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error creating patient case:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create patient case');
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
          <PatientIdentifierField
            value={formData.patient_hash}
            onChange={(value) => updateField('patient_hash', value)}
          />

          <PriorityField
            value={formData.priority}
            onChange={(value) => updateField('priority', value as CasePriority)}
          />

          <FacilityField
            label="Origin Facility"
            value={formData.origin_facility}
            onChange={(value) => updateField('origin_facility', value)}
            facilities={facilities}
            loading={loadingFacilities}
            placeholder="Select origin facility"
          />

          <FacilityField
            label="Destination Facility (Optional)"
            value={formData.destination_facility}
            onChange={(value) => updateField('destination_facility', value)}
            facilities={facilities}
            loading={loadingFacilities}
            placeholder="Select destination facility (optional)"
            showNoneOption={true}
          />

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


import { useState } from 'react';
import { CasePriority } from '@/types/medicalTransport';

interface FormData {
  patient_hash: string;
  priority: CasePriority;
  origin_facility: string;
  destination_facility: string;
}

export function usePatientCaseForm() {
  const [formData, setFormData] = useState<FormData>({
    patient_hash: '',
    priority: 'Routine',
    origin_facility: '',
    destination_facility: 'none'
  });

  const updateField = (field: keyof FormData, value: string | CasePriority) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      patient_hash: '',
      priority: 'Routine',
      origin_facility: '',
      destination_facility: 'none'
    });
  };

  const validateForm = () => {
    if (!formData.patient_hash.trim()) {
      return 'Please enter a patient identifier';
    }
    if (!formData.origin_facility) {
      return 'Please select an origin facility';
    }
    return null;
  };

  return {
    formData,
    updateField,
    resetForm,
    validateForm
  };
}

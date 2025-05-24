
import React from 'react';
import { PatientCase, BillingLevel } from '@/types/medicalTransport';
import PatientCaseSelect from './PatientCaseSelect';
import AmbulanceIdInput from './AmbulanceIdInput';
import BillingLevelSelect from './BillingLevelSelect';

interface FormData {
  patientcase_id: string;
  ambulance_id: string;
  billing_level: BillingLevel;
}

interface TransportFormFieldsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  patientCases: PatientCase[];
  loadingCases: boolean;
}

export default function TransportFormFields({
  formData,
  setFormData,
  patientCases,
  loadingCases
}: TransportFormFieldsProps) {
  return (
    <div className="space-y-4">
      <PatientCaseSelect
        value={formData.patientcase_id}
        onValueChange={(value) => 
          setFormData(prev => ({ ...prev, patientcase_id: value }))
        }
        patientCases={patientCases}
        loading={loadingCases}
      />

      <AmbulanceIdInput
        value={formData.ambulance_id}
        onChange={(value) => setFormData(prev => ({ 
          ...prev, 
          ambulance_id: value 
        }))}
      />

      <BillingLevelSelect
        value={formData.billing_level}
        onValueChange={(value: BillingLevel) => 
          setFormData(prev => ({ ...prev, billing_level: value }))
        }
      />
    </div>
  );
}

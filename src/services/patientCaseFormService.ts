
import { supabase } from '@/integrations/supabase/client';
import { CasePriority } from '@/types/medicalTransport';

interface CreatePatientCaseData {
  patient_hash: string;
  priority: CasePriority;
  origin_facility: string;
  destination_facility: string;
}

export async function createPatientCase(formData: CreatePatientCaseData) {
  const { data, error } = await supabase
    .from('patientcase')
    .insert({
      patient_hash: formData.patient_hash.trim(),
      priority: formData.priority,
      origin_facility: formData.origin_facility,
      destination_facility: formData.destination_facility === 'none' ? null : formData.destination_facility,
      status: 'Pending',
      created_by: 'demo-user'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating patient case:', error);
    throw new Error(`Failed to create patient case: ${error.message}`);
  }

  return data;
}

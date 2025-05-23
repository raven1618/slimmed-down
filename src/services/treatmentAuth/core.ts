
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export async function fetchTreatmentAuths() {
  try {
    const { data, error } = await supabase
      .from('treatment_auth')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          patient_hash,
          origin_facility(name),
          destination_facility(name)
        )
      `)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching treatment auths:', error);
      toast.error('Failed to load treatment authorizations');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching treatment auths:', error);
    toast.error('Failed to load treatment authorizations');
    return [];
  }
}

export async function fetchTreatmentAuthById(id: string) {
  try {
    const { data, error } = await supabase
      .from('treatment_auth')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          patient_hash,
          origin_facility(name),
          destination_facility(name)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching treatment auth:', error);
      toast.error('Failed to load treatment authorization details');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching treatment auth:', error);
    toast.error('Failed to load treatment authorization details');
    return null;
  }
}

export async function fetchTreatmentAuthByPatientCase(patientCaseId: string) {
  try {
    const { data, error } = await supabase
      .from('treatment_auth')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          patient_hash
        )
      `)
      .eq('patientcase_id', patientCaseId)
      .single();
    
    if (error) {
      console.error('Error fetching treatment auth for patient case:', error);
      toast.error('Failed to load treatment authorization');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching treatment auth for patient case:', error);
    toast.error('Failed to load treatment authorization');
    return null;
  }
}

export async function fetchPendingAuthorizations() {
  try {
    const { data, error } = await supabase
      .from('treatment_auth')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          patient_hash,
          origin_facility(name),
          destination_facility(name)
        )
      `)
      .eq('status', 'Pending')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pending authorizations:', error);
      toast.error('Failed to load pending authorizations');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching pending authorizations:', error);
    toast.error('Failed to load pending authorizations');
    return [];
  }
}

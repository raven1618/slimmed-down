
import { supabase } from "@/integrations/supabase/client";

export async function fetchTransports() {
  const { data, error } = await supabase
    .from('transport')
    .select(`
      *,
      patientcase (
        id,
        patient_hash,
        priority,
        status,
        created_at,
        origin_facility:facility!patientcase_origin_facility_fkey (
          id,
          name,
          type,
          address
        ),
        destination_facility:facility!patientcase_destination_facility_fkey (
          id,
          name,
          type,
          address
        )
      )
    `)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching transports:', error);
    throw error;
  }

  return data;
}

export async function fetchTransportById(transportId: string) {
  const { data, error } = await supabase
    .from('transport')
    .select(`
      *,
      patientcase (
        id,
        patient_hash,
        priority,
        status,
        created_at,
        origin_facility:facility!patientcase_origin_facility_fkey (
          id,
          name,
          type,
          address
        ),
        destination_facility:facility!patientcase_destination_facility_fkey (
          id,
          name,
          type,
          address
        )
      )
    `)
    .eq('id', transportId)
    .single();

  if (error) {
    console.error('Error fetching transport:', error);
    throw error;
  }

  return data;
}

export async function fetchTransportsByPatientCase(patientCaseId: string) {
  const { data, error } = await supabase
    .from('transport')
    .select(`
      *,
      patientcase (
        id,
        patient_hash,
        priority,
        status,
        created_at,
        origin_facility:facility!patientcase_origin_facility_fkey (
          id,
          name,
          type,
          address
        ),
        destination_facility:facility!patientcase_destination_facility_fkey (
          id,
          name,
          type,
          address
        )
      )
    `)
    .eq('patientcase_id', patientCaseId)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching transports for patient case:', error);
    throw error;
  }

  return data;
}

export async function fetchActiveTransports() {
  console.log('Fetching active transports...');
  
  // First, let's try a simpler query to see if basic transport data loads
  const { data, error } = await supabase
    .from('transport')
    .select('*')
    .not('start_time', 'is', null)
    .is('end_time', null)
    .order('start_time', { ascending: false });

  console.log('Simple transport query result:', { data, error });

  if (error) {
    console.error('Error fetching active transports:', error);
    throw error;
  }

  return data || [];
}

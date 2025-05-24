
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
  
  try {
    // First check if the transport table exists and has data
    const { data, error } = await supabase
      .from('transport')
      .select('*')
      .limit(10);

    console.log('Transport table query result:', { data, error });

    if (error) {
      console.error('Error fetching transports:', error);
      // Return empty array if table doesn't exist or has access issues
      return [];
    }

    // If we have data, filter for active transports
    if (data && data.length > 0) {
      const activeData = data.filter(transport => 
        transport.start_time && !transport.end_time
      );
      console.log('Active transports found:', activeData);
      return activeData;
    }

    return [];
  } catch (err) {
    console.error('Unexpected error in fetchActiveTransports:', err);
    return [];
  }
}

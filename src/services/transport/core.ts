
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Transport } from "@/types/medicalTransport";
import { createActivity } from "../activityService";

export async function fetchTransports() {
  try {
    const { data, error } = await supabase
      .from('transport')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          origin_facility(name),
          destination_facility(name)
        )
      `)
      .order('start_time', { ascending: false });
    
    if (error) {
      console.error('Error fetching transports:', error);
      toast.error('Failed to load transports');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching transports:', error);
    toast.error('Failed to load transports');
    return [];
  }
}

export async function fetchTransportById(id: string) {
  try {
    const { data, error } = await supabase
      .from('transport')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          origin_facility(name, address),
          destination_facility(name, address)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching transport:', error);
      toast.error('Failed to load transport details');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching transport:', error);
    toast.error('Failed to load transport details');
    return null;
  }
}

export async function fetchTransportsByPatientCase(patientCaseId: string) {
  try {
    const { data, error } = await supabase
      .from('transport')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status
        )
      `)
      .eq('patientcase_id', patientCaseId)
      .order('start_time', { ascending: false });
    
    if (error) {
      console.error('Error fetching transports by patient case:', error);
      toast.error('Failed to load transports');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching transports by patient case:', error);
    toast.error('Failed to load transports');
    return [];
  }
}

export async function fetchActiveTransports() {
  try {
    const { data, error } = await supabase
      .from('transport')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          origin_facility(name),
          destination_facility(name)
        )
      `)
      .is('end_time', null)
      .not('start_time', 'is', null)
      .order('start_time', { ascending: false });
    
    if (error) {
      console.error('Error fetching active transports:', error);
      toast.error('Failed to load active transports');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching active transports:', error);
    toast.error('Failed to load active transports');
    return [];
  }
}

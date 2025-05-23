
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { PatientCase } from "@/types/medicalTransport";
import { createActivity } from "./activityService";

export async function fetchPatientCases() {
  try {
    const { data, error } = await supabase
      .from('patientcase')
      .select(`
        *,
        origin_facility:origin_facility(name),
        destination_facility:destination_facility(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patient cases:', error);
      toast.error('Failed to load patient cases');
      return [];
    }
    
    return data as (PatientCase & {
      origin_facility: { name: string };
      destination_facility?: { name: string };
    })[];
  } catch (error) {
    console.error('Exception when fetching patient cases:', error);
    toast.error('Failed to load patient cases');
    return [];
  }
}

export async function fetchPatientCaseById(id: string) {
  try {
    const { data, error } = await supabase
      .from('patientcase')
      .select(`
        *,
        origin_facility:origin_facility(name, address, phone),
        destination_facility:destination_facility(name, address, phone)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching patient case:', error);
      toast.error('Failed to load patient case details');
      return null;
    }
    
    return data as PatientCase & {
      origin_facility: { name: string; address?: string; phone?: string };
      destination_facility?: { name: string; address?: string; phone?: string };
    };
  } catch (error) {
    console.error('Exception when fetching patient case:', error);
    toast.error('Failed to load patient case details');
    return null;
  }
}

export async function createPatientCase(patientCase: Omit<PatientCase, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('patientcase')
      .insert(patientCase)
      .select(`
        *,
        origin_facility:origin_facility(name)
      `)
      .single();
    
    if (error) {
      console.error('Error creating patient case:', error);
      toast.error('Failed to create patient case');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'patientcase',
      description: `New patient case created from ${data.origin_facility.name}`,
      timestamp: new Date().toISOString(),
      user: patientCase.created_by,
      relatedTo: data.origin_facility.name,
    });
    
    toast.success('Patient case created successfully');
    return data;
  } catch (error) {
    console.error('Exception when creating patient case:', error);
    toast.error('Failed to create patient case');
    return null;
  }
}

export async function updatePatientCaseStatus(id: string, status: PatientCase['status']) {
  try {
    const { data, error } = await supabase
      .from('patientcase')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        origin_facility:origin_facility(name)
      `)
      .single();
    
    if (error) {
      console.error('Error updating patient case status:', error);
      toast.error('Failed to update patient case status');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'patientcase',
      description: `Patient case status updated to ${status}`,
      timestamp: new Date().toISOString(),
      user: data.created_by,
      relatedTo: data.origin_facility.name,
    });
    
    toast.success(`Case status updated to ${status}`);
    return data;
  } catch (error) {
    console.error('Exception when updating patient case status:', error);
    toast.error('Failed to update patient case status');
    return null;
  }
}

export async function fetchPatientCasesByFacility(facilityId: string) {
  try {
    const { data, error } = await supabase
      .from('patientcase')
      .select(`
        *,
        origin_facility:origin_facility(name),
        destination_facility:destination_facility(name)
      `)
      .or(`origin_facility.eq.${facilityId},destination_facility.eq.${facilityId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patient cases by facility:', error);
      toast.error('Failed to load patient cases');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching patient cases by facility:', error);
    toast.error('Failed to load patient cases');
    return [];
  }
}

export async function fetchPatientCasesByStatus(status: PatientCase['status']) {
  try {
    const { data, error } = await supabase
      .from('patientcase')
      .select(`
        *,
        origin_facility:origin_facility(name),
        destination_facility:destination_facility(name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patient cases by status:', error);
      toast.error('Failed to load patient cases');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching patient cases by status:', error);
    toast.error('Failed to load patient cases');
    return [];
  }
}

export async function fetchPatientCasesByPriority(priority: PatientCase['priority']) {
  try {
    const { data, error } = await supabase
      .from('patientcase')
      .select(`
        *,
        origin_facility:origin_facility(name),
        destination_facility:destination_facility(name)
      `)
      .eq('priority', priority)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patient cases by priority:', error);
      toast.error('Failed to load patient cases');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching patient cases by priority:', error);
    toast.error('Failed to load patient cases');
    return [];
  }
}

export async function fetchDashboardStats(): Promise<{ 
  openEmergencies: number, 
  avgResponseTime: number | null, 
  pendingAuthorizations: number 
}> {
  try {
    // Get open emergency count
    const { data: openEmergenciesData, error: openEmergenciesError } = await supabase
      .rpc('get_open_emergency_count');
    
    if (openEmergenciesError) {
      console.error('Error fetching open emergencies:', openEmergenciesError);
    }
    
    // Get average response time
    const { data: avgResponseTimeData, error: avgResponseTimeError } = await supabase
      .rpc('get_avg_response_time_last_24h');
    
    if (avgResponseTimeError) {
      console.error('Error fetching avg response time:', avgResponseTimeError);
    }
    
    // Get pending authorizations count
    const { data: pendingAuthsData, error: pendingAuthsError } = await supabase
      .rpc('get_pending_auth_count');
    
    if (pendingAuthsError) {
      console.error('Error fetching pending auths:', pendingAuthsError);
    }
    
    return {
      openEmergencies: openEmergenciesData || 0,
      avgResponseTime: avgResponseTimeData,
      pendingAuthorizations: pendingAuthsData || 0
    };
  } catch (error) {
    console.error('Exception when fetching dashboard stats:', error);
    return {
      openEmergencies: 0,
      avgResponseTime: null,
      pendingAuthorizations: 0
    };
  }
}

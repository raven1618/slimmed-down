
import { supabase } from '@/integrations/supabase/client';
import { PatientCase, DashboardStats } from '@/types/medicalTransport';

/**
 * Get all patient cases with origin facility name
 */
export const getPatientCases = async (): Promise<(PatientCase & { origin_facility: { name: string }; destination_facility?: { name: string } })[]> => {
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
    throw error;
  }

  return data as unknown as (PatientCase & { origin_facility: { name: string }; destination_facility?: { name: string } })[];
};

/**
 * Get a patient case by ID with detailed facility information
 */
export const getPatientCaseById = async (id: string): Promise<PatientCase & { 
  origin_facility: { name: string, address?: string, phone?: string },
  destination_facility?: { name: string, address?: string, phone?: string } 
}> => {
  const { data, error } = await supabase
    .from('patientcase')
    .select(`
      *,
      origin_facility!origin_facility_id(name, address, phone),
      destination_facility!destination_facility_id(name, address, phone)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching patient case ${id}:`, error);
    throw error;
  }

  return data as unknown as PatientCase & { 
    origin_facility: { name: string, address?: string, phone?: string },
    destination_facility?: { name: string, address?: string, phone?: string } 
  };
};

/**
 * Create a new patient case
 */
export const createPatientCase = async (patientCase: Partial<PatientCase>): Promise<PatientCase> => {
  const { data, error } = await supabase
    .from('patientcase')
    .insert(patientCase)
    .select()
    .single();

  if (error) {
    console.error('Error creating patient case:', error);
    throw error;
  }

  return data as PatientCase;
};

/**
 * Update an existing patient case
 */
export const updatePatientCase = async (id: string, patientCase: Partial<PatientCase>): Promise<PatientCase> => {
  const { data, error } = await supabase
    .from('patientcase')
    .update(patientCase)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating patient case ${id}:`, error);
    throw error;
  }

  return data as PatientCase;
};

/**
 * Get dashboard statistics
 */
export const getTodayStats = async (): Promise<DashboardStats> => {
  const { data: openEmergenciesData, error: openEmergenciesError } = await supabase
    .rpc('get_open_emergency_count');

  const { data: avgResponseTimeData, error: avgResponseTimeError } = await supabase
    .rpc('get_avg_response_time_last_24h');

  const { data: pendingAuthsData, error: pendingAuthsError } = await supabase
    .rpc('get_pending_auth_count');

  if (openEmergenciesError || avgResponseTimeError || pendingAuthsError) {
    console.error('Error fetching dashboard stats:', 
      openEmergenciesError || avgResponseTimeError || pendingAuthsError);
    throw openEmergenciesError || avgResponseTimeError || pendingAuthsError;
  }

  return {
    openEmergencies: openEmergenciesData || 0,
    avgResponseTime: avgResponseTimeData || 0,
    pendingAuthorizations: pendingAuthsData || 0
  };
};

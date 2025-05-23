
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats, PatientCase } from '@/types/medicalTransport';

/**
 * Get today's dashboard stats
 */
export const getTodayStats = async (): Promise<DashboardStats> => {
  try {
    // In a real app, this would be fetched from the database with appropriate queries
    // For now, we'll return mock data
    return {
      openEmergencies: 3,
      avgResponseTime: 12.5,
      pendingAuthorizations: 7
    };
  } catch (error) {
    console.error('Error getting dashboard stats', error);
    throw error;
  }
};

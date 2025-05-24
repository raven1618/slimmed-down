
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PatientCase, CasePriority, CaseStatus, Facility, FacilityType } from '@/types/medicalTransport';

interface PatientCaseWithFacilities extends PatientCase {
  origin_facility_name?: string;
  destination_facility_name?: string;
}

export function usePatientCases() {
  const [patientCases, setPatientCases] = useState<PatientCaseWithFacilities[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFacilities = async (): Promise<Facility[]> => {
    try {
      const { data, error } = await supabase
        .from('facility')
        .select('*');
      
      if (error) {
        console.error('Error fetching facilities:', error);
        return [];
      }
      
      const typedFacilities: Facility[] = (data || []).map(facility => ({
        ...facility,
        type: facility.type as FacilityType
      }));
      
      setFacilities(typedFacilities);
      return typedFacilities;
    } catch (error) {
      console.error('Error fetching facilities:', error);
      return [];
    }
  };

  const fetchPatientCases = async (facilitiesData: Facility[] = facilities) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patientcase')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        priority: item.priority as CasePriority,
        status: item.status as CaseStatus
      }));
      
      const casesWithFacilities = typedData.map(case_ => {
        const originFacility = facilitiesData.find(f => f.id === case_.origin_facility);
        const destinationFacility = facilitiesData.find(f => f.id === case_.destination_facility);
        
        return {
          ...case_,
          origin_facility_name: originFacility?.name || 'Unknown Facility',
          destination_facility_name: destinationFacility?.name || 'Unknown Facility'
        };
      });
      
      setPatientCases(casesWithFacilities);
    } catch (error) {
      console.error('Error fetching patient cases:', error);
      toast.error('Failed to load patient cases');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    const facilitiesData = await fetchFacilities();
    await fetchPatientCases(facilitiesData);
  };

  useEffect(() => {
    const loadData = async () => {
      const facilitiesData = await fetchFacilities();
      await fetchPatientCases(facilitiesData);
    };
    
    loadData();
  }, []);

  return {
    patientCases,
    facilities,
    loading,
    refreshData
  };
}


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Facility, FacilityType } from '@/types/medicalTransport';

export function useFacilities(open: boolean) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      if (!open) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('facility')
          .select('*')
          .order('name');

        if (error) throw error;
        
        const typedFacilities: Facility[] = (data || []).map(facility => ({
          ...facility,
          type: facility.type as FacilityType
        }));
        
        setFacilities(typedFacilities);
      } catch (error) {
        console.error('Error fetching facilities:', error);
        toast.error('Failed to load facilities');
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [open]);

  return { facilities, loading };
}

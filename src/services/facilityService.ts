
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Facility } from "@/types/medicalTransport";
import { createActivity } from "./activityService";

export async function fetchFacilities() {
  try {
    const { data, error } = await supabase
      .from('facility')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching facilities:', error);
      toast.error('Failed to load facilities');
      return [];
    }
    
    return data as Facility[];
  } catch (error) {
    console.error('Exception when fetching facilities:', error);
    toast.error('Failed to load facilities');
    return [];
  }
}

export async function fetchFacilityById(id: string) {
  try {
    const { data, error } = await supabase
      .from('facility')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching facility:', error);
      toast.error('Failed to load facility details');
      return null;
    }
    
    return data as Facility;
  } catch (error) {
    console.error('Exception when fetching facility:', error);
    toast.error('Failed to load facility details');
    return null;
  }
}

export async function createFacility(facility: Omit<Facility, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('facility')
      .insert(facility)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating facility:', error);
      toast.error('Failed to create facility');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'facility',
      description: `New facility created: ${facility.name}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: facility.name,
    });
    
    toast.success('Facility created successfully');
    return data as Facility;
  } catch (error) {
    console.error('Exception when creating facility:', error);
    toast.error('Failed to create facility');
    return null;
  }
}

export async function updateFacility(id: string, facility: Partial<Facility>) {
  try {
    const { data, error } = await supabase
      .from('facility')
      .update(facility)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating facility:', error);
      toast.error('Failed to update facility');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'facility',
      description: `Facility updated: ${facility.name || data.name}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: facility.name || data.name,
    });
    
    toast.success('Facility updated successfully');
    return data as Facility;
  } catch (error) {
    console.error('Exception when updating facility:', error);
    toast.error('Failed to update facility');
    return null;
  }
}

export async function deleteFacility(id: string) {
  try {
    // First, get the facility to be deleted for logging
    const { data: facilityToDelete } = await supabase
      .from('facility')
      .select('*')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('facility')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting facility:', error);
      toast.error('Failed to delete facility');
      return false;
    }
    
    // Log activity if we got the facility data
    if (facilityToDelete) {
      await createActivity({
        type: 'facility',
        description: `Facility deleted: ${facilityToDelete.name}`,
        timestamp: new Date().toISOString(),
        user: 'System',
        relatedTo: facilityToDelete.name,
      });
    }
    
    toast.success('Facility deleted successfully');
    return true;
  } catch (error) {
    console.error('Exception when deleting facility:', error);
    toast.error('Failed to delete facility');
    return false;
  }
}

export async function fetchFacilitiesByType(type: string) {
  try {
    const { data, error } = await supabase
      .from('facility')
      .select('*')
      .eq('type', type)
      .order('name');
    
    if (error) {
      console.error('Error fetching facilities by type:', error);
      toast.error('Failed to load facilities');
      return [];
    }
    
    return data as Facility[];
  } catch (error) {
    console.error('Exception when fetching facilities by type:', error);
    toast.error('Failed to load facilities');
    return [];
  }
}

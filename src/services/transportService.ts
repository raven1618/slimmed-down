
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Transport } from "@/types/medicalTransport";
import { createActivity } from "./activityService";

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

export async function createTransport(transport: Omit<Transport, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('transport')
      .insert(transport)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transport:', error);
      toast.error('Failed to create transport');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: "task", // Changed from "transport" to valid type
      description: `New transport created for patient case ${transport.patientcase_id}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: transport.patientcase_id,
    });
    
    toast.success('Transport created successfully');
    return data as Transport;
  } catch (error) {
    console.error('Exception when creating transport:', error);
    toast.error('Failed to create transport');
    return null;
  }
}

export async function updateTransport(id: string, transport: Partial<Transport>) {
  try {
    const { data, error } = await supabase
      .from('transport')
      .update(transport)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating transport:', error);
      toast.error('Failed to update transport');
      return null;
    }
    
    const description = transport.end_time 
      ? `Transport completed for case ${data.patientcase_id}`
      : `Transport updated for case ${data.patientcase_id}`;
    
    // Log activity
    await createActivity({
      type: "task", // Changed from "transport" to valid type
      description,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: data.patientcase_id,
    });
    
    toast.success(transport.end_time ? 'Transport completed' : 'Transport updated successfully');
    return data as Transport;
  } catch (error) {
    console.error('Exception when updating transport:', error);
    toast.error('Failed to update transport');
    return null;
  }
}

export async function updateTransportLocation(id: string, lat: number, lng: number) {
  try {
    // Create a GeoJSON Point
    const point = {
      type: 'Point',
      coordinates: [lng, lat]
    };
    
    // Update the transport with the new location
    // Use plain SQL query instead of RPC due to type issues
    const { error } = await supabase
      .from('transport')
      .update({ 
        location: point 
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating transport location:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception when updating transport location:', error);
    return false;
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

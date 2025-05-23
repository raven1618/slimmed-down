
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export async function updateTransportLocation(transportId: string, latitude: number, longitude: number) {
  try {
    // First get the current transport data to update the GPS path correctly
    const { data: transport, error: fetchError } = await supabase
      .from('transport')
      .select('gps_path')
      .eq('id', transportId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching transport data:', fetchError);
      toast.error('Failed to update transport location');
      return { success: false, error: fetchError.message };
    }
    
    // Create the new location point
    const newLocationPoint = { 
      lat: latitude, 
      lng: longitude, 
      time: new Date().toISOString() 
    };
    
    // Prepare the updated GPS path - either append to existing or create new
    const updatedGpsPath = Array.isArray(transport.gps_path) 
      ? [...transport.gps_path, newLocationPoint] 
      : [newLocationPoint];
    
    // Update the transport with the new GPS path
    const { data, error } = await supabase
      .from('transport')
      .update({ 
        gps_path: updatedGpsPath,
        last_updated: new Date().toISOString()
      })
      .eq('id', transportId)
      .select();

    if (error) {
      console.error('Error updating transport location:', error);
      toast.error('Failed to update transport location');
      return { success: false, error: error.message };
    }

    // Broadcast a transport update event for real-time tracking
    console.log('Transport location updated:', newLocationPoint);
    
    return { 
      success: true, 
      data,
      location: newLocationPoint
    };
  } catch (error) {
    console.error('Exception during transport location update:', error);
    toast.error('An unexpected error occurred');
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// New function to retrieve the current location history for a transport
export async function getTransportLocationHistory(transportId: string) {
  try {
    const { data, error } = await supabase
      .from('transport')
      .select('gps_path')
      .eq('id', transportId)
      .single();
    
    if (error) {
      console.error('Error fetching transport location history:', error);
      return { success: false, error: error.message, data: [] };
    }
    
    return { 
      success: true, 
      data: Array.isArray(data.gps_path) ? data.gps_path : []
    };
  } catch (error) {
    console.error('Exception when fetching transport location history:', error);
    return { success: false, error: 'An unexpected error occurred', data: [] };
  }
}

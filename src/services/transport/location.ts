
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export async function updateTransportLocation(transportId: string, latitude: number, longitude: number) {
  try {
    // Update the transport table directly with new location data
    const locationData = { 
      lat: latitude, 
      lng: longitude, 
      time: new Date().toISOString() 
    };
    
    const { data, error } = await supabase
      .from('transport')
      .update({ 
        gps_path: locationData
      })
      .eq('id', transportId)
      .select();

    if (error) {
      console.error('Error updating transport location:', error);
      toast.error('Failed to update transport location');
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception during transport location update:', error);
    toast.error('An unexpected error occurred');
    return { success: false, error: 'An unexpected error occurred' };
  }
}


import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Transport } from "@/types/medicalTransport";

export async function createTransport(transport: Omit<Transport, 'id'>) {
  try {
    console.log('Creating transport with data:', transport);
    
    const { data, error } = await supabase
      .from('transport')
      .insert(transport)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transport:', error);
      toast.error(`Failed to create transport: ${error.message}`);
      return null;
    }
    
    console.log('Transport created successfully:', data);
    
    // Log activity - make this optional to prevent failures
    try {
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          type: "task",
          description: `New transport created for patient case ${transport.patientcase_id}`,
          timestamp: new Date().toISOString(),
          user_name: 'System',
          related_to: transport.patientcase_id,
        });

      if (activityError) {
        console.warn('Failed to log activity:', activityError);
      }
    } catch (activityErr) {
      console.warn('Activity logging failed:', activityErr);
    }
    
    toast.success('Transport created successfully');
    return data as Transport;
  } catch (error) {
    console.error('Exception when creating transport:', error);
    toast.error('Failed to create transport due to unexpected error');
    return null;
  }
}

export async function updateTransport(id: string, transport: Partial<Transport>) {
  try {
    console.log('Updating transport:', id, transport);
    
    const { data, error } = await supabase
      .from('transport')
      .update({
        ...transport,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating transport:', error);
      toast.error(`Failed to update transport: ${error.message}`);
      return null;
    }
    
    const description = transport.end_time 
      ? `Transport completed for case ${data.patientcase_id}`
      : `Transport updated for case ${data.patientcase_id}`;
    
    // Log activity - make this optional
    try {
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          type: "task",
          description,
          timestamp: new Date().toISOString(),
          user_name: 'System',
          related_to: data.patientcase_id,
        });

      if (activityError) {
        console.warn('Failed to log activity:', activityError);
      }
    } catch (activityErr) {
      console.warn('Activity logging failed:', activityErr);
    }
    
    toast.success(transport.end_time ? 'Transport completed' : 'Transport updated successfully');
    return data as Transport;
  } catch (error) {
    console.error('Exception when updating transport:', error);
    toast.error('Failed to update transport');
    return null;
  }
}

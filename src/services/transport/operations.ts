
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Transport } from "@/types/medicalTransport";
import { createActivity } from "../activityService";

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
      type: "task",
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
      type: "task",
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

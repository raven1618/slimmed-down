
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { TreatmentAuth, AuthStatus } from "@/types/medicalTransport";
import { createActivity } from "../activityService";

export async function updateTreatmentAuthStatus(id: string, status: AuthStatus, reference?: string) {
  try {
    const updateData: Partial<TreatmentAuth> = { status };
    if (reference) updateData.reference = reference;
    
    const { data, error } = await supabase
      .from('treatment_auth')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          patient_hash
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating treatment auth status:', error);
      toast.error('Failed to update authorization status');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: "task",
      description: `Treatment authorization status updated to ${status}${reference ? ` with reference ${reference}` : ''}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: data.patientcase_id,
    });
    
    toast.success(`Authorization status updated to ${status}`);
    return data;
  } catch (error) {
    console.error('Exception when updating treatment auth status:', error);
    toast.error('Failed to update authorization status');
    return null;
  }
}

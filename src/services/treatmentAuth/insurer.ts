
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { createActivity } from "../activityService";

export async function submitAuthorizationToInsurer(id: string, payerInfo: any) {
  try {
    // First update the treatment_auth with payer information and status
    const { data, error } = await supabase
      .from('treatment_auth')
      .update({
        payer: payerInfo.name,
        status: 'Submitted',
        reference: payerInfo.reference || `REF-${Date.now().toString(36)}`
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating treatment auth for submission:', error);
      toast.error('Failed to submit authorization to insurer');
      return null;
    }
    
    // TODO: In a real application, here you would call a webhook to n8n or other service
    // to handle the actual submission to the insurer's API
    
    // Log activity
    await createActivity({
      type: "task",
      description: `Authorization submitted to ${payerInfo.name}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: data.patientcase_id,
    });
    
    toast.success(`Authorization submitted to ${payerInfo.name}`);
    return data;
  } catch (error) {
    console.error('Exception when submitting authorization:', error);
    toast.error('Failed to submit authorization to insurer');
    return null;
  }
}

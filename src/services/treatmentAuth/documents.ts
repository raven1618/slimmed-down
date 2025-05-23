
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { createActivity } from "../activityService";

export async function uploadPCSForm(treatmentAuthId: string, file: File) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `pcs-forms/${fileName}`;
    
    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('medical-documents')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Error uploading PCS form:', uploadError);
      toast.error('Failed to upload PCS form');
      return null;
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase
      .storage
      .from('medical-documents')
      .getPublicUrl(filePath);
    
    // Update the treatment_auth record with the PCS form URL
    const { data, error: updateError } = await supabase
      .from('treatment_auth')
      .update({ pcs_form_url: urlData.publicUrl })
      .eq('id', treatmentAuthId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating treatment auth with PCS form URL:', updateError);
      toast.error('Failed to update authorization with PCS form');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: "task",
      description: `PCS form uploaded for treatment authorization`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: data.patientcase_id,
    });
    
    toast.success('PCS form uploaded successfully');
    return data;
  } catch (error) {
    console.error('Exception when uploading PCS form:', error);
    toast.error('Failed to upload PCS form');
    return null;
  }
}

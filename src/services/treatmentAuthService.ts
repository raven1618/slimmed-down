import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { TreatmentAuth, AuthStatus } from "@/types/medicalTransport";
import { createActivity } from "./activityService";

export async function fetchTreatmentAuths() {
  try {
    const { data, error } = await supabase
      .from('treatment_auth')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          patient_hash,
          origin_facility(name),
          destination_facility(name)
        )
      `)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching treatment auths:', error);
      toast.error('Failed to load treatment authorizations');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching treatment auths:', error);
    toast.error('Failed to load treatment authorizations');
    return [];
  }
}

export async function fetchTreatmentAuthById(id: string) {
  try {
    const { data, error } = await supabase
      .from('treatment_auth')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          patient_hash,
          origin_facility(name),
          destination_facility(name)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching treatment auth:', error);
      toast.error('Failed to load treatment authorization details');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching treatment auth:', error);
    toast.error('Failed to load treatment authorization details');
    return null;
  }
}

export async function fetchTreatmentAuthByPatientCase(patientCaseId: string) {
  try {
    const { data, error } = await supabase
      .from('treatment_auth')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          patient_hash
        )
      `)
      .eq('patientcase_id', patientCaseId)
      .single();
    
    if (error) {
      console.error('Error fetching treatment auth for patient case:', error);
      toast.error('Failed to load treatment authorization');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching treatment auth for patient case:', error);
    toast.error('Failed to load treatment authorization');
    return null;
  }
}

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
      type: 'treatment_auth',
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
      type: 'treatment_auth',
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

export async function fetchPendingAuthorizations() {
  try {
    const { data, error } = await supabase
      .from('treatment_auth')
      .select(`
        *,
        patientcase:patientcase_id(
          id,
          priority,
          status,
          patient_hash,
          origin_facility(name),
          destination_facility(name)
        )
      `)
      .eq('status', 'Pending')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pending authorizations:', error);
      toast.error('Failed to load pending authorizations');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching pending authorizations:', error);
    toast.error('Failed to load pending authorizations');
    return [];
  }
}

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
      type: 'treatment_auth',
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

// When creating an activity for a new authorization
export async function createAuthorizationActivity(authId: string, description: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        related_id: authId,
        description,
        type: "task", // Changed from "treatment_auth" to "task"
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error creating authorization activity:', error);
      toast.error('Failed to create authorization activity');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when creating authorization activity:', error);
    toast.error('Failed to create authorization activity');
    return null;
  }
}

// When updating an existing authorization
export async function updateAuthorizationActivity(authId: string, description: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        related_id: authId,
        description,
        type: "task", // Changed from "treatment_auth" to "task"
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error updating authorization activity:', error);
      toast.error('Failed to update authorization activity');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when updating authorization activity:', error);
    toast.error('Failed to update authorization activity');
    return null;
  }
}

// When an authorization is denied or rejected
export async function denyAuthorizationActivity(authId: string, reason: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        related_id: authId,
        description: `Authorization denied: ${reason}`,
        type: "task", // Changed from "treatment_auth" to "task"
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error denying authorization activity:', error);
      toast.error('Failed to deny authorization activity');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when denying authorization activity:', error);
    toast.error('Failed to deny authorization activity');
    return null;
  }
}

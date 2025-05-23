
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export async function createAuthorizationActivity(authId: string, description: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        related_id: authId,
        description,
        type: "task",
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

export async function updateAuthorizationActivity(authId: string, description: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        related_id: authId,
        description,
        type: "task",
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

export async function denyAuthorizationActivity(authId: string, reason: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        related_id: authId,
        description: `Authorization denied: ${reason}`,
        type: "task",
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


import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Activity } from "@/data/sampleData";

export async function fetchActivities() {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception when fetching activities:', error);
    toast.error('Failed to load activities');
    return [];
  }
}

export async function createActivity(activity: Omit<Activity, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        type: activity.type,
        description: activity.description,
        timestamp: activity.timestamp || new Date().toISOString(),
        user_name: activity.user,
        related_to: activity.relatedTo,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating activity:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when creating activity:', error);
    return null;
  }
}

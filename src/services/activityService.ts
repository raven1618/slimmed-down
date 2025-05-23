
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

export async function fetchActivitiesByType(type: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('type', type)
      .order('timestamp', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error(`Error fetching ${type} activities:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Exception when fetching ${type} activities:`, error);
    return [];
  }
}

export async function fetchActivitiesByEntity(entityType: string, entityId: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('type', entityType)
      .eq('related_to', entityId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error(`Error fetching activities for ${entityType} ${entityId}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Exception when fetching activities for ${entityType} ${entityId}:`, error);
    return [];
  }
}

export async function fetchRecentActivities(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception when fetching recent activities:', error);
    return [];
  }
}

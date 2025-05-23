
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { CrewMember } from "@/types/medicalTransport";
import { createActivity } from "./activityService";

export async function fetchCrewMembers() {
  try {
    const { data, error } = await supabase
      .from('crewmember')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching crew members:', error);
      toast.error('Failed to load crew members');
      return [];
    }
    
    return data as CrewMember[];
  } catch (error) {
    console.error('Exception when fetching crew members:', error);
    toast.error('Failed to load crew members');
    return [];
  }
}

export async function fetchCrewMemberById(id: string) {
  try {
    const { data, error } = await supabase
      .from('crewmember')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching crew member:', error);
      toast.error('Failed to load crew member details');
      return null;
    }
    
    return data as CrewMember;
  } catch (error) {
    console.error('Exception when fetching crew member:', error);
    toast.error('Failed to load crew member details');
    return null;
  }
}

export async function createCrewMember(crewMember: Omit<CrewMember, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('crewmember')
      .insert(crewMember)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating crew member:', error);
      toast.error('Failed to create crew member');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'crewmember',
      description: `New crew member created: ${crewMember.full_name}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: crewMember.full_name || '',
    });
    
    toast.success('Crew member created successfully');
    return data as CrewMember;
  } catch (error) {
    console.error('Exception when creating crew member:', error);
    toast.error('Failed to create crew member');
    return null;
  }
}

export async function updateCrewMember(id: string, crewMember: Partial<CrewMember>) {
  try {
    const { data, error } = await supabase
      .from('crewmember')
      .update(crewMember)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating crew member:', error);
      toast.error('Failed to update crew member');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'crewmember',
      description: `Crew member updated: ${crewMember.full_name || data.full_name}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: crewMember.full_name || data.full_name || '',
    });
    
    toast.success('Crew member updated successfully');
    return data as CrewMember;
  } catch (error) {
    console.error('Exception when updating crew member:', error);
    toast.error('Failed to update crew member');
    return null;
  }
}

export async function deleteCrewMember(id: string) {
  try {
    // First, get the crew member to be deleted for logging
    const { data: crewMemberToDelete } = await supabase
      .from('crewmember')
      .select('*')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('crewmember')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting crew member:', error);
      toast.error('Failed to delete crew member');
      return false;
    }
    
    // Log activity if we got the crew member data
    if (crewMemberToDelete) {
      await createActivity({
        type: 'crewmember',
        description: `Crew member deleted: ${crewMemberToDelete.full_name}`,
        timestamp: new Date().toISOString(),
        user: 'System',
        relatedTo: crewMemberToDelete.full_name || '',
      });
    }
    
    toast.success('Crew member deleted successfully');
    return true;
  } catch (error) {
    console.error('Exception when deleting crew member:', error);
    toast.error('Failed to delete crew member');
    return false;
  }
}

export async function fetchCrewMembersByRole(role: string) {
  try {
    const { data, error } = await supabase
      .from('crewmember')
      .select('*')
      .eq('role', role)
      .order('full_name');
    
    if (error) {
      console.error('Error fetching crew members by role:', error);
      toast.error('Failed to load crew members');
      return [];
    }
    
    return data as CrewMember[];
  } catch (error) {
    console.error('Exception when fetching crew members by role:', error);
    toast.error('Failed to load crew members');
    return [];
  }
}

export async function checkForExpiringCertifications() {
  try {
    const { data, error } = await supabase
      .from('crewmember')
      .select('id, full_name, cert_expirations')
      .order('full_name');
    
    if (error) {
      console.error('Error checking for expiring certifications:', error);
      return [];
    }
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    // Filter crew members with certifications that expire within 30 days
    return (data as CrewMember[]).filter(crew => {
      if (!crew.cert_expirations) return false;
      
      // Check each certification expiration date
      for (const [certName, expirationDate] of Object.entries(crew.cert_expirations)) {
        const expDate = new Date(expirationDate as string);
        if (expDate <= thirtyDaysFromNow) {
          return true;
        }
      }
      
      return false;
    });
  } catch (error) {
    console.error('Exception when checking for expiring certifications:', error);
    return [];
  }
}

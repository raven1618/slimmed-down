
import { supabase } from '@/integrations/supabase/client';
import { CrewMember } from '@/types/medicalTransport';

/**
 * Get all crew members
 */
export const getCrewMembers = async (): Promise<CrewMember[]> => {
  const { data, error } = await supabase
    .from('crewmember')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching crew members:', error);
    throw error;
  }

  return data as CrewMember[];
};

/**
 * Get a crew member by ID
 */
export const getCrewMemberById = async (id: string): Promise<CrewMember> => {
  const { data, error } = await supabase
    .from('crewmember')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching crew member ${id}:`, error);
    throw error;
  }

  return data as CrewMember;
};

/**
 * Create a new crew member
 */
export const createCrewMember = async (crewMember: Partial<CrewMember>): Promise<CrewMember> => {
  const { data, error } = await supabase
    .from('crewmember')
    .insert(crewMember)
    .select()
    .single();

  if (error) {
    console.error('Error creating crew member:', error);
    throw error;
  }

  // Log the action
  await supabase
    .from('interactionlog')
    .insert({
      entity: 'crew',
      entity_id: data.id,
      verb: 'created',
      channel: 'system',
      note: `Crew member ${data.full_name} created`
    });

  return data as CrewMember;
};

/**
 * Update an existing crew member
 */
export const updateCrewMember = async (id: string, crewMember: Partial<CrewMember>): Promise<CrewMember> => {
  const { data, error } = await supabase
    .from('crewmember')
    .update(crewMember)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating crew member ${id}:`, error);
    throw error;
  }

  // Log the action
  await supabase
    .from('interactionlog')
    .insert({
      entity: 'crew',
      entity_id: data.id,
      verb: 'updated',
      channel: 'system',
      note: `Crew member ${data.full_name} updated`
    });

  return data as CrewMember;
};

/**
 * Delete a crew member
 */
export const deleteCrewMember = async (id: string): Promise<void> => {
  // First get the crew member to log the deletion
  const { data: crewMember } = await supabase
    .from('crewmember')
    .select('*')
    .eq('id', id)
    .single();

  // Delete the crew member
  const { error } = await supabase
    .from('crewmember')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting crew member ${id}:`, error);
    throw error;
  }

  // Log the action
  if (crewMember) {
    await supabase
      .from('interactionlog')
      .insert({
        entity: 'crew',
        entity_id: id,
        verb: 'deleted',
        channel: 'system',
        note: `Crew member ${crewMember.full_name} deleted`
      });
  }
};


import { supabase } from '@/integrations/supabase/client';
import { Facility } from '@/types/medicalTransport';

/**
 * Get all facilities
 */
export const getFacilities = async (): Promise<Facility[]> => {
  const { data, error } = await supabase
    .from('facility')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching facilities:', error);
    throw error;
  }

  return data as Facility[];
};

/**
 * Get a facility by ID
 */
export const getFacilityById = async (id: string): Promise<Facility> => {
  const { data, error } = await supabase
    .from('facility')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching facility ${id}:`, error);
    throw error;
  }

  return data as Facility;
};

/**
 * Create a new facility
 */
export const createFacility = async (facility: Partial<Facility>): Promise<Facility> => {
  const { data, error } = await supabase
    .from('facility')
    .insert(facility)
    .select()
    .single();

  if (error) {
    console.error('Error creating facility:', error);
    throw error;
  }

  // Log the action
  await supabase
    .from('interactionlog')
    .insert({
      entity: 'facility',
      entity_id: data.id,
      verb: 'created',
      channel: 'system',
      note: `Facility ${data.name} created`
    });

  return data as Facility;
};

/**
 * Update an existing facility
 */
export const updateFacility = async (id: string, facility: Partial<Facility>): Promise<Facility> => {
  const { data, error } = await supabase
    .from('facility')
    .update(facility)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating facility ${id}:`, error);
    throw error;
  }

  // Log the action
  await supabase
    .from('interactionlog')
    .insert({
      entity: 'facility',
      entity_id: data.id,
      verb: 'updated',
      channel: 'system',
      note: `Facility ${data.name} updated`
    });

  return data as Facility;
};

/**
 * Delete a facility
 */
export const deleteFacility = async (id: string): Promise<void> => {
  // First get the facility to log the deletion
  const { data: facility } = await supabase
    .from('facility')
    .select('*')
    .eq('id', id)
    .single();

  // Delete the facility
  const { error } = await supabase
    .from('facility')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting facility ${id}:`, error);
    throw error;
  }

  // Log the action
  if (facility) {
    await supabase
      .from('interactionlog')
      .insert({
        entity: 'facility',
        entity_id: id,
        verb: 'deleted',
        channel: 'system',
        note: `Facility ${facility.name} deleted`
      });
  }
};


import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Deal } from "@/data/sampleData";
import { createActivity } from "./activityService";

// Helper function to convert from database format to our interface format
const mapDealFromDB = (deal: any): Deal => ({
  id: deal.id,
  name: deal.name,
  company: deal.company,
  value: deal.value,
  stage: deal.stage as Deal['stage'],
  owner: deal.owner || '',
  createdAt: deal.created_at,
});

export async function fetchDeals() {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to load deals');
      return [];
    }
    
    // Map the database format to our interface format
    return (data || []).map(mapDealFromDB);
  } catch (error) {
    console.error('Exception when fetching deals:', error);
    toast.error('Failed to load deals');
    return [];
  }
}

export async function createDeal(deal: Omit<Deal, 'id' | 'createdAt'>) {
  try {
    // Convert from our interface format to database format
    const newDeal = {
      name: deal.name,
      company: deal.company,
      value: deal.value,
      stage: deal.stage,
      owner: deal.owner,
    };

    const { data, error } = await supabase
      .from('deals')
      .insert(newDeal)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'deal',
      description: `New deal created: ${deal.name}`,
      timestamp: new Date().toISOString(),
      user: deal.owner || 'System',
      relatedTo: deal.company,
    });
    
    toast.success('Deal created successfully');
    return mapDealFromDB(data);
  } catch (error) {
    console.error('Exception when creating deal:', error);
    toast.error('Failed to create deal');
    return null;
  }
}

export async function updateDeal(id: string, deal: Partial<Deal>) {
  try {
    // Convert from our interface format to database format
    const updateData: any = {};
    if (deal.name) updateData.name = deal.name;
    if (deal.company) updateData.company = deal.company;
    if (deal.value !== undefined) updateData.value = deal.value;
    if (deal.stage) updateData.stage = deal.stage;
    if (deal.owner) updateData.owner = deal.owner;

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'deal',
      description: `Deal updated: ${deal.name || data.name}`,
      timestamp: new Date().toISOString(),
      user: deal.owner || data.owner || 'System',
      relatedTo: deal.company || data.company,
    });
    
    toast.success('Deal updated successfully');
    return mapDealFromDB(data);
  } catch (error) {
    console.error('Exception when updating deal:', error);
    toast.error('Failed to update deal');
    return null;
  }
}

export async function deleteDeal(id: string) {
  try {
    // First, get the deal to be deleted for logging
    const { data: dealToDelete } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();
      
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
      return false;
    }
    
    // Log activity if we got the deal data
    if (dealToDelete) {
      await createActivity({
        type: 'deal',
        description: `Deal deleted: ${dealToDelete.name}`,
        timestamp: new Date().toISOString(),
        user: dealToDelete.owner || 'System',
        relatedTo: dealToDelete.company,
      });
    }
    
    toast.success('Deal deleted successfully');
    return true;
  } catch (error) {
    console.error('Exception when deleting deal:', error);
    toast.error('Failed to delete deal');
    return false;
  }
}

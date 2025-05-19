
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Deal } from "@/data/sampleData";

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
    
    return data || [];
  } catch (error) {
    console.error('Exception when fetching deals:', error);
    toast.error('Failed to load deals');
    return [];
  }
}

export async function createDeal(deal: Omit<Deal, 'id' | 'createdAt'>) {
  try {
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
    
    toast.success('Deal created successfully');
    return data;
  } catch (error) {
    console.error('Exception when creating deal:', error);
    toast.error('Failed to create deal');
    return null;
  }
}

export async function updateDeal(id: string, deal: Partial<Deal>) {
  try {
    const { data, error } = await supabase
      .from('deals')
      .update(deal)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal');
      return null;
    }
    
    toast.success('Deal updated successfully');
    return data;
  } catch (error) {
    console.error('Exception when updating deal:', error);
    toast.error('Failed to update deal');
    return null;
  }
}

export async function deleteDeal(id: string) {
  try {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
      return false;
    }
    
    toast.success('Deal deleted successfully');
    return true;
  } catch (error) {
    console.error('Exception when deleting deal:', error);
    toast.error('Failed to delete deal');
    return false;
  }
}

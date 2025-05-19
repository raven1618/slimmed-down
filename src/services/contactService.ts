
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Contact } from "@/data/sampleData";

export async function fetchContacts() {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception when fetching contacts:', error);
    toast.error('Failed to load contacts');
    return [];
  }
}

export async function createContact(contact: Omit<Contact, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact');
      return null;
    }
    
    toast.success('Contact created successfully');
    return data;
  } catch (error) {
    console.error('Exception when creating contact:', error);
    toast.error('Failed to create contact');
    return null;
  }
}

export async function updateContact(id: string, contact: Partial<Contact>) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
      return null;
    }
    
    toast.success('Contact updated successfully');
    return data;
  } catch (error) {
    console.error('Exception when updating contact:', error);
    toast.error('Failed to update contact');
    return null;
  }
}

export async function deleteContact(id: string) {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
      return false;
    }
    
    toast.success('Contact deleted successfully');
    return true;
  } catch (error) {
    console.error('Exception when deleting contact:', error);
    toast.error('Failed to delete contact');
    return false;
  }
}

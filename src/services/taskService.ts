
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Task } from "@/data/sampleData";

export async function fetchTasks() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception when fetching tasks:', error);
    toast.error('Failed to load tasks');
    return [];
  }
}

export async function createTask(task: Omit<Task, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      return null;
    }
    
    toast.success('Task created successfully');
    return data;
  } catch (error) {
    console.error('Exception when creating task:', error);
    toast.error('Failed to create task');
    return null;
  }
}

export async function updateTask(id: string, task: Partial<Task>) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(task)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return null;
    }
    
    toast.success('Task updated successfully');
    return data;
  } catch (error) {
    console.error('Exception when updating task:', error);
    toast.error('Failed to update task');
    return null;
  }
}

export async function toggleTaskCompletion(id: string, completed: boolean) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error toggling task completion:', error);
      toast.error('Failed to update task');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when toggling task completion:', error);
    toast.error('Failed to update task');
    return null;
  }
}

export async function deleteTask(id: string) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return false;
    }
    
    toast.success('Task deleted successfully');
    return true;
  } catch (error) {
    console.error('Exception when deleting task:', error);
    toast.error('Failed to delete task');
    return false;
  }
}

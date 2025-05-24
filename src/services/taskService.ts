
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Task } from "@/data/sampleData";
import { createActivity } from "./activityService";

// Helper function to convert from database format to our interface format
const mapTaskFromDB = (task: any): Task => ({
  id: task.id,
  title: task.title,
  related: task.related || '',
  dueDate: task.due_date,
  priority: task.priority as Task['priority'],
  completed: task.completed || false,
  category: task.category || 'transport' as Task['category'],
});

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
    
    return (data || []).map(mapTaskFromDB);
  } catch (error) {
    console.error('Exception when fetching tasks:', error);
    toast.error('Failed to load tasks');
    return [];
  }
}

export async function createTask(task: Omit<Task, 'id'>) {
  try {
    // Convert from our interface format to database format
    const newTask = {
      title: task.title,
      related: task.related,
      due_date: task.dueDate, // Convert camelCase to snake_case
      priority: task.priority,
      completed: task.completed,
      category: task.category,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'task',
      description: `New ${task.category} task created: ${task.title}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: task.related,
    });
    
    toast.success('Task created successfully');
    return mapTaskFromDB(data);
  } catch (error) {
    console.error('Exception when creating task:', error);
    toast.error('Failed to create task');
    return null;
  }
}

export async function updateTask(id: string, task: Partial<Task>) {
  try {
    // Convert from our interface format to database format
    const updateData: any = {};
    if (task.title) updateData.title = task.title;
    if (task.related !== undefined) updateData.related = task.related;
    if (task.dueDate) updateData.due_date = task.dueDate; // Convert camelCase to snake_case
    if (task.priority) updateData.priority = task.priority;
    if (task.completed !== undefined) updateData.completed = task.completed;
    if (task.category) updateData.category = task.category;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return null;
    }
    
    // Log activity
    await createActivity({
      type: 'task',
      description: `${task.category || 'Task'} updated: ${task.title || data.title}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: task.related || data.related,
    });
    
    toast.success('Task updated successfully');
    return mapTaskFromDB(data);
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
    
    // Log activity
    await createActivity({
      type: 'task',
      description: `Task marked as ${completed ? 'completed' : 'incomplete'}: ${data.title}`,
      timestamp: new Date().toISOString(),
      user: 'System',
      relatedTo: data.related,
    });
    
    return mapTaskFromDB(data);
  } catch (error) {
    console.error('Exception when toggling task completion:', error);
    toast.error('Failed to update task');
    return null;
  }
}

export async function deleteTask(id: string) {
  try {
    // First, get the task to be deleted for logging
    const { data: taskToDelete } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
      
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return false;
    }
    
    // Log activity if we got the task data
    if (taskToDelete) {
      await createActivity({
        type: 'task',
        description: `Task deleted: ${taskToDelete.title}`,
        timestamp: new Date().toISOString(),
        user: 'System',
        relatedTo: taskToDelete.related,
      });
    }
    
    toast.success('Task deleted successfully');
    return true;
  } catch (error) {
    console.error('Exception when deleting task:', error);
    toast.error('Failed to delete task');
    return false;
  }
}

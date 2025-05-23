
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { UserProfile } from "@/types/medicalTransport";

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Error signing in:', error.message);
      toast.error(error.message);
      return { user: null, error: error.message };
    }
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Exception during sign in:', error);
    toast.error('An unexpected error occurred during sign in');
    return { user: null, error: 'An unexpected error occurred' };
  }
}

// Sign in with magic link
export async function signInWithMagicLink(email: string) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('Error sending magic link:', error.message);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
    
    toast.success('Check your email for the magic link');
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception during magic link sign in:', error);
    toast.error('An unexpected error occurred');
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error.message);
      toast.error(error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception during sign out:', error);
    toast.error('An unexpected error occurred during sign out');
    return false;
  }
}

// Register a new user
export async function registerUser(email: string, password: string, userData: Partial<UserProfile>) {
  try {
    // Register the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name
        }
      }
    });
    
    if (error) {
      console.error('Error registering:', error.message);
      toast.error(error.message);
      return { user: null, error: error.message };
    }
    
    if (data.user) {
      // Create a profile for the user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: userData.full_name,
          role: userData.role || 'client', // Default to client role
          facility_id: userData.facility_id,
          avatar_url: userData.avatar_url
        });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        // We don't return an error here since the user was created successfully
        toast.error('User created but profile setup incomplete');
      }
    }
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Exception during registration:', error);
    toast.error('An unexpected error occurred during registration');
    return { user: null, error: 'An unexpected error occurred' };
  }
}

// Reset password
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error('Error resetting password:', error.message);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
    
    toast.success('Check your email for the password reset link');
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception during password reset:', error);
    toast.error('An unexpected error occurred');
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Error updating password:', error.message);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
    
    toast.success('Password updated successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception during password update:', error);
    toast.error('An unexpected error occurred');
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get the current user
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Exception getting current user:', error);
    return null;
  }
}

// Get user profile
export async function getUserProfile(userId?: string) {
  try {
    // If no userId is provided, get the current user's id
    let id = userId;
    if (!id) {
      const { data } = await supabase.auth.getUser();
      id = data.user?.id;
    }
    
    if (!id) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        facility:facility_id(name, type)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error getting user profile:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception getting user profile:', error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(profile: Partial<UserProfile>) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      toast.error('Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error.message);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
    
    // If updating name, also update auth metadata
    if (profile.full_name) {
      await supabase.auth.updateUser({
        data: { full_name: profile.full_name }
      });
    }
    
    toast.success('Profile updated successfully');
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception updating user profile:', error);
    toast.error('An unexpected error occurred');
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Update avatar
export async function updateUserAvatar(file: File) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      toast.error('Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('profiles')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      toast.error('Failed to upload avatar');
      return { success: false, error: uploadError.message };
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase
      .storage
      .from('profiles')
      .getPublicUrl(filePath);
    
    // Update the user's profile with the avatar URL
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating profile with avatar:', updateError);
      toast.error('Failed to update profile with avatar');
      return { success: false, error: updateError.message };
    }
    
    toast.success('Avatar updated successfully');
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception updating user avatar:', error);
    toast.error('An unexpected error occurred');
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get session
export function getSession() {
  return supabase.auth.getSession();
}

// Subscribe to auth changes
export function onAuthStateChange(callback: (event: any, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

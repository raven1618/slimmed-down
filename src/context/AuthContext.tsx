
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/medicalTransport';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // For now, create a mock profile to avoid database issues
        if (session?.user) {
          const mockProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            role: 'admin',
            full_name: session.user.user_metadata?.full_name || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(mockProfile);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Create mock profile for signed in user
          const mockProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            role: 'admin',
            full_name: session.user.user_metadata?.full_name || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(mockProfile);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      // For now, just update the mock profile
      const mockProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        role: 'admin',
        full_name: user.user_metadata?.full_name || 'User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(mockProfile);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

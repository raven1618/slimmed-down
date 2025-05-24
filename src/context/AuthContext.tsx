
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

// Check if we're in demo mode (localhost or demo environment)
const isDemoMode = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname.includes('demo') ||
         window.location.search.includes('demo=true');
};

// Create mock user and session for demo
const createMockSession = (): { session: Session; user: User; profile: UserProfile } => {
  const mockUser: User = {
    id: 'demo-user-123',
    email: 'demo@medicaltransport.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {
      full_name: 'Demo User'
    }
  } as User;

  const mockSession: Session = {
    access_token: 'demo-token',
    refresh_token: 'demo-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: mockUser
  } as Session;

  const mockProfile: UserProfile = {
    id: 'demo-user-123',
    email: 'demo@medicaltransport.com',
    role: 'admin',
    full_name: 'Demo User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return { session: mockSession, user: mockUser, profile: mockProfile };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // If demo mode, use mock data immediately
    if (isDemoMode()) {
      const { session: mockSession, user: mockUser, profile: mockProfile } = createMockSession();
      if (mounted) {
        console.log('Demo mode detected - using mock authentication');
        setSession(mockSession);
        setUser(mockUser);
        setProfile(mockProfile);
        setLoading(false);
      }
      return;
    }

    // Original authentication logic for production
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
    if (isDemoMode()) {
      // In demo mode, just clear the mock data
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }

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

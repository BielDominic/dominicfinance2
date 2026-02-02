import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'user';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface UserPermission {
  section_key: string;
  can_view: boolean;
  can_edit: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  permissions: UserPermission[];
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (username: string, email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (sectionKey: string, action: 'view' | 'edit') => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin email defined in the system
const ADMIN_EMAIL = 'gabrielenrique817@gmail.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = role === 'admin';

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  // Fetch user role
  const fetchRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching role:', error);
        return null;
      }
      return data?.role as AppRole | null;
    } catch (error) {
      console.error('Error fetching role:', error);
      return null;
    }
  }, []);

  // Fetch user permissions
  const fetchPermissions = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('section_key, can_view, can_edit')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }
      return data as UserPermission[];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  }, []);

  // Refresh permissions (can be called after admin updates)
  const refreshPermissions = useCallback(async () => {
    if (user) {
      const newPermissions = await fetchPermissions(user.id);
      setPermissions(newPermissions);
    }
  }, [user, fetchPermissions]);

  // Check if user has permission for a section
  const hasPermission = useCallback((sectionKey: string, action: 'view' | 'edit'): boolean => {
    // Admins have full access
    if (role === 'admin') return true;
    
    const permission = permissions.find(p => p.section_key === sectionKey);
    if (!permission) return false;
    
    return action === 'view' ? permission.can_view : permission.can_edit;
  }, [role, permissions]);

  // Sign in with username and password
  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const normalizedUsername = username.toLowerCase().trim();

      // Lookup email via backend function (avoids RLS issues pre-auth)
      const { data: lookupData, error: lookupError } = await supabase.functions.invoke('username-email-lookup', {
        body: { username: normalizedUsername },
      });

      if (lookupError || !lookupData?.email) {
        // Do not reveal whether username exists
        return { error: new Error('Credenciais inválidas') };
      }

      const email = String(lookupData.email);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return { error: new Error('Credenciais inválidas') };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  }, []);

  // Sign up with username, email and password
  const signUp = useCallback(async (username: string, email: string, password: string, displayName?: string) => {
    try {
      // Check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

      if (existingProfile) {
        return { error: new Error('Este nome de usuário já está em uso') };
      }

      // Check if this is the admin email
      const isAdminEmail = email.toLowerCase() === 'gabrielenrique817@gmail.com';

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: username.toLowerCase(),
            display_name: displayName || username,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: new Error('Este email já está cadastrado') };
        }
        return { error };
      }

      if (data.user) {
        // Create profile with email
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            username: username.toLowerCase(),
            display_name: displayName || username,
            email: email.toLowerCase(),
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // Assign role (admin for specific user, else user)
        const userRole: AppRole = isAdminEmail ? 'admin' : 'user';
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: userRole,
          });

        if (roleError) {
          console.error('Error assigning role:', roleError);
        }

        // If user (not admin), create default permissions
        if (userRole === 'user') {
          const defaultSections = ['entradas', 'despesas', 'investimentos', 'resumo', 'dashboard', 'assistente'];
          const permissionsToInsert = defaultSections.map(section => ({
            user_id: data.user!.id,
            section_key: section,
            can_view: true,
            can_edit: true,
          }));

          await supabase.from('user_permissions').insert(permissionsToInsert);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setPermissions([]);
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Defer Supabase calls to avoid deadlock
          setTimeout(async () => {
            const [profileData, roleData, permissionsData] = await Promise.all([
              fetchProfile(currentSession.user.id),
              fetchRole(currentSession.user.id),
              fetchPermissions(currentSession.user.id),
            ]);

            setProfile(profileData);
            setRole(roleData);
            setPermissions(permissionsData);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setPermissions([]);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        const [profileData, roleData, permissionsData] = await Promise.all([
          fetchProfile(existingSession.user.id),
          fetchRole(existingSession.user.id),
          fetchPermissions(existingSession.user.id),
        ]);

        setProfile(profileData);
        setRole(roleData);
        setPermissions(permissionsData);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchRole, fetchPermissions]);

  // Subscribe to realtime permission changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_permissions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_permissions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        refreshPermissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshPermissions]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    permissions,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    hasPermission,
    refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

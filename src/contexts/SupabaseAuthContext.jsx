import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);

        // If profile doesn't exist, try to create one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              role: 'member',
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            toast({
              variant: "destructive",
              title: "Profile Setup Failed",
              description: "Could not create user profile. Please contact support.",
            });
            return null;
          }

          return newProfile;
        }

        // Handle database connection errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Unable to connect to database. Please check your internet connection.",
          });
        }

        return null;
      }

      if (data && !data.role) {
        data.role = 'member';
      }

      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      return null;
    }
  }, [toast]);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    
    if (currentUser) {
      const userProfile = await fetchProfile(currentUser.id);
      setProfile(userProfile);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide more helpful error messages
        let errorMessage = error.message;

        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before signing in.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to authentication server. Please check your internet connection.';
        }

        toast({
          variant: "destructive",
          title: "Sign in Failed",
          description: errorMessage,
        });
      }

      return { error };
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: "An unexpected error occurred. Please try again.",
      });
      return { error: err };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);
  
  const updateProfile = useCallback(async (profileData) => {
    if (!user) return { error: { message: 'No user logged in' } };
    
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id);
      
    if (!error) {
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
    }
    
    return { error };
  }, [user, fetchProfile, toast]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }), [user, session, profile, loading, signUp, signIn, signOut, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

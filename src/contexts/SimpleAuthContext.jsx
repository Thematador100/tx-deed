import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

// Simple localStorage-based auth - no backend needed!
export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    const storedProfile = localStorage.getItem('auth_profile');

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const profileData = storedProfile ? JSON.parse(storedProfile) : null;

        setUser(userData);
        setSession({ user: userData });
        setProfile(profileData || {
          id: userData.id,
          email: userData.email,
          role: 'member',
          full_name: userData.email.split('@')[0]
        });
      } catch (error) {
        console.error('Error loading stored user:', error);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_profile');
      }
    }
    setLoading(false);
  }, []);

  const signUp = useCallback(async (email, password, options) => {
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      const userExists = existingUsers.find(u => u.email === email);

      if (userExists) {
        const error = { message: 'User already exists' };
        toast({
          variant: "destructive",
          title: "Sign up Failed",
          description: error.message,
        });
        return { data: null, error };
      }

      // Create new user
      const newUser = {
        id: crypto.randomUUID(),
        email,
        created_at: new Date().toISOString(),
      };

      const newProfile = {
        id: newUser.id,
        email: newUser.email,
        role: 'member',
        full_name: options?.data?.full_name || email.split('@')[0],
        company: options?.data?.company || '',
        created_at: new Date().toISOString(),
      };

      // Save to "database" (localStorage)
      existingUsers.push({ ...newUser, password }); // In real app, NEVER store password like this!
      localStorage.setItem('all_users', JSON.stringify(existingUsers));

      // Auto sign in
      setUser(newUser);
      setSession({ user: newUser });
      setProfile(newProfile);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      localStorage.setItem('auth_profile', JSON.stringify(newProfile));

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });

      return { data: { user: newUser, session: { user: newUser } }, error: null };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
      return { data: null, error };
    }
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      const foundUser = existingUsers.find(u => u.email === email && u.password === password);

      if (!foundUser) {
        const error = { message: 'Invalid email or password' };
        toast({
          variant: "destructive",
          title: "Sign in Failed",
          description: error.message,
        });
        return { error };
      }

      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        created_at: foundUser.created_at,
      };

      const userProfile = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role || 'member',
        full_name: foundUser.full_name || email.split('@')[0],
        company: foundUser.company || '',
      };

      setUser(userData);
      setSession({ user: userData });
      setProfile(userProfile);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('auth_profile', JSON.stringify(userProfile));

      toast({
        title: "Welcome back!",
        description: "You've signed in successfully.",
      });

      return { error: null };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
      return { error };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_profile');

      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });

      return { error: null };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
      return { error };
    }
  }, [toast]);

  const updateProfile = useCallback(async (profileData) => {
    if (!user) return { error: { message: 'No user logged in' } };

    try {
      const updatedProfile = { ...profile, ...profileData };
      setProfile(updatedProfile);
      localStorage.setItem('auth_profile', JSON.stringify(updatedProfile));

      // Also update in all_users
      const existingUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      const userIndex = existingUsers.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        existingUsers[userIndex] = { ...existingUsers[userIndex], ...profileData };
        localStorage.setItem('all_users', JSON.stringify(existingUsers));
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }, [user, profile, toast]);

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

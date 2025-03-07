'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogle as firebaseSignInWithGoogle, 
  signInWithEmail as firebaseSignInWithEmail, 
  createUser as firebaseCreateUser, 
  signOut as firebaseSignOut, 
  subscribeToAuthChanges 
} from '@/lib/firebase';
import { initializeUserData } from '@/lib/firestoreService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  createUser: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const user = await firebaseSignInWithGoogle();
      await initializeUserData(user);
      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      return await firebaseSignInWithEmail(email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  // Create a new user
  const createUser = async (email: string, password: string, displayName: string) => {
    try {
      const user = await firebaseCreateUser(email, password, displayName);
      await initializeUserData(user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    createUser,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
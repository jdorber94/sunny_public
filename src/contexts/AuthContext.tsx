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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
      setLoading(false);
      
      // Initialize user data in Firestore when user logs in
      if (user) {
        initializeUserData(user).catch(error => {
          console.error('Error initializing user data:', error);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Wrap Firebase auth methods to initialize user data after authentication
  const signInWithGoogle = async () => {
    const user = await firebaseSignInWithGoogle();
    await initializeUserData(user);
    return user;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const user = await firebaseSignInWithEmail(email, password);
    await initializeUserData(user);
    return user;
  };

  const createUser = async (email: string, password: string, displayName: string) => {
    const user = await firebaseCreateUser(email, password, displayName);
    await initializeUserData(user);
    return user;
  };

  const signOut = async () => {
    await firebaseSignOut();
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    createUser,
    signOut,
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
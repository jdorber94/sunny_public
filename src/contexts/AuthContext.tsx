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
import { initializeUserData, getUserProfile, subscribeToUserProfile, UserProfile } from '@/lib/firestoreService';

interface AuthContextType {
  user: (User & { isPremium?: boolean }) | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  createUser: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User & { isPremium?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((authUser) => {
      if (authUser) {
        // Initialize user data in Firestore when user logs in
        initializeUserData(authUser).catch(error => {
          console.error('Error initializing user data:', error);
        });
        
        // Subscribe to user profile to get premium status
        const profileUnsubscribe = subscribeToUserProfile(authUser.uid, (profile) => {
          if (profile) {
            setUserProfile(profile);
            // Extend the user object with isPremium property
            setUser({
              ...authUser,
              isPremium: profile.isPremium || false
            });
          } else {
            setUser(authUser);
          }
          setLoading(false);
        });
        
        return () => {
          profileUnsubscribe();
        };
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Wrap Firebase auth methods to initialize user data after authentication
  const signInWithGoogle = async () => {
    const authUser = await firebaseSignInWithGoogle();
    await initializeUserData(authUser);
    
    // Get premium status
    const profile = await getUserProfile(authUser.uid);
    if (profile) {
      setUserProfile(profile);
      // Extend the user object with isPremium property
      const userWithPremium = {
        ...authUser,
        isPremium: profile.isPremium || false
      };
      setUser(userWithPremium);
    }
    
    return authUser;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const authUser = await firebaseSignInWithEmail(email, password);
    await initializeUserData(authUser);
    
    // Get premium status
    const profile = await getUserProfile(authUser.uid);
    if (profile) {
      setUserProfile(profile);
      // Extend the user object with isPremium property
      const userWithPremium = {
        ...authUser,
        isPremium: profile.isPremium || false
      };
      setUser(userWithPremium);
    }
    
    return authUser;
  };

  const createUser = async (email: string, password: string, displayName: string) => {
    const authUser = await firebaseCreateUser(email, password, displayName);
    await initializeUserData(authUser);
    
    // New users are not premium by default
    const userWithPremium = {
      ...authUser,
      isPremium: false
    };
    setUser(userWithPremium);
    
    return authUser;
  };

  const signOut = async () => {
    await firebaseSignOut();
    setUser(null);
    setUserProfile(null);
  };
  
  // Function to upgrade user to premium
  const upgradeToPremium = async () => {
    if (!user) throw new Error('User must be logged in to upgrade to premium');
    
    try {
      // Here you would typically integrate with a payment processor
      // For now, we'll just update the user's profile
      const profile = await getUserProfile(user.uid);
      if (profile) {
        // Update the profile with premium status
        profile.isPremium = true;
        
        // Save the updated profile
        // This would typically be done through an API endpoint
        // For now, we'll just update the local state
        setUserProfile(profile);
        setUser({
          ...user,
          isPremium: true
        });
        
        return;
      }
      throw new Error('User profile not found');
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    createUser,
    signOut,
    upgradeToPremium,
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
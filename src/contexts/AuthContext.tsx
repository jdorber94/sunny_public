'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogle as firebaseSignInWithGoogle, 
  signInWithEmail as firebaseSignInWithEmail, 
  createUser as firebaseCreateUser, 
  signOut as firebaseSignOut, 
  subscribeToAuthChanges 
} from '@/services/firebase/auth';
import { db } from '@/services/firestore/config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';

// Define the UserProfile type locally
interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  isPremium?: boolean;
  level?: number;
  totalXP?: number;
  daysActive?: number;
  currentStreak?: number;
  joinDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
  preferences?: {
    notifications: boolean;
    darkMode: boolean;
    weekStartsOn: string;
  };
}

interface AuthContextType {
  user: (User & { isPremium?: boolean }) | null;
  loading: boolean;
  authLoading: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  createUser: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions to replace the old firestoreService functions
const initializeUserData = async (authUser: User): Promise<void> => {
  const userDocRef = doc(db, 'users', authUser.uid);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    // Create a new user profile if it doesn't exist
    const newProfile: UserProfile = {
      name: authUser.displayName || 'User',
      email: authUser.email || '',
      avatar: authUser.photoURL || '',
      level: 1,
      totalXP: 0,
      daysActive: 1,
      currentStreak: 1,
      joinDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        notifications: true,
        darkMode: false,
        weekStartsOn: 'monday'
      }
    };
    
    await setDoc(userDocRef, newProfile);
  }
};

const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  
  return null;
};

const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
  const userDocRef = doc(db, 'users', userId);
  
  return onSnapshot(userDocRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserProfile);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to user profile:', error);
    callback(null);
  });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User & { isPremium?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((authUser: User | null) => {
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
    authLoading: loading,
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
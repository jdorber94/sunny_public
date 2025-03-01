import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

// Types
export interface Habit {
  id: number;
  name: string;
  logs: string[];
  xp: number;
  category?: string;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  level: number;
  totalXP: number;
  daysActive: number;
  currentStreak: number;
  joinDate: string;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    weekStartsOn: 'monday' | 'sunday';
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserStats {
  totalXP: number;
  dailyXP: {
    date: string;
    xp: number;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Helper function to get user document reference
const getUserDocRef = (userId: string) => {
  return doc(db, 'users', userId);
};

// Helper function to get habits collection reference for a user
const getHabitsCollectionRef = (userId: string) => {
  return collection(db, 'users', userId, 'habits');
};

// Save user profile to Firestore
export const saveUserProfile = async (userId: string, profile: UserProfile) => {
  try {
    const userDocRef = getUserDocRef(userId);
    
    // Add timestamps
    const profileWithTimestamps = {
      ...profile,
      updatedAt: serverTimestamp()
    };
    
    // Check if document exists
    const docSnap = await getDoc(userDocRef);
    
    if (!docSnap.exists()) {
      // Create new document with createdAt timestamp
      await setDoc(userDocRef, {
        ...profileWithTimestamps,
        createdAt: serverTimestamp()
      });
    } else {
      // Update existing document
      await updateDoc(userDocRef, profileWithTimestamps);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = getUserDocRef(userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Subscribe to user profile changes
export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
  const userDocRef = getUserDocRef(userId);
  
  return onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    } else {
      callback(null);
    }
  });
};

// Save habits to Firestore
export const saveHabits = async (userId: string, habits: Habit[]) => {
  try {
    const batch = writeBatch(db);
    const habitsCollectionRef = getHabitsCollectionRef(userId);
    
    // Delete existing habits (we'll replace them all)
    const existingHabits = await getDocs(habitsCollectionRef);
    existingHabits.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Add new habits
    habits.forEach((habit) => {
      const habitDocRef = doc(habitsCollectionRef, habit.id.toString());
      batch.set(habitDocRef, {
        ...habit,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error saving habits:', error);
    return false;
  }
};

// Get habits from Firestore
export const getHabits = async (userId: string): Promise<Habit[]> => {
  try {
    const habitsCollectionRef = getHabitsCollectionRef(userId);
    const querySnapshot = await getDocs(habitsCollectionRef);
    
    const habits: Habit[] = [];
    querySnapshot.forEach((doc) => {
      habits.push(doc.data() as Habit);
    });
    
    return habits;
  } catch (error) {
    console.error('Error getting habits:', error);
    return [];
  }
};

// Subscribe to habits changes
export const subscribeToHabits = (userId: string, callback: (habits: Habit[]) => void) => {
  const habitsCollectionRef = getHabitsCollectionRef(userId);
  
  return onSnapshot(habitsCollectionRef, (querySnapshot) => {
    const habits: Habit[] = [];
    querySnapshot.forEach((doc) => {
      habits.push(doc.data() as Habit);
    });
    callback(habits);
  });
};

// Save user stats to Firestore
export const saveUserStats = async (userId: string, stats: UserStats) => {
  try {
    const statsDocRef = doc(db, 'users', userId, 'stats', 'main');
    
    // Add timestamps
    const statsWithTimestamps = {
      ...stats,
      updatedAt: serverTimestamp()
    };
    
    // Check if document exists
    const docSnap = await getDoc(statsDocRef);
    
    if (!docSnap.exists()) {
      // Create new document with createdAt timestamp
      await setDoc(statsDocRef, {
        ...statsWithTimestamps,
        createdAt: serverTimestamp()
      });
    } else {
      // Update existing document
      await updateDoc(statsDocRef, statsWithTimestamps);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user stats:', error);
    return false;
  }
};

// Get user stats from Firestore
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    const statsDocRef = doc(db, 'users', userId, 'stats', 'main');
    const docSnap = await getDoc(statsDocRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserStats;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

// Subscribe to user stats changes
export const subscribeToUserStats = (userId: string, callback: (stats: UserStats | null) => void) => {
  const statsDocRef = doc(db, 'users', userId, 'stats', 'main');
  
  return onSnapshot(statsDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserStats);
    } else {
      callback(null);
    }
  });
};

// Initialize user data in Firestore from localStorage
export const initializeUserData = async (user: User) => {
  try {
    // Check if user already has data in Firestore
    const userProfile = await getUserProfile(user.uid);
    
    if (!userProfile) {
      // User doesn't have data in Firestore yet, initialize from localStorage
      if (typeof window !== 'undefined') {
        // Get profile from localStorage
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          await saveUserProfile(user.uid, {
            ...profile,
            name: user.displayName || profile.name,
            email: user.email || profile.email,
            avatar: user.displayName ? user.displayName.charAt(0).toUpperCase() : profile.avatar
          });
        }
        
        // Get habits from localStorage
        const savedHabits = localStorage.getItem('habits');
        if (savedHabits) {
          const habits = JSON.parse(savedHabits);
          await saveHabits(user.uid, habits);
        }
        
        // Get stats from localStorage
        const savedStats = localStorage.getItem('habitStats');
        if (savedStats) {
          const stats = JSON.parse(savedStats);
          await saveUserStats(user.uid, stats);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user data:', error);
    return false;
  }
}; 
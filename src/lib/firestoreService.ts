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
  writeBatch,
  deleteDoc,
  addDoc,
  orderBy,
  limit
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

export interface HabitSet {
  id: string;
  name: string;
  description?: string;
  isPremium: boolean;
  isActive: boolean;
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
  isPremium: boolean;
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

// Helper function to get habit sets collection reference for a user
const getHabitSetsCollectionRef = (userId: string) => {
  return collection(db, 'users', userId, 'habitSets');
};

// Helper function to get habits collection reference for a specific habit set
const getHabitSetHabitsCollectionRef = (userId: string, habitSetId: string) => {
  return collection(db, 'users', userId, 'habitSets', habitSetId, 'habits');
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

// Create a new habit set
export const createHabitSet = async (userId: string, habitSet: Omit<HabitSet, 'id'>) => {
  try {
    const habitSetsCollectionRef = getHabitSetsCollectionRef(userId);
    
    // Add timestamps
    const habitSetWithTimestamps = {
      ...habitSet,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add the new habit set
    const docRef = await addDoc(habitSetsCollectionRef, habitSetWithTimestamps);
    
    return { id: docRef.id, ...habitSet };
  } catch (error) {
    console.error('Error creating habit set:', error);
    return null;
  }
};

// Get all habit sets for a user
export const getHabitSets = async (userId: string): Promise<HabitSet[]> => {
  try {
    const habitSetsCollectionRef = getHabitSetsCollectionRef(userId);
    const q = query(habitSetsCollectionRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const habitSets: HabitSet[] = [];
    querySnapshot.forEach((doc) => {
      habitSets.push({ id: doc.id, ...doc.data() } as HabitSet);
    });
    
    return habitSets;
  } catch (error) {
    console.error('Error getting habit sets:', error);
    return [];
  }
};

// Subscribe to habit sets changes
export const subscribeToHabitSets = (userId: string, callback: (habitSets: HabitSet[]) => void) => {
  const habitSetsCollectionRef = getHabitSetsCollectionRef(userId);
  const q = query(habitSetsCollectionRef, orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const habitSets: HabitSet[] = [];
    querySnapshot.forEach((doc) => {
      habitSets.push({ id: doc.id, ...doc.data() } as HabitSet);
    });
    callback(habitSets);
  });
};

// Update a habit set
export const updateHabitSet = async (userId: string, habitSetId: string, updates: Partial<HabitSet>) => {
  try {
    const habitSetDocRef = doc(db, 'users', userId, 'habitSets', habitSetId);
    
    // Add timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(habitSetDocRef, updatesWithTimestamp);
    return true;
  } catch (error) {
    console.error('Error updating habit set:', error);
    return false;
  }
};

// Delete a habit set
export const deleteHabitSet = async (userId: string, habitSetId: string) => {
  try {
    const habitSetDocRef = doc(db, 'users', userId, 'habitSets', habitSetId);
    await deleteDoc(habitSetDocRef);
    return true;
  } catch (error) {
    console.error('Error deleting habit set:', error);
    return false;
  }
};

// Set a habit set as active
export const setActiveHabitSet = async (userId: string, habitSetId: string) => {
  try {
    const batch = writeBatch(db);
    const habitSetsCollectionRef = getHabitSetsCollectionRef(userId);
    const querySnapshot = await getDocs(habitSetsCollectionRef);
    
    // Set all habit sets to inactive
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { isActive: false, updatedAt: serverTimestamp() });
    });
    
    // Set the selected habit set to active
    const habitSetDocRef = doc(db, 'users', userId, 'habitSets', habitSetId);
    batch.update(habitSetDocRef, { isActive: true, updatedAt: serverTimestamp() });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error setting active habit set:', error);
    return false;
  }
};

// Get the active habit set
export const getActiveHabitSet = async (userId: string): Promise<HabitSet | null> => {
  try {
    const habitSetsCollectionRef = getHabitSetsCollectionRef(userId);
    const q = query(habitSetsCollectionRef, where('isActive', '==', true), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as HabitSet;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting active habit set:', error);
    return null;
  }
};

// Save habits to a specific habit set
export const saveHabitsToSet = async (userId: string, habitSetId: string, habits: Habit[]) => {
  try {
    const batch = writeBatch(db);
    const habitsCollectionRef = getHabitSetHabitsCollectionRef(userId, habitSetId);
    
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
    console.error('Error saving habits to set:', error);
    return false;
  }
};

// Get habits from a specific habit set
export const getHabitsFromSet = async (userId: string, habitSetId: string): Promise<Habit[]> => {
  try {
    const habitsCollectionRef = getHabitSetHabitsCollectionRef(userId, habitSetId);
    const querySnapshot = await getDocs(habitsCollectionRef);
    
    const habits: Habit[] = [];
    querySnapshot.forEach((doc) => {
      habits.push(doc.data() as Habit);
    });
    
    return habits;
  } catch (error) {
    console.error('Error getting habits from set:', error);
    return [];
  }
};

// Subscribe to habits changes for a specific habit set
export const subscribeToHabitsInSet = (userId: string, habitSetId: string, callback: (habits: Habit[]) => void) => {
  const habitsCollectionRef = getHabitSetHabitsCollectionRef(userId, habitSetId);
  
  return onSnapshot(habitsCollectionRef, (querySnapshot) => {
    const habits: Habit[] = [];
    querySnapshot.forEach((doc) => {
      habits.push(doc.data() as Habit);
    });
    callback(habits);
  });
};

// Initialize a default habit set for a new user
export const initializeDefaultHabitSet = async (userId: string) => {
  try {
    const defaultHabitSet: Omit<HabitSet, 'id'> = {
      name: 'Default Set',
      description: 'Your first habit set',
      isPremium: false,
      isActive: true,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };
    
    const habitSet = await createHabitSet(userId, defaultHabitSet);
    return habitSet;
  } catch (error) {
    console.error('Error initializing default habit set:', error);
    return null;
  }
};

// Check if a user can create a new habit set (based on premium status)
export const canCreateHabitSet = async (userId: string): Promise<boolean> => {
  try {
    // Check if user is premium
    const userProfile = await getUserProfile(userId);
    const isPremium = userProfile?.isPremium || false;
    
    // Get current habit sets
    const habitSets = await getHabitSets(userId);
    
    // Free users can have up to 2 habit sets, premium users can have unlimited
    return isPremium || habitSets.length < 2;
  } catch (error) {
    console.error('Error checking if user can create habit set:', error);
    return false;
  }
};

// Save habits to Firestore (legacy function for backward compatibility)
export const saveHabits = async (userId: string, habits: Habit[]) => {
  try {
    // Get the active habit set
    const activeHabitSet = await getActiveHabitSet(userId);
    
    if (activeHabitSet) {
      // Save to the active habit set
      return saveHabitsToSet(userId, activeHabitSet.id, habits);
    } else {
      // Create a default habit set and save to it
      const defaultHabitSet = await initializeDefaultHabitSet(userId);
      if (defaultHabitSet) {
        return saveHabitsToSet(userId, defaultHabitSet.id, habits);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error saving habits:', error);
    return false;
  }
};

// Get habits from Firestore (legacy function for backward compatibility)
export const getHabits = async (userId: string): Promise<Habit[]> => {
  try {
    // Get the active habit set
    const activeHabitSet = await getActiveHabitSet(userId);
    
    if (activeHabitSet) {
      // Get habits from the active habit set
      return getHabitsFromSet(userId, activeHabitSet.id);
    } else {
      // Try to get habits from the legacy location
      const habitsCollectionRef = getHabitsCollectionRef(userId);
      const querySnapshot = await getDocs(habitsCollectionRef);
      
      const habits: Habit[] = [];
      querySnapshot.forEach((doc) => {
        habits.push(doc.data() as Habit);
      });
      
      return habits;
    }
  } catch (error) {
    console.error('Error getting habits:', error);
    return [];
  }
};

// Subscribe to habits changes (legacy function for backward compatibility)
export const subscribeToHabits = (userId: string, callback: (habits: Habit[]) => void) => {
  // First try to get the active habit set
  getActiveHabitSet(userId).then((activeHabitSet) => {
    if (activeHabitSet) {
      // Subscribe to habits in the active habit set
      return subscribeToHabitsInSet(userId, activeHabitSet.id, callback);
    } else {
      // Subscribe to habits in the legacy location
      const habitsCollectionRef = getHabitsCollectionRef(userId);
      return onSnapshot(habitsCollectionRef, (querySnapshot) => {
        const habits: Habit[] = [];
        querySnapshot.forEach((doc) => {
          habits.push(doc.data() as Habit);
        });
        callback(habits);
      });
    }
  });
  
  // Return a dummy unsubscribe function that will be replaced
  return () => {};
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

// Initialize user data
export const initializeUserData = async (user: User) => {
  try {
    // Check if user profile already exists
    const userProfile = await getUserProfile(user.uid);
    
    if (!userProfile) {
      // Create default profile
      const defaultProfile: UserProfile = {
        name: user.displayName || 'User',
        email: user.email || '',
        avatar: user.photoURL || '',
        level: 1,
        totalXP: 0,
        daysActive: 0,
        currentStreak: 0,
        joinDate: new Date().toISOString().split('T')[0],
        isPremium: false, // Ensure isPremium is set for all new users
        preferences: {
          notifications: true,
          darkMode: false,
          weekStartsOn: 'monday'
        }
      };
      
      // Save profile
      await saveUserProfile(user.uid, defaultProfile);
      
      // Initialize default habit set
      await initializeDefaultHabitSet(user.uid);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user data:', error);
    return false;
  }
}; 
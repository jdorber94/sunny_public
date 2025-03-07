import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  getDocs,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

// Types
export interface Habit {
  id: string;
  name: string;
  logs: string[];
  xp: number;
  streak?: number;
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

// Save user profile to Firestore
export const saveUserProfile = async (userId: string, profile: UserProfile) => {
  try {
    const userDocRef = getUserDocRef(userId);
    
    // Add timestamps
    const profileWithTimestamps = {
      ...profile,
      updatedAt: serverTimestamp(),
      createdAt: profile.createdAt || serverTimestamp()
    };
    
    await setDoc(userDocRef, profileWithTimestamps, { merge: true });
    console.log('User profile saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { success: false, error };
  }
};

// Get user profile from Firestore
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = getUserDocRef(userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
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
  
  return onSnapshot(userDocRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserProfile);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to user profile:', error);
    callback(null);
  });
};

// Save habits to Firestore
export const saveHabits = async (userId: string, habits: Habit[]) => {
  try {
    for (const habit of habits) {
      const habitRef = doc(getHabitsCollectionRef(userId), habit.id);
      
      // Add timestamps
      const habitWithTimestamps = {
        ...habit,
        updatedAt: serverTimestamp(),
        createdAt: habit.createdAt || serverTimestamp()
      };
      
      await setDoc(habitRef, habitWithTimestamps);
    }
    
    console.log(`${habits.length} habits saved successfully`);
    return { success: true };
  } catch (error) {
    console.error('Error saving habits:', error);
    return { success: false, error };
  }
};

// Create a new habit
export const createHabit = async (userId: string, habit: Omit<Habit, 'id'>) => {
  try {
    const habitsCollectionRef = getHabitsCollectionRef(userId);
    
    // Add timestamps
    const habitWithTimestamps = {
      ...habit,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(habitsCollectionRef, habitWithTimestamps);
    
    // Return the created habit with its ID
    return { 
      success: true, 
      habit: { 
        id: docRef.id, 
        ...habit 
      } 
    };
  } catch (error) {
    console.error('Error creating habit:', error);
    return { success: false, error };
  }
};

// Update an existing habit
export const updateHabit = async (userId: string, habitId: string, updates: Partial<Habit>) => {
  try {
    const habitRef = doc(getHabitsCollectionRef(userId), habitId);
    
    // Add timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(habitRef, updatesWithTimestamp);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating habit:', error);
    return { success: false, error };
  }
};

// Delete a habit
export const deleteHabit = async (userId: string, habitId: string) => {
  try {
    const habitRef = doc(getHabitsCollectionRef(userId), habitId);
    await deleteDoc(habitRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting habit:', error);
    return { success: false, error };
  }
};

// Get all habits for a user
export const getHabits = async (userId: string): Promise<Habit[]> => {
  try {
    const habitsCollectionRef = getHabitsCollectionRef(userId);
    const querySnapshot = await getDocs(habitsCollectionRef);
    
    const habits: Habit[] = [];
    querySnapshot.forEach((doc) => {
      habits.push({ id: doc.id, ...doc.data() } as Habit);
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
      habits.push({ id: doc.id, ...doc.data() } as Habit);
    });
    
    callback(habits);
  }, (error) => {
    console.error('Error subscribing to habits:', error);
    callback([]);
  });
};

// Log a habit completion
export const logHabitCompletion = async (userId: string, habitId: string, date: string) => {
  try {
    const habitRef = doc(getHabitsCollectionRef(userId), habitId);
    const habitDoc = await getDoc(habitRef);
    
    if (!habitDoc.exists()) {
      return { success: false, error: 'Habit not found' };
    }
    
    const habit = habitDoc.data() as Habit;
    const logs = habit.logs || [];
    
    // Check if already logged for this date
    if (logs.includes(date)) {
      return { success: false, error: 'Habit already logged for this date' };
    }
    
    // Add the date to logs
    const updatedLogs = [...logs, date];
    
    // Calculate streak
    const sortedDates = [...updatedLogs].sort();
    let streak = 1;
    const today = new Date().toISOString().split('T')[0];
    
    if (sortedDates.length > 0 && sortedDates[sortedDates.length - 1] === today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (sortedDates.includes(yesterdayStr)) {
        // If yesterday is logged, continue the streak
        streak = (habit.streak || 0) + 1;
      }
    }
    
    // Update the habit
    await updateDoc(habitRef, {
      logs: updatedLogs,
      streak,
      xp: (habit.xp || 0) + 5, // Add 5 XP for completing a habit
      updatedAt: serverTimestamp()
    });
    
    // Update user's total XP
    const userDocRef = getUserDocRef(userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      const newTotalXP = (userData.totalXP || 0) + 5;
      
      // Calculate level (1 level per 100 XP)
      const newLevel = Math.floor(newTotalXP / 100) + 1;
      
      await updateDoc(userDocRef, {
        totalXP: newTotalXP,
        level: newLevel,
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error logging habit completion:', error);
    return { success: false, error };
  }
};

// Initialize user data when they first sign up
export const initializeUserData = async (user: User) => {
  try {
    const userId = user.uid;
    const userDocRef = getUserDocRef(userId);
    const userDoc = await getDoc(userDocRef);
    
    // Only initialize if user doesn't exist
    if (!userDoc.exists()) {
      // Create default user profile
      const defaultProfile: UserProfile = {
        name: user.displayName || 'User',
        email: user.email || '',
        avatar: user.photoURL || '',
        level: 1,
        totalXP: 0,
        daysActive: 1,
        currentStreak: 0,
        joinDate: new Date().toISOString(),
        isPremium: false,
        preferences: {
          notifications: true,
          darkMode: false,
          weekStartsOn: 'monday'
        },
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(userDocRef, defaultProfile);
      
      // Create some default habits
      const defaultHabits: Omit<Habit, 'id'>[] = [
        {
          name: 'Drink Water',
          logs: [],
          xp: 0,
          streak: 0,
          category: 'Health',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp
        },
        {
          name: 'Exercise',
          logs: [],
          xp: 0,
          streak: 0,
          category: 'Fitness',
          daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp
        }
      ];
      
      for (const habit of defaultHabits) {
        await createHabit(userId, habit);
      }
      
      console.log('User data initialized successfully');
      return { success: true };
    }
    
    return { success: true, message: 'User already initialized' };
  } catch (error) {
    console.error('Error initializing user data:', error);
    return { success: false, error };
  }
}; 
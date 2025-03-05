import { 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  serverTimestamp,
  DocumentReference,
  CollectionReference,
  Query
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Habit, 
  HabitSet, 
  UserProfile, 
  UserStats, 
  ApiResponse 
} from '@/types';
import { 
  getUserProfileRef, 
  getHabitSetsRef, 
  getHabitSetRef, 
  getHabitsRef, 
  getHabitRef, 
  getUserStatsRef 
} from './collections';
import { 
  withTimestamps, 
  withUpdateTimestamp 
} from './converters';
import { 
  handleError, 
  showErrorToast, 
  logError 
} from '@/utils/errorHandling';

// Generic function to handle API responses
async function handleApiRequest<T>(
  requestFn: () => Promise<T>,
  errorMessage = 'An error occurred'
): Promise<ApiResponse<T>> {
  try {
    const data = await requestFn();
    return { data, status: 'success' };
  } catch (error) {
    const appError = handleError(error, errorMessage);
    logError(appError);
    return { error: appError.message, status: 'error' };
  }
}

// User Profile API
export const userProfileApi = {
  // Get user profile
  async get(userId: string): Promise<ApiResponse<UserProfile | null>> {
    return handleApiRequest(async () => {
      const docRef = getUserProfileRef(userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    }, 'Failed to get user profile');
  },
  
  // Create or update user profile
  async save(userId: string, profile: Partial<UserProfile>): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const docRef = getUserProfileRef(userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Update existing profile
        await updateDoc(docRef, withUpdateTimestamp(profile));
      } else {
        // Create new profile with defaults
        const newProfile = {
          id: userId,
          name: profile.name || '',
          email: profile.email || '',
          avatar: profile.avatar || '',
          level: profile.level || 1,
          totalXP: profile.totalXP || 0,
          daysActive: profile.daysActive || 0,
          currentStreak: profile.currentStreak || 0,
          joinDate: profile.joinDate || new Date().toISOString().split('T')[0],
          isPremium: profile.isPremium || false,
          preferences: profile.preferences || {
            notifications: false,
            darkMode: false,
            weekStartsOn: 'monday'
          }
        };
        await setDoc(docRef, withTimestamps(newProfile));
      }
      
      return true;
    }, 'Failed to save user profile');
  }
};

// Habit Sets API
export const habitSetsApi = {
  // Get all habit sets for a user
  async getAll(userId: string): Promise<ApiResponse<HabitSet[]>> {
    return handleApiRequest(async () => {
      const collectionRef = getHabitSetsRef(userId);
      const q = query(collectionRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data());
    }, 'Failed to get habit sets');
  },
  
  // Get a specific habit set
  async get(userId: string, habitSetId: string): Promise<ApiResponse<HabitSet | null>> {
    return handleApiRequest(async () => {
      const docRef = getHabitSetRef(userId, habitSetId);
      const docSnap = await getDoc(docRef);
      
      return docSnap.exists() ? docSnap.data() : null;
    }, 'Failed to get habit set');
  },
  
  // Create a new habit set
  async create(userId: string, habitSet: Omit<HabitSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<HabitSet>> {
    return handleApiRequest(async () => {
      const collectionRef = getHabitSetsRef(userId);
      
      // Create a new document with an auto-generated ID
      const newHabitSetData = {
        ...habitSet,
        id: '' // Temporary ID that will be replaced
      };
      
      const docRef = await addDoc(collectionRef, withTimestamps(newHabitSetData));
      
      // Update the document with its actual ID
      await updateDoc(docRef, { id: docRef.id });
      
      // Get the created document
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Failed to create habit set');
      }
      
      return docSnap.data();
    }, 'Failed to create habit set');
  },
  
  // Update a habit set
  async update(userId: string, habitSetId: string, updates: Partial<HabitSet>): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const docRef = getHabitSetRef(userId, habitSetId);
      await updateDoc(docRef, withUpdateTimestamp(updates));
      
      return true;
    }, 'Failed to update habit set');
  },
  
  // Delete a habit set
  async delete(userId: string, habitSetId: string): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const docRef = getHabitSetRef(userId, habitSetId);
      await deleteDoc(docRef);
      
      return true;
    }, 'Failed to delete habit set');
  },
  
  // Set a habit set as active
  async setActive(userId: string, habitSetId: string): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const batch = writeBatch(db);
      
      // Get all habit sets
      const collectionRef = getHabitSetsRef(userId);
      const querySnapshot = await getDocs(collectionRef);
      
      // Set all to inactive
      querySnapshot.forEach(doc => {
        batch.update(doc.ref, { isActive: false, updatedAt: serverTimestamp() });
      });
      
      // Set the selected one to active
      const docRef = getHabitSetRef(userId, habitSetId);
      batch.update(docRef, { isActive: true, updatedAt: serverTimestamp() });
      
      await batch.commit();
      return true;
    }, 'Failed to set active habit set');
  }
};

// Habits API
export const habitsApi = {
  // Get all habits for a habit set
  async getAll(userId: string, habitSetId: string): Promise<ApiResponse<Habit[]>> {
    return handleApiRequest(async () => {
      const collectionRef = getHabitsRef(userId, habitSetId);
      const q = query(collectionRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data());
    }, 'Failed to get habits');
  },
  
  // Get a specific habit
  async get(userId: string, habitSetId: string, habitId: string): Promise<ApiResponse<Habit | null>> {
    return handleApiRequest(async () => {
      const docRef = getHabitRef(userId, habitSetId, habitId);
      const docSnap = await getDoc(docRef);
      
      return docSnap.exists() ? docSnap.data() : null;
    }, 'Failed to get habit');
  },
  
  // Create a new habit
  async create(userId: string, habitSetId: string, habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Habit>> {
    return handleApiRequest(async () => {
      const collectionRef = getHabitsRef(userId, habitSetId);
      
      // Create a new document with an auto-generated ID
      const newHabitData = {
        ...habit,
        id: '' // Temporary ID that will be replaced
      };
      
      const docRef = await addDoc(collectionRef, withTimestamps(newHabitData));
      
      // Update the document with its actual ID
      await updateDoc(docRef, { id: docRef.id });
      
      // Get the created document
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Failed to create habit');
      }
      
      return docSnap.data();
    }, 'Failed to create habit');
  },
  
  // Update a habit
  async update(userId: string, habitSetId: string, habitId: string, updates: Partial<Habit>): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const docRef = getHabitRef(userId, habitSetId, habitId);
      await updateDoc(docRef, withUpdateTimestamp(updates));
      
      return true;
    }, 'Failed to update habit');
  },
  
  // Delete a habit
  async delete(userId: string, habitSetId: string, habitId: string): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const docRef = getHabitRef(userId, habitSetId, habitId);
      await deleteDoc(docRef);
      
      return true;
    }, 'Failed to delete habit');
  },
  
  // Toggle habit completion
  async toggleCompletion(userId: string, habitSetId: string, habitId: string): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const habitRef = getHabitRef(userId, habitSetId, habitId);
      const statsRef = getUserStatsRef(userId);
      
      // Get current habit data
      const habitSnap = await getDoc(habitRef);
      if (!habitSnap.exists()) {
        throw new Error('Habit not found');
      }
      
      const habit = habitSnap.data();
      const today = new Date().toISOString().split('T')[0];
      const isCompletedToday = habit.logs.includes(today);
      
      // Get current stats
      const statsSnap = await getDoc(statsRef);
      const stats = statsSnap.exists() 
        ? statsSnap.data() 
        : { totalXP: 0, dailyXP: { date: today, xp: 0 } };
      
      // Update in a batch
      const batch = writeBatch(db);
      
      // Update habit logs
      batch.update(habitRef, {
        logs: isCompletedToday
          ? habit.logs.filter(date => date !== today)
          : [...habit.logs, today],
        updatedAt: serverTimestamp()
      });
      
      // Update stats only when completing (not when uncompleting)
      if (!isCompletedToday) {
        const XP_PER_COMPLETION = 50;
        const MAX_DAILY_XP = 500;
        
        batch.set(statsRef, {
          totalXP: stats.totalXP + XP_PER_COMPLETION,
          dailyXP: {
            date: today,
            xp: Math.min(MAX_DAILY_XP, stats.dailyXP.xp + XP_PER_COMPLETION)
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      
      await batch.commit();
      return true;
    }, 'Failed to toggle habit completion');
  }
};

// User Stats API
export const userStatsApi = {
  // Get user stats
  async get(userId: string): Promise<ApiResponse<UserStats | null>> {
    return handleApiRequest(async () => {
      const docRef = getUserStatsRef(userId);
      const docSnap = await getDoc(docRef);
      
      return docSnap.exists() ? docSnap.data() : null;
    }, 'Failed to get user stats');
  },
  
  // Update user stats
  async update(userId: string, updates: Partial<UserStats>): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const docRef = getUserStatsRef(userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, withUpdateTimestamp(updates));
      } else {
        const today = new Date().toISOString().split('T')[0];
        const defaultStats = {
          id: 'daily',
          totalXP: updates.totalXP || 0,
          dailyXP: updates.dailyXP || { date: today, xp: 0 }
        };
        await setDoc(docRef, withTimestamps(defaultStats));
      }
      
      return true;
    }, 'Failed to update user stats');
  }
}; 
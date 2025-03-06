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
import { db } from './config';
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
  getUserStatsRef,
  getUserStatsDocRef
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
      try {
        const docSnap = await getDoc(docRef);
        
        // Safe check for exists method
        if (docSnap && typeof docSnap.exists === 'function' && docSnap.exists()) {
          return docSnap.data();
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error fetching user profile for ${userId}:`, error);
        return null;
      }
    }, 'Failed to get user profile');
  },
  
  // Save or update a user profile
  async save(userId: string, profile: Partial<UserProfile>): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const docRef = getUserProfileRef(userId);
      
      try {
        const docSnap = await getDoc(docRef);
        const exists = docSnap && typeof docSnap.exists === 'function' && docSnap.exists();
        
        if (exists) {
          // Document exists, update it
          await updateDoc(docRef, withUpdateTimestamp({
            ...profile,
            // Ensure we don't include id in the update data
            id: undefined
          }));
        } else {
          // Document doesn't exist, create it
          const newProfile = {
            id: userId,
            name: profile.name || 'User',
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
          
          // Create a new document with timestamps
          const docData = withTimestamps(newProfile) as typeof newProfile & {
            createdAt?: any;
            updatedAt?: any;
          };
          
          // If timestamps weren't added (fallback case), add them explicitly
          if (!docData.createdAt) {
            docData.createdAt = serverTimestamp();
          }
          if (!docData.updatedAt) {
            docData.updatedAt = serverTimestamp();
          }
          
          await setDoc(docRef, docData);
        }
        
        return true;
      } catch (error) {
        console.error(`Error saving user profile for ${userId}:`, error);
        return false;
      }
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
      try {
        const docSnap = await getDoc(docRef);
        
        // Safe check for exists method
        if (docSnap && typeof docSnap.exists === 'function' && docSnap.exists()) {
          return docSnap.data();
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error fetching habit set ${habitSetId}:`, error);
        return null;
      }
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
      
      // Create a new document with timestamps
      const habitSetWithTimestamps = withTimestamps(newHabitSetData) as typeof newHabitSetData & {
        createdAt?: any;
        updatedAt?: any;
      };
      
      // If timestamps weren't added (fallback case), add them explicitly
      if (!habitSetWithTimestamps.createdAt) {
        habitSetWithTimestamps.createdAt = serverTimestamp();
      }
      if (!habitSetWithTimestamps.updatedAt) {
        habitSetWithTimestamps.updatedAt = serverTimestamp();
      }
      
      const docRef = await addDoc(collectionRef, habitSetWithTimestamps);
      
      // Update the document with its actual ID
      await updateDoc(docRef, { id: docRef.id });
      
      // Get the created document
      try {
        const docSnap = await getDoc(docRef);
        
        // Safe check for exists method
        if (docSnap && typeof docSnap.exists === 'function' && docSnap.exists()) {
          return docSnap.data();
        } else {
          // Fallback - create a basic habit set object if we can't get the data
          return {
            id: docRef.id,
            name: habitSet.name,
            description: habitSet.description || '',
            isActive: habitSet.isActive || false,
            isPremium: habitSet.isPremium || false,
            createdAt: null,
            updatedAt: null
          };
        }
      } catch (error) {
        console.error('Error getting newly created habit set:', error);
        // Fallback - return the habit set data we have
        return {
          id: docRef.id,
          name: habitSet.name,
          description: habitSet.description || '',
          isActive: habitSet.isActive || false,
          isPremium: habitSet.isPremium || false,
          createdAt: null,
          updatedAt: null
        };
      }
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
      try {
        console.log(`Fetching habits for userId: ${userId}, habitSetId: ${habitSetId}`);
        const collectionRef = getHabitsRef(userId, habitSetId);
        const q = query(collectionRef, orderBy('createdAt', 'desc')); // Change to desc to show newest first
        const querySnapshot = await getDocs(q);
        
        // Log the retrieved habits
        const habits = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Retrieved habit: ${doc.id}, name: ${data.name}`);
          return data;
        });
        
        console.log(`Retrieved ${habits.length} habits`);
        return habits;
      } catch (error) {
        console.error(`Error fetching habits for set ${habitSetId}:`, error);
        return []; // Return empty array instead of failing
      }
    }, 'Failed to get habits');
  },
  
  // Get a specific habit
  async get(userId: string, habitSetId: string, habitId: string): Promise<ApiResponse<Habit | null>> {
    return handleApiRequest(async () => {
      const docRef = getHabitRef(userId, habitSetId, habitId);
      try {
        const docSnap = await getDoc(docRef);
        
        // Safe check for exists method
        if (docSnap && typeof docSnap.exists === 'function' && docSnap.exists()) {
          return docSnap.data();
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error fetching habit ${habitId}:`, error);
        return null;
      }
    }, 'Failed to get habit');
  },
  
  // Create a new habit
  async create(userId: string, habitSetId: string, habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Habit>> {
    return handleApiRequest(async () => {
      try {
        console.log(`Creating habit in set ${habitSetId}:`, habit);
        const collectionRef = getHabitsRef(userId, habitSetId);
        
        // Create a new document with an auto-generated ID
        const newHabitData = {
          ...habit,
          id: '' // Temporary ID that will be replaced
        };
        
        // Create a new document with timestamps
        const habitWithTimestamps = withTimestamps(newHabitData) as typeof newHabitData & {
          createdAt?: any;
          updatedAt?: any;
        };
        
        // If timestamps weren't added (fallback case), add them explicitly
        if (!habitWithTimestamps.createdAt) {
          habitWithTimestamps.createdAt = serverTimestamp();
        }
        if (!habitWithTimestamps.updatedAt) {
          habitWithTimestamps.updatedAt = serverTimestamp();
        }
        
        const docRef = await addDoc(collectionRef, habitWithTimestamps);
        const habitId = docRef.id;
        console.log(`Created habit with ID: ${habitId}`);
        
        // Update the document with its actual ID
        await updateDoc(docRef, { id: habitId });
        console.log(`Updated habit with its ID: ${habitId}`);
        
        // Prepare the returned habit object (even if retrieval fails)
        const newHabit: Habit = {
          id: habitId,
          name: habit.name,
          logs: habit.logs || [],
          xp: habit.xp || 0,
          streak: habit.streak || 0,
          category: habit.category || '',
          daysOfWeek: habit.daysOfWeek || [],
          createdAt: null, // Will be set by Firestore
          updatedAt: null  // Will be set by Firestore
        };
        
        // Try to get the created document with Firestore timestamps
        try {
          const docSnap = await getDoc(docRef);
          
          // Safe check for exists method
          if (docSnap && typeof docSnap.exists === 'function' && docSnap.exists()) {
            const data = docSnap.data();
            console.log(`Retrieved newly created habit:`, data);
            return data;
          }
        } catch (retrievalError) {
          console.error(`Error retrieving newly created habit ${habitId}:`, retrievalError);
        }
        
        // Return our constructed object if retrieval failed
        console.log(`Returning manually constructed habit:`, newHabit);
        return newHabit;
      } catch (error) {
        console.error('Error creating habit:', error);
        throw error;
      }
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
      const statsDocRef = getUserStatsDocRef(userId);
      
      // Get current habit data
      const habitSnap = await getDoc(habitRef);
      if (!habitSnap.exists()) {
        throw new Error('Habit not found');
      }
      
      const habit = habitSnap.data();
      const today = new Date().toISOString().split('T')[0];
      const isCompletedToday = habit.logs.includes(today);
      
      // Get current stats
      const statsSnap = await getDoc(statsDocRef);
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
        
        batch.set(statsDocRef, {
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
      const docRef = getUserStatsDocRef(userId);
      try {
        const docSnap = await getDoc(docRef);
        
        // Safe check for exists method
        if (docSnap && typeof docSnap.exists === 'function' && docSnap.exists()) {
          return docSnap.data();
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error fetching user stats for ${userId}:`, error);
        return null;
      }
    }, 'Failed to get user stats');
  },
  
  // Update user stats
  async update(userId: string, updates: Partial<UserStats>): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      const docRef = getUserStatsDocRef(userId);
      
      try {
        const docSnap = await getDoc(docRef);
        const exists = docSnap && typeof docSnap.exists === 'function' && docSnap.exists();
        
        if (exists) {
          await updateDoc(docRef, withUpdateTimestamp(updates));
        } else {
          const today = new Date().toISOString().split('T')[0];
          const defaultStats = {
            id: 'current',
            totalXP: updates.totalXP || 0,
            dailyXP: updates.dailyXP || { date: today, xp: 0 }
          };

          // Create stats with timestamps
          const statsWithTimestamps = withTimestamps(defaultStats) as typeof defaultStats & {
            createdAt?: any;
            updatedAt?: any;
          };

          // If timestamps weren't added (fallback case), add them explicitly
          if (!statsWithTimestamps.createdAt) {
            statsWithTimestamps.createdAt = serverTimestamp();
          }
          if (!statsWithTimestamps.updatedAt) {
            statsWithTimestamps.updatedAt = serverTimestamp();
          }

          await setDoc(docRef, statsWithTimestamps);
        }
        
        return true;
      } catch (error) {
        console.error(`Error updating user stats for ${userId}:`, error);
        return false;
      }
    }, 'Failed to update user stats');
  }
}; 
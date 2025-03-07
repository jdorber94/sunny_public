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
import { cleanForFirestore, ensureRequiredFields } from '@/utils/firestoreHelpers';

// Generic function to handle API responses
async function handleApiRequest<T>(
  requestFn: () => Promise<T>,
  errorMessage = 'An error occurred'
): Promise<ApiResponse<T>> {
  try {
    // Add a timeout to prevent hanging requests
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000); // 10 second timeout
    });
    
    // Race the actual request against the timeout
    const data = await Promise.race([
      requestFn(),
      timeoutPromise
    ]) as T;
    
    // Check if data is valid
    if (data === undefined || data === null) {
      console.warn('API request returned undefined or null data');
      return { 
        error: 'No data returned from operation', 
        status: 'error' 
      };
    }
    
    return { data, status: 'success' };
  } catch (error) {
    console.error('API request error:', error);
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
        // Get data directly, which will be undefined if document doesn't exist
        const data = docSnap.data();
        return data || null;
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
        // Check if document exists by checking if data is not undefined
        const exists = docSnap.data() !== undefined;
        
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
      console.log(`Getting all habit sets for user ${userId}`);
      const collectionRef = getHabitSetsRef(userId);
      const q = query(collectionRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const habitSets = querySnapshot.docs.map(doc => doc.data());
      console.log(`Retrieved ${habitSets.length} habit sets for user ${userId}`);
      return habitSets;
    }, 'Failed to get habit sets');
  },
  
  // Get a specific habit set
  async get(userId: string, habitSetId: string): Promise<ApiResponse<HabitSet | null>> {
    return handleApiRequest(async () => {
      console.log(`Getting habit set ${habitSetId} for user ${userId}`);
      const docRef = getHabitSetRef(userId, habitSetId);
      try {
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        
        if (data) {
          console.log(`Retrieved habit set: ${habitSetId}, name: ${data.name}`);
          return data;
        } else {
          console.log(`Habit set ${habitSetId} not found`);
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
      console.log(`Creating habit set for user ${userId}:`, habitSet);
      const collectionRef = getHabitSetsRef(userId);
      
      // Ensure required fields and clean the data for Firestore
      const requiredFields = {
        name: habitSet.name || 'Unnamed Set',
        isPremium: false,
        isActive: false
      };
      
      // First ensure required fields, then clean for Firestore
      const habitSetWithRequiredFields = ensureRequiredFields(habitSet, requiredFields);
      const cleanedHabitSet = cleanForFirestore(habitSetWithRequiredFields);
      
      console.log('Cleaned habit set data for Firestore:', cleanedHabitSet);
      
      // Create a new document with an auto-generated ID
      const newHabitSetData = {
        ...cleanedHabitSet,
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
      
      console.log('Final data being sent to Firestore:', habitSetWithTimestamps);
      const docRef = await addDoc(collectionRef, habitSetWithTimestamps);
      const habitSetId = docRef.id;
      console.log(`Created habit set with ID: ${habitSetId}`);
      
      // Update the document with its actual ID
      await updateDoc(docRef, { id: habitSetId });
      console.log(`Updated habit set with its ID: ${habitSetId}`);
      
      // Get the created document
      try {
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        console.log(`Retrieved newly created habit set:`, data);
        return data as HabitSet;
      } catch (retrievalError) {
        console.error(`Error retrieving newly created habit set ${habitSetId}:`, retrievalError);
        
        // If retrieval fails, return a constructed object
        return {
          id: habitSetId,
          name: cleanedHabitSet.name as string,
          description: cleanedHabitSet.description,
          isPremium: cleanedHabitSet.isPremium as boolean,
          isActive: cleanedHabitSet.isActive as boolean,
          createdAt: habitSetWithTimestamps.createdAt,
          updatedAt: habitSetWithTimestamps.updatedAt
        } as HabitSet;
      }
    }, 'Failed to create habit set');
  },
  
  // Update a habit set
  async update(userId: string, habitSetId: string, updates: Partial<HabitSet>): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      console.log(`Updating habit set ${habitSetId} for user ${userId}:`, updates);
      const docRef = getHabitSetRef(userId, habitSetId);
      await updateDoc(docRef, withUpdateTimestamp(updates));
      console.log(`Successfully updated habit set ${habitSetId}`);
      
      return true;
    }, 'Failed to update habit set');
  },
  
  // Delete a habit set
  async delete(userId: string, habitSetId: string): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      console.log(`Deleting habit set ${habitSetId} for user ${userId}`);
      const docRef = getHabitSetRef(userId, habitSetId);
      await deleteDoc(docRef);
      console.log(`Successfully deleted habit set ${habitSetId}`);
      
      return true;
    }, 'Failed to delete habit set');
  },
  
  // Set a habit set as active
  async setActive(userId: string, habitSetId: string): Promise<ApiResponse<boolean>> {
    return handleApiRequest(async () => {
      console.log(`Setting habit set ${habitSetId} as active for user ${userId}`);
      const batch = writeBatch(db);
      
      // Get all habit sets
      const collectionRef = getHabitSetsRef(userId);
      const querySnapshot = await getDocs(collectionRef);
      
      console.log(`Found ${querySnapshot.size} habit sets to update`);
      
      // Set all to inactive
      querySnapshot.forEach(doc => {
        console.log(`Setting habit set ${doc.id} to inactive`);
        batch.update(doc.ref, { isActive: false, updatedAt: serverTimestamp() });
      });
      
      // Set the selected one to active
      const docRef = getHabitSetRef(userId, habitSetId);
      console.log(`Setting habit set ${habitSetId} to active`);
      batch.update(docRef, { isActive: true, updatedAt: serverTimestamp() });
      
      await batch.commit();
      console.log(`Successfully set habit set ${habitSetId} as active`);
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
        const data = docSnap.data();
        return data || null;
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
        
        // Ensure required fields and clean the data for Firestore
        const requiredFields = {
          name: '',
          logs: [],
          xp: 0
        };
        
        // First ensure required fields, then clean for Firestore
        const habitWithRequiredFields = ensureRequiredFields(habit, requiredFields);
        const cleanedHabit = cleanForFirestore(habitWithRequiredFields);
        
        console.log('Cleaned habit data for Firestore:', cleanedHabit);
        
        // Create a new document with an auto-generated ID
        const newHabitData = {
          ...cleanedHabit,
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
        
        console.log('Final data being sent to Firestore:', habitWithTimestamps);
        const docRef = await addDoc(collectionRef, habitWithTimestamps);
        const habitId = docRef.id;
        console.log(`Created habit with ID: ${habitId}`);
        
        // Update the document with its actual ID
        await updateDoc(docRef, { id: habitId });
        
        // Return the created habit with the correct ID
        return {
          ...cleanedHabit,
          id: habitId,
          createdAt: habitWithTimestamps.createdAt,
          updatedAt: habitWithTimestamps.updatedAt
        } as Habit;
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
      
      // Clean the updates for Firestore
      const cleanedUpdates = cleanForFirestore(updates);
      console.log('Cleaned updates for Firestore:', cleanedUpdates);
      
      // Add update timestamp
      const updatesWithTimestamp = withUpdateTimestamp(cleanedUpdates);
      console.log('Final updates being sent to Firestore:', updatesWithTimestamp);
      
      await updateDoc(docRef, updatesWithTimestamp);
      
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
        const data = docSnap.data();
        return data || null;
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
        const exists = docSnap.data() !== undefined;
        
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
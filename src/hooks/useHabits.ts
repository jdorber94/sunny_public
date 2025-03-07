import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFirebaseSubscription } from './useFirebaseSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { habitsApi, habitSetsApi } from '@/services/firestore/api';
import { getHabitsRef, getHabitSetsRef } from '@/services/firestore/collections';
import { Habit, HabitSet, ApiResponse } from '@/types';
import { toast } from 'react-hot-toast';
import { isQuotaExceededError } from '@/utils/errorHandling';
import {
  getHabitSetsFromLocalStorage,
  getHabitsFromLocalStorage,
  getActiveHabitSetFromLocalStorage,
  saveHabitSetsToLocalStorage,
  saveHabitsToLocalStorage,
  saveActiveHabitSetToLocalStorage,
  createHabitSetInLocalStorage,
  createHabitInLocalStorage,
  setActiveHabitSetInLocalStorage,
  initializeLocalStorage
} from '@/utils/localStorageHelpers';

/**
 * Custom hook for managing habits and habit sets
 */
export function useHabits() {
  const { user } = useAuth();
  const [activeHabitSetId, setActiveHabitSetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [habitSets, setHabitSets] = useState<HabitSet[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false);
  
  // Initialize local storage on first load and check for forced local mode
  useEffect(() => {
    try {
      // Check if local mode is forced
      const forcedLocalMode = localStorage.getItem('sunny_force_local_mode') === 'true';
      if (forcedLocalMode) {
        console.log('Local mode is forced by user');
        setIsLocalMode(true);
      }
      
      initializeLocalStorage();
    } catch (error) {
      console.error('Error initializing local storage:', error);
    }
  }, []);
  
  // Subscribe to habit sets
  const habitSetsRef = useMemo(() => {
    console.log('Creating habitSetsRef for user:', user?.uid);
    return user ? getHabitSetsRef(user.uid) : null;
  }, [user]);
  
  const { 
    data: habitSetsData, 
    loading: loadingHabitSets, 
    error: habitSetsError 
  } = useFirebaseSubscription<HabitSet>(habitSetsRef);
  
  // Keep our local state in sync with Firestore data for habit sets
  useEffect(() => {
    console.log('Received habitSetsData:', habitSetsData);
    
    // If we have Firebase data, use it
    if (Array.isArray(habitSetsData) && habitSetsData.length > 0) {
      console.log(`Received ${habitSetsData.length} habit sets from Firestore subscription`);
      setHabitSets(habitSetsData);
      setIsLocalMode(false);
    } 
    // If we have an error or no data, try to use localStorage
    else if (habitSetsError || (Array.isArray(habitSetsData) && habitSetsData.length === 0)) {
      console.log('No habit sets from Firebase, using localStorage');
      const localHabitSets = getHabitSetsFromLocalStorage();
      
      if (localHabitSets.length > 0) {
        console.log(`Found ${localHabitSets.length} habit sets in localStorage`);
        setHabitSets(localHabitSets);
        setIsLocalMode(true);
      } else if (user) {
        // Create a default habit set in localStorage
        console.log('No habit sets found in localStorage, creating default');
        try {
          const defaultHabitSet = createHabitSetInLocalStorage({
            name: 'My Habits',
            description: 'Default habit set',
            isPremium: false,
            isActive: true
          });
          
          setHabitSets([defaultHabitSet]);
          setIsLocalMode(true);
        } catch (error) {
          console.error('Error creating default habit set:', error);
        }
      }
    }
  }, [habitSetsData, habitSetsError, user]);
  
  // Find active habit set
  const activeHabitSet = useMemo(() => {
    console.log('Finding active habit set from:', habitSets);
    if (!habitSets || !Array.isArray(habitSets) || habitSets.length === 0) {
      console.warn('No habit sets found. This could be due to:');
      console.warn('1. User not authenticated properly');
      console.warn('2. Firestore connection issues');
      console.warn('3. No habit sets created yet');
      
      // If user is authenticated but no habit sets, we'll create a default one
      if (user && !loadingHabitSets) {
        console.log('User is authenticated but no habit sets found. Will create a default one.');
        // We'll create a default habit set in a separate effect
      }
      
      return null;
    }
    
    // First try to find the one marked as active
    const active = habitSets.find(set => set.isActive);
    if (active) {
      console.log('Found active habit set:', active.name);
      setActiveHabitSetId(active.id);
      return active;
    }
    
    // If no active set is found and we have sets, use the first one
    if (habitSets.length > 0) {
      console.log('No active set found, using first one:', habitSets[0].name);
      setActiveHabitSetId(habitSets[0].id);
      return habitSets[0];
    }
    
    return null;
  }, [habitSets, user, loadingHabitSets]);
  
  // Subscribe to habits in the active habit set
  const habitsRef = useMemo(() => {
    if (!user || !activeHabitSetId) return null;
    console.log(`Creating habitsRef for user ${user.uid}, set ${activeHabitSetId}`);
    return getHabitsRef(user.uid, activeHabitSetId);
  }, [user, activeHabitSetId]);
  
  const { 
    data: habitsData, 
    loading: loadingHabits, 
    error: habitsError 
  } = useFirebaseSubscription<Habit>(habitsRef);
  
  // Keep our local state in sync with Firestore data for habits
  useEffect(() => {
    console.log('Received habitsData:', habitsData);
    
    // If we have Firebase data, use it
    if (Array.isArray(habitsData)) {
      console.log(`Received ${habitsData.length} habits from Firestore subscription`);
      setHabits(habitsData);
    } 
    // If we have an error or no data, try to use localStorage
    else if (habitsError || isLocalMode) {
      if (activeHabitSetId) {
        console.log('Using localStorage for habits');
        const localHabits = getHabitsFromLocalStorage(activeHabitSetId);
        console.log(`Found ${localHabits.length} habits in localStorage for set ${activeHabitSetId}`);
        setHabits(localHabits);
      }
    }
  }, [habitsData, habitsError, activeHabitSetId, isLocalMode]);
  
  // Create a new habit
  const createHabit = useCallback(async (
    habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Habit>> => {
    if (!activeHabitSetId) {
      return { 
        error: 'No active habit set selected', 
        status: 'error' 
      };
    }
    
    setIsLoading(true);
    try {
      console.log('Creating new habit:', habitData);
      
      // If we're in local mode, create the habit in localStorage
      if (isLocalMode || !user) {
        console.log('Creating habit in localStorage');
        try {
          const newHabit = createHabitInLocalStorage(activeHabitSetId, habitData);
          
          // Update local state
          setHabits(currentHabits => [...(currentHabits || []), newHabit]);
          
          toast.success('Habit created successfully (local mode)');
          
          return {
            data: newHabit,
            status: 'success',
            isLocal: true
          };
        } catch (localError) {
          console.error('Error creating habit in localStorage:', localError);
          toast.error('Failed to create habit in local mode');
          
          return {
            error: 'Failed to create habit in local mode',
            status: 'error',
            isLocal: true
          };
        }
      }
      
      // Try to create in Firebase first
      try {
        // Add a timeout to prevent hanging requests
        const timeoutPromise = new Promise<ApiResponse<Habit>>((resolve) => {
          setTimeout(() => {
            resolve({ 
              error: 'Request timed out. Creating habit locally instead.', 
              status: 'error',
              isLocal: true
            });
          }, 5000); // 5 second timeout
        });
        
        // Race the actual request against the timeout
        const result = await Promise.race([
          habitsApi.create(user.uid, activeHabitSetId, habitData),
          timeoutPromise
        ]);
        
        // If the request timed out or failed, create a local habit
        if (result.status === 'error' || result.isLocal) {
          console.warn('Creating habit locally due to:', result.error);
          setIsLocalMode(true);
          
          // Create a temporary local habit with a fake ID
          const newHabit = createHabitInLocalStorage(activeHabitSetId, habitData);
          
          // Add to local state
          setHabits(currentHabits => [...(currentHabits || []), newHabit]);
          
          // If it was a timeout, show a toast
          if (result.error?.includes('timed out')) {
            toast.error('Request timed out. Habit created locally only.');
          } else {
            toast.error('Failed to create habit in Firebase. Created locally instead.');
          }
          
          return {
            data: newHabit,
            status: 'success',
            isLocal: true
          };
        }
        
        // Handle successful creation
        if (result.status === 'success' && result.data) {
          toast.success('Habit created successfully');
          
          // Manually add the new habit to our local state to ensure it shows up
          // without waiting for the Firestore subscription to update
          setHabits((currentHabits) => {
            // Make sure we're not adding duplicates
            if (Array.isArray(currentHabits) && result.data) {
              const habitExists = currentHabits.some(h => h.id === result.data?.id);
              if (!habitExists) {
                console.log('Adding new habit to local state:', result.data);
                return [...currentHabits, result.data];
              }
            }
            return currentHabits || [];
          });
          
          return result;
        }
        
        return result;
      } catch (error) {
        console.error('Error creating habit in Firebase:', error);
        setIsLocalMode(true);
        
        // Fall back to localStorage
        const newHabit = createHabitInLocalStorage(activeHabitSetId, habitData);
        
        // Add to local state
        setHabits(currentHabits => [...(currentHabits || []), newHabit]);
        
        toast.error('Failed to create habit in Firebase. Created locally instead.');
        
        return {
          data: newHabit,
          status: 'success',
          isLocal: true
        };
      }
    } catch (error) {
      console.error('Error in createHabit:', error);
      toast.error('Failed to create habit');
      return {
        error: 'Failed to create habit',
        status: 'error'
      };
    } finally {
      setIsLoading(false);
    }
  }, [user, activeHabitSetId, isLocalMode]);
  
  // Update a habit
  const updateHabit = useCallback(async (
    habitId: string, 
    updates: Partial<Habit>
  ): Promise<ApiResponse<boolean>> => {
    if (!user || !activeHabitSetId) {
      return { 
        error: 'No active habit set selected', 
        status: 'error' 
      };
    }
    
    setIsLoading(true);
    try {
      const result = await habitsApi.update(user.uid, activeHabitSetId, habitId, updates);
      
      if (result.status === 'success') {
        toast.success('Habit updated successfully');
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [user, activeHabitSetId]);
  
  // Delete a habit
  const deleteHabit = useCallback(async (
    habitId: string
  ): Promise<ApiResponse<boolean>> => {
    if (!user || !activeHabitSetId) {
      return { 
        error: 'No active habit set selected', 
        status: 'error' 
      };
    }
    
    setIsLoading(true);
    try {
      const result = await habitsApi.delete(user.uid, activeHabitSetId, habitId);
      
      if (result.status === 'success') {
        toast.success('Habit deleted successfully');
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [user, activeHabitSetId]);
  
  // Toggle habit completion
  const toggleHabitCompletion = useCallback(async (
    habitId: string
  ): Promise<ApiResponse<boolean>> => {
    if (!user || !activeHabitSetId) {
      return { 
        error: 'No active habit set selected', 
        status: 'error' 
      };
    }
    
    setIsLoading(true);
    try {
      return await habitsApi.toggleCompletion(user.uid, activeHabitSetId, habitId);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeHabitSetId]);
  
  // Create a new habit set
  const createHabitSet = useCallback(async (
    habitSetData: Omit<HabitSet, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<HabitSet> & { isLocal?: boolean }> => {
    setIsLoading(true);
    try {
      console.log('Creating habit set with data:', habitSetData);
      
      // If we're in local mode or no user, create in localStorage
      if (isLocalMode || !user) {
        console.log('Creating habit set in localStorage');
        try {
          const newHabitSet = createHabitSetInLocalStorage(habitSetData);
          
          // Update local state
          setHabitSets(prev => [...prev, newHabitSet]);
          
          // Set as active if it's the first one
          if (habitSets.length === 0) {
            setActiveHabitSetId(newHabitSet.id);
          }
          
          toast.success('Habit set created successfully (local mode)');
          
          return {
            data: newHabitSet,
            status: 'success',
            isLocal: true
          };
        } catch (localError) {
          console.error('Error creating habit set in localStorage:', localError);
          toast.error('Failed to create habit set in local mode');
          
          return {
            error: 'Failed to create habit set in local mode',
            status: 'error',
            isLocal: true
          };
        }
      }
      
      // Try to create in Firebase first
      try {
        const result = await habitSetsApi.create(user.uid, habitSetData);
        
        if (result.status === 'success' && result.data) {
          // Set as active if it's the first one
          if (habitSets.length === 0) {
            console.log('Setting as active (first habit set):', result.data.id);
            await habitSetsApi.setActive(user.uid, result.data.id);
            setActiveHabitSetId(result.data.id);
          }
          
          // Manually add to local state to ensure immediate UI update
          setHabitSets(prev => {
            const exists = prev.some(set => set.id === result.data?.id);
            if (!exists && result.data) {
              console.log('Adding new habit set to local state:', result.data);
              return [...prev, result.data];
            }
            return prev;
          });
          
          toast.success('Habit set created successfully');
        } else if (result.error) {
          // If Firebase creation failed, try localStorage
          console.warn('Firebase creation failed, using localStorage:', result.error);
          setIsLocalMode(true);
          
          const newHabitSet = createHabitSetInLocalStorage(habitSetData);
          
          // Update local state
          setHabitSets(prev => [...prev, newHabitSet]);
          
          // Set as active if it's the first one
          if (habitSets.length === 0) {
            setActiveHabitSetId(newHabitSet.id);
          }
          
          toast.error('Failed to create habit set in Firebase. Created locally instead.');
          
          return {
            data: newHabitSet,
            status: 'success',
            isLocal: true
          };
        }
        
        return result;
      } catch (error) {
        console.error('Error creating habit set in Firebase:', error);
        setIsLocalMode(true);
        
        // Fall back to localStorage
        const newHabitSet = createHabitSetInLocalStorage(habitSetData);
        
        // Update local state
        setHabitSets(prev => [...prev, newHabitSet]);
        
        // Set as active if it's the first one
        if (habitSets.length === 0) {
          setActiveHabitSetId(newHabitSet.id);
        }
        
        toast.error('Failed to create habit set in Firebase. Created locally instead.');
        
        return {
          data: newHabitSet,
          status: 'success',
          isLocal: true
        };
      }
    } catch (error) {
      console.error('Error in createHabitSet:', error);
      toast.error('Failed to create habit set');
      return {
        error: 'Failed to create habit set',
        status: 'error'
      };
    } finally {
      setIsLoading(false);
    }
  }, [user, habitSets, isLocalMode]);
  
  // Set active habit set
  const setActiveHabitSet = useCallback(async (
    habitSetId: string
  ): Promise<ApiResponse<boolean>> => {
    setIsLoading(true);
    try {
      console.log('Setting active habit set:', habitSetId);
      
      // If we're in local mode or no user, use localStorage
      if (isLocalMode || !user) {
        console.log('Setting active habit set in localStorage');
        try {
          const success = setActiveHabitSetInLocalStorage(habitSetId);
          
          if (success) {
            // Update local state
            setHabitSets(prev => prev.map(set => ({
              ...set,
              isActive: set.id === habitSetId
            })));
            
            setActiveHabitSetId(habitSetId);
            
            toast.success('Habit set activated successfully (local mode)');
            
            return {
              data: true,
              status: 'success',
              isLocal: true
            };
          } else {
            toast.error('Failed to activate habit set in local mode');
            
            return {
              error: 'Failed to activate habit set in local mode',
              status: 'error',
              isLocal: true
            };
          }
        } catch (localError) {
          console.error('Error activating habit set in localStorage:', localError);
          toast.error('Failed to activate habit set in local mode');
          
          return {
            error: 'Failed to activate habit set in local mode',
            status: 'error',
            isLocal: true
          };
        }
      }
      
      // Try to set active in Firebase first
      try {
        const result = await habitSetsApi.setActive(user.uid, habitSetId);
        
        if (result.status === 'success') {
          // Update local state immediately
          setHabitSets(prev => prev.map(set => ({
            ...set,
            isActive: set.id === habitSetId
          })));
          
          setActiveHabitSetId(habitSetId);
          
          // Load habits for the new active set
          const habitsResult = await habitsApi.getAll(user.uid, habitSetId);
          if (habitsResult.status === 'success' && habitsResult.data) {
            setHabits(habitsResult.data);
          }
        } else if (result.error) {
          // If Firebase activation failed, try localStorage
          console.warn('Firebase activation failed, using localStorage:', result.error);
          setIsLocalMode(true);
          
          const success = setActiveHabitSetInLocalStorage(habitSetId);
          
          if (success) {
            // Update local state
            setHabitSets(prev => prev.map(set => ({
              ...set,
              isActive: set.id === habitSetId
            })));
            
            setActiveHabitSetId(habitSetId);
            
            toast.error('Failed to activate habit set in Firebase. Activated locally instead.');
            
            return {
              data: true,
              status: 'success',
              isLocal: true
            };
          } else {
            toast.error('Failed to activate habit set');
            
            return {
              error: 'Failed to activate habit set',
              status: 'error'
            };
          }
        }
        
        return result;
      } catch (error) {
        console.error('Error activating habit set in Firebase:', error);
        setIsLocalMode(true);
        
        // Fall back to localStorage
        const success = setActiveHabitSetInLocalStorage(habitSetId);
        
        if (success) {
          // Update local state
          setHabitSets(prev => prev.map(set => ({
            ...set,
            isActive: set.id === habitSetId
          })));
          
          setActiveHabitSetId(habitSetId);
          
          toast.error('Failed to activate habit set in Firebase. Activated locally instead.');
          
          return {
            data: true,
            status: 'success',
            isLocal: true
          };
        } else {
          toast.error('Failed to activate habit set');
          
          return {
            error: 'Failed to activate habit set',
            status: 'error'
          };
        }
      }
    } catch (error) {
      console.error('Error in setActiveHabitSet:', error);
      toast.error('Failed to activate habit set');
      return {
        error: 'Failed to activate habit set',
        status: 'error'
      };
    } finally {
      setIsLoading(false);
    }
  }, [user, isLocalMode]);
  
  // Delete a habit set
  const deleteHabitSet = useCallback(async (
    habitSetId: string
  ): Promise<ApiResponse<boolean>> => {
    if (!user) {
      return { 
        error: 'User not authenticated', 
        status: 'error' 
      };
    }
    
    setIsLoading(true);
    try {
      console.log('Deleting habit set:', habitSetId);
      const result = await habitSetsApi.delete(user.uid, habitSetId);
      console.log('Delete result:', result);
      
      if (result.status === 'success') {
        // If we deleted the active set, we need to select another one
        if (habitSetId === activeHabitSetId && habitSets && Array.isArray(habitSets) && habitSets.length > 1) {
          const remainingSets = habitSets.filter(set => set.id !== habitSetId);
          if (remainingSets.length > 0) {
            console.log('Setting new active set after deletion:', remainingSets[0].id);
            await habitSetsApi.setActive(user.uid, remainingSets[0].id);
            setActiveHabitSetId(remainingSets[0].id);
          } else {
            setActiveHabitSetId(null);
          }
        }
        
        // Update local state immediately
        setHabitSets(prev => prev.filter(set => set.id !== habitSetId));
        
        toast.success('Habit set deleted successfully');
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [user, activeHabitSetId, habitSets]);
  
  // Check if a habit is completed for today
  const isHabitCompletedToday = useCallback((habit: Habit): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return habit.logs.includes(today);
  }, []);
  
  return {
    // Functions
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    createHabitSet,
    setActiveHabitSet,
    deleteHabitSet,
    
    // State
    isLoading,
    loadingHabitSets,
    loadingHabits,
    
    // Data
    habitSets: Array.isArray(habitSets) ? habitSets : [],
    habits: Array.isArray(habits) ? habits : [],
    activeHabitSet,
    activeHabitSetId,
    
    // Errors
    habitSetsError,
    habitsError,
    
    // Helpers
    isHabitCompletedToday
  };
} 
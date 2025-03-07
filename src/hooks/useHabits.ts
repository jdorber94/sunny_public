import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFirebaseSubscription } from './useFirebaseSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { habitsApi, habitSetsApi } from '@/services/firestore/api';
import { getHabitsRef, getHabitSetsRef } from '@/services/firestore/collections';
import { Habit, HabitSet, ApiResponse } from '@/types';
import { toast } from 'react-hot-toast';
import { isQuotaExceededError } from '@/utils/errorHandling';

/**
 * Custom hook for managing habits and habit sets
 */
export function useHabits() {
  const { user } = useAuth();
  const [activeHabitSetId, setActiveHabitSetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [habitSets, setHabitSets] = useState<HabitSet[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  
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
    if (Array.isArray(habitSetsData)) {
      console.log(`Received ${habitSetsData.length} habit sets from Firestore subscription`);
      setHabitSets(habitSetsData);
    }
  }, [habitSetsData]);
  
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
    console.log(`Creating habitsRef for user ${user.uid}, habitSet ${activeHabitSetId}`);
    return getHabitsRef(user.uid, activeHabitSetId);
  }, [user, activeHabitSetId]);
  
  const { 
    data: habitsData, 
    loading: loadingHabits, 
    error: habitsError 
  } = useFirebaseSubscription<Habit>(habitsRef);
  
  // Keep our local state in sync with Firestore data
  useEffect(() => {
    if (Array.isArray(habitsData)) {
      console.log(`Received ${habitsData.length} habits from Firestore subscription`);
      setHabits(habitsData);
    }
  }, [habitsData]);
  
  // Create a new habit
  const createHabit = useCallback(async (
    habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Habit>> => {
    if (!user || !activeHabitSetId) {
      return { 
        error: 'No active habit set selected', 
        status: 'error' 
      };
    }
    
    setIsLoading(true);
    try {
      console.log('Creating new habit:', habitData);
      const result = await habitsApi.create(user.uid, activeHabitSetId, habitData);
      
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
      } else if (result.error) {
        toast.error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error creating habit:', error);
      
      // Check for quota exceeded errors
      if (isQuotaExceededError(error)) {
        const message = 'Firebase quota exceeded. Using local mode.';
        toast.error(message);
        
        // Create a local habit with a temporary ID
        const tempId = `local_${Date.now()}`;
        const tempHabit: Habit = {
          ...habitData,
          id: tempId,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        };
        
        // Add to local state
        setHabits(currentHabits => [...(currentHabits || []), tempHabit]);
        
        return {
          data: tempHabit,
          status: 'success',
          isLocal: true
        };
      }
      
      // Handle other errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to create habit';
      toast.error(errorMessage);
      return {
        error: errorMessage,
        status: 'error'
      };
    } finally {
      setIsLoading(false);
    }
  }, [user, activeHabitSetId]);
  
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
    if (!user) {
      return { 
        error: 'User not authenticated', 
        status: 'error' 
      };
    }
    
    setIsLoading(true);
    try {
      console.log('Creating habit set with data:', habitSetData);
      const result = await habitSetsApi.create(user.uid, habitSetData);
      console.log('Habit set creation API result:', result);
      
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
      }
      
      return result;
    } catch (error) {
      console.error('Error creating habit set:', error);
      
      // Handle quota exceeded errors specially
      if (isQuotaExceededError(error)) {
        toast.error('Firebase quota exceeded. Using local mode until quota resets.');
        
        // Create a temporary local habit set with a fake ID
        const tempId = `local_${Date.now()}`;
        const tempHabitSet: HabitSet = {
          ...habitSetData,
          id: tempId,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        };
        
        // Add to local state
        setHabitSets(prev => [...prev, tempHabitSet]);
        
        // Set as active if needed
        if (habitSets.length === 0) {
          setActiveHabitSetId(tempId);
        }
        
        return {
          data: tempHabitSet,
          status: 'success',
          isLocal: true
        };
      }
      
      return { 
        error: error instanceof Error ? error.message : 'Unknown error creating habit set', 
        status: 'error' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [user, habitSets]);
  
  // Create a default habit set if none exists
  useEffect(() => {
    const createDefaultHabitSet = async () => {
      if (user && !loadingHabitSets && (!habitSets || habitSets.length === 0)) {
        console.log('Creating default habit set for user:', user.uid);
        try {
          const result = await createHabitSet({
            name: 'My Habits',
            description: 'Default habit set',
            isPremium: false,
            isActive: true
          });
          
          console.log('Default habit set creation result:', result);
          
          if (result.status === 'success') {
            toast.success('Created your first habit set!');
          } else if (result.error) {
            console.error('Failed to create default habit set:', result.error);
          }
        } catch (error) {
          console.error('Error creating default habit set:', error);
        }
      }
    };
    
    createDefaultHabitSet();
  }, [user, loadingHabitSets, habitSets, createHabitSet]);
  
  // Set active habit set
  const setActiveHabitSet = useCallback(async (
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
      console.log('Setting active habit set:', habitSetId);
      const result = await habitSetsApi.setActive(user.uid, habitSetId);
      console.log('Set active result:', result);
      
      if (result.status === 'success') {
        setActiveHabitSetId(habitSetId);
        
        // Update local state to reflect the change immediately
        setHabitSets(prev => 
          prev.map(set => ({
            ...set,
            isActive: set.id === habitSetId
          }))
        );
        
        toast.success('Habit set activated');
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
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
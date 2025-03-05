import { useState, useCallback, useMemo } from 'react';
import { useFirebaseSubscription } from './useFirebaseSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { habitsApi, habitSetsApi } from '@/services/firestore/api';
import { getHabitsRef, getHabitSetsRef } from '@/services/firestore/collections';
import { Habit, HabitSet, ApiResponse } from '@/types';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for managing habits and habit sets
 */
export function useHabits() {
  const { user } = useAuth();
  const [activeHabitSetId, setActiveHabitSetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Subscribe to habit sets
  const habitSetsRef = useMemo(() => {
    return user ? getHabitSetsRef(user.uid) : null;
  }, [user]);
  
  const { 
    data: habitSets, 
    loading: loadingHabitSets, 
    error: habitSetsError 
  } = useFirebaseSubscription<HabitSet>(habitSetsRef);
  
  // Find active habit set
  const activeHabitSet = useMemo(() => {
    if (!habitSets || !Array.isArray(habitSets)) return null;
    
    // First try to find the one marked as active
    const active = habitSets.find(set => set.isActive);
    if (active) {
      setActiveHabitSetId(active.id);
      return active;
    }
    
    // If no active set is found and we have sets, use the first one
    if (habitSets.length > 0) {
      setActiveHabitSetId(habitSets[0].id);
      return habitSets[0];
    }
    
    return null;
  }, [habitSets]);
  
  // Subscribe to habits in the active habit set
  const habitsRef = useMemo(() => {
    if (!user || !activeHabitSetId) return null;
    return getHabitsRef(user.uid, activeHabitSetId);
  }, [user, activeHabitSetId]);
  
  const { 
    data: habits, 
    loading: loadingHabits, 
    error: habitsError 
  } = useFirebaseSubscription<Habit>(habitsRef);
  
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
      const result = await habitsApi.create(user.uid, activeHabitSetId, habitData);
      
      if (result.status === 'success') {
        toast.success('Habit created successfully');
      }
      
      return result;
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
  ): Promise<ApiResponse<HabitSet>> => {
    if (!user) {
      return { 
        error: 'User not authenticated', 
        status: 'error' 
      };
    }
    
    setIsLoading(true);
    try {
      const result = await habitSetsApi.create(user.uid, habitSetData);
      
      if (result.status === 'success' && result.data) {
        // Set as active if it's the first one
        if (!activeHabitSetId) {
          await habitSetsApi.setActive(user.uid, result.data.id);
          setActiveHabitSetId(result.data.id);
        }
        
        toast.success('Habit set created successfully');
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [user, activeHabitSetId]);
  
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
      const result = await habitSetsApi.setActive(user.uid, habitSetId);
      
      if (result.status === 'success') {
        setActiveHabitSetId(habitSetId);
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
      const result = await habitSetsApi.delete(user.uid, habitSetId);
      
      if (result.status === 'success') {
        // If we deleted the active set, we need to select another one
        if (habitSetId === activeHabitSetId && habitSets && Array.isArray(habitSets) && habitSets.length > 1) {
          const remainingSets = habitSets.filter(set => set.id !== habitSetId);
          if (remainingSets.length > 0) {
            await habitSetsApi.setActive(user.uid, remainingSets[0].id);
            setActiveHabitSetId(remainingSets[0].id);
          } else {
            setActiveHabitSetId(null);
          }
        }
        
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
    // Data
    habitSets: Array.isArray(habitSets) ? habitSets : [],
    habits: Array.isArray(habits) ? habits : [],
    activeHabitSet,
    activeHabitSetId,
    
    // Loading states
    isLoading,
    loadingHabitSets,
    loadingHabits,
    
    // Errors
    habitSetsError,
    habitsError,
    
    // Actions
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    createHabitSet,
    setActiveHabitSet,
    deleteHabitSet,
    
    // Helpers
    isHabitCompletedToday
  };
} 
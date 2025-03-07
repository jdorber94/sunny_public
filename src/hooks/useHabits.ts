import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getHabits, 
  subscribeToHabits, 
  createHabit, 
  updateHabit, 
  deleteHabit, 
  logHabitCompletion,
  Habit 
} from '@/lib/firestoreService';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for managing habits
 */
export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to habits changes
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const unsubscribe = subscribeToHabits(user.uid, (fetchedHabits) => {
      setHabits(fetchedHabits);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  // Add a new habit
  const addHabit = useCallback(async (habit: Omit<Habit, 'id'>) => {
    if (!user) {
      toast.error('You must be logged in to add habits');
      return null;
    }

    try {
      const result = await createHabit(user.uid, habit);
      
      if (result.success) {
        toast.success('Habit added successfully');
        return result.habit;
      } else {
        toast.error('Failed to add habit');
        return null;
      }
    } catch (err) {
      console.error('Error adding habit:', err);
      toast.error('An error occurred while adding the habit');
      return null;
    }
  }, [user]);

  // Update an existing habit
  const updateHabitById = useCallback(async (habitId: string, updates: Partial<Habit>) => {
    if (!user) {
      toast.error('You must be logged in to update habits');
      return false;
    }

    try {
      const result = await updateHabit(user.uid, habitId, updates);
      
      if (result.success) {
        toast.success('Habit updated successfully');
        return true;
      } else {
        toast.error('Failed to update habit');
        return false;
      }
    } catch (err) {
      console.error('Error updating habit:', err);
      toast.error('An error occurred while updating the habit');
      return false;
    }
  }, [user]);

  // Delete a habit
  const deleteHabitById = useCallback(async (habitId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete habits');
      return false;
    }

    try {
      const result = await deleteHabit(user.uid, habitId);
      
      if (result.success) {
        toast.success('Habit deleted successfully');
        return true;
      } else {
        toast.error('Failed to delete habit');
        return false;
      }
    } catch (err) {
      console.error('Error deleting habit:', err);
      toast.error('An error occurred while deleting the habit');
      return false;
    }
  }, [user]);

  // Log a habit completion
  const logHabit = useCallback(async (habitId: string, date: string) => {
    if (!user) {
      toast.error('You must be logged in to log habits');
      return false;
    }

    try {
      const result = await logHabitCompletion(user.uid, habitId, date);
      
      if (result.success) {
        toast.success('Habit logged successfully');
        return true;
      } else {
        if (result.error === 'Habit already logged for this date') {
          toast.error('This habit is already logged for today');
        } else {
          toast.error('Failed to log habit');
        }
        return false;
      }
    } catch (err) {
      console.error('Error logging habit:', err);
      toast.error('An error occurred while logging the habit');
      return false;
    }
  }, [user]);

  // Get a habit by ID
  const getHabitById = useCallback((habitId: string) => {
    return habits.find(habit => habit.id === habitId) || null;
  }, [habits]);

  return {
    habits,
    isLoading,
    error,
    addHabit,
    updateHabitById,
    deleteHabitById,
    logHabit,
    getHabitById
  };
} 
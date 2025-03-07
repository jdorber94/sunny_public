/**
 * Utility functions for working with localStorage as a fallback
 * when Firebase operations fail
 */
import { Habit, HabitSet } from '@/types';

// Keys for localStorage
const KEYS = {
  HABIT_SETS: 'sunny_habit_sets',
  ACTIVE_HABIT_SET: 'sunny_active_habit_set',
  HABITS: 'sunny_habits_',  // Will be appended with habit set ID
  USER: 'sunny_user'
};

// Save a user to localStorage
export function saveUserToLocalStorage(user: any): void {
  try {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
}

// Get user from localStorage
export function getUserFromLocalStorage(): any | null {
  try {
    const user = localStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user from localStorage:', error);
    return null;
  }
}

// Save habit sets to localStorage
export function saveHabitSetsToLocalStorage(habitSets: HabitSet[]): void {
  try {
    localStorage.setItem(KEYS.HABIT_SETS, JSON.stringify(habitSets));
  } catch (error) {
    console.error('Error saving habit sets to localStorage:', error);
  }
}

// Get habit sets from localStorage
export function getHabitSetsFromLocalStorage(): HabitSet[] {
  try {
    const habitSets = localStorage.getItem(KEYS.HABIT_SETS);
    return habitSets ? JSON.parse(habitSets) : [];
  } catch (error) {
    console.error('Error getting habit sets from localStorage:', error);
    return [];
  }
}

// Save active habit set ID to localStorage
export function saveActiveHabitSetToLocalStorage(habitSetId: string): void {
  try {
    localStorage.setItem(KEYS.ACTIVE_HABIT_SET, habitSetId);
  } catch (error) {
    console.error('Error saving active habit set to localStorage:', error);
  }
}

// Get active habit set ID from localStorage
export function getActiveHabitSetFromLocalStorage(): string | null {
  try {
    return localStorage.getItem(KEYS.ACTIVE_HABIT_SET);
  } catch (error) {
    console.error('Error getting active habit set from localStorage:', error);
    return null;
  }
}

// Save habits for a habit set to localStorage
export function saveHabitsToLocalStorage(habitSetId: string, habits: Habit[]): void {
  try {
    localStorage.setItem(`${KEYS.HABITS}${habitSetId}`, JSON.stringify(habits));
  } catch (error) {
    console.error('Error saving habits to localStorage:', error);
  }
}

// Get habits for a habit set from localStorage
export function getHabitsFromLocalStorage(habitSetId: string): Habit[] {
  try {
    const habits = localStorage.getItem(`${KEYS.HABITS}${habitSetId}`);
    return habits ? JSON.parse(habits) : [];
  } catch (error) {
    console.error('Error getting habits from localStorage:', error);
    return [];
  }
}

// Create a new habit set in localStorage
export function createHabitSetInLocalStorage(habitSet: Omit<HabitSet, 'id'>): HabitSet {
  try {
    const habitSets = getHabitSetsFromLocalStorage();
    const newHabitSet: HabitSet = {
      ...habitSet,
      id: `local_${Date.now()}`,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    };
    
    // If this is the first habit set, make it active
    if (habitSets.length === 0) {
      newHabitSet.isActive = true;
      saveActiveHabitSetToLocalStorage(newHabitSet.id);
    }
    
    habitSets.push(newHabitSet);
    saveHabitSetsToLocalStorage(habitSets);
    
    // Initialize empty habits array for this set
    saveHabitsToLocalStorage(newHabitSet.id, []);
    
    return newHabitSet;
  } catch (error) {
    console.error('Error creating habit set in localStorage:', error);
    throw error;
  }
}

// Create a new habit in localStorage
export function createHabitInLocalStorage(habitSetId: string, habit: Omit<Habit, 'id'>): Habit {
  try {
    const habits = getHabitsFromLocalStorage(habitSetId);
    const newHabit: Habit = {
      ...habit,
      id: `local_${Date.now()}`,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    };
    
    habits.push(newHabit);
    saveHabitsToLocalStorage(habitSetId, habits);
    
    return newHabit;
  } catch (error) {
    console.error('Error creating habit in localStorage:', error);
    throw error;
  }
}

// Set a habit set as active in localStorage
export function setActiveHabitSetInLocalStorage(habitSetId: string): boolean {
  try {
    const habitSets = getHabitSetsFromLocalStorage();
    
    // Update all habit sets
    const updatedHabitSets = habitSets.map(set => ({
      ...set,
      isActive: set.id === habitSetId,
      updatedAt: new Date() as any
    }));
    
    saveHabitSetsToLocalStorage(updatedHabitSets);
    saveActiveHabitSetToLocalStorage(habitSetId);
    
    return true;
  } catch (error) {
    console.error('Error setting active habit set in localStorage:', error);
    return false;
  }
}

// Initialize local storage with a default habit set if none exists
export function initializeLocalStorage(): void {
  try {
    const habitSets = getHabitSetsFromLocalStorage();
    
    // If no habit sets exist, create a default one
    if (habitSets.length === 0) {
      const defaultHabitSet = createHabitSetInLocalStorage({
        name: 'My Habits',
        description: 'Default habit set',
        isPremium: false,
        isActive: true
      });
      
      console.log('Created default habit set in localStorage:', defaultHabitSet);
    }
  } catch (error) {
    console.error('Error initializing localStorage:', error);
  }
} 
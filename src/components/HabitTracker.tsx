'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from './Sparkles';
import { WeeklyProgress } from './WeeklyProgress';
import { LevelUpCelebration } from './LevelUpCelebration';
import { format, isToday } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Habit, 
  UserStats, 
  saveHabits, 
  getHabits, 
  subscribeToHabits, 
  saveUserStats, 
  getUserStats, 
  subscribeToUserStats,
  getActiveHabitSet,
  setActiveHabitSet,
  HabitSet,
  subscribeToHabitSets,
  createHabitSet,
  subscribeToHabitsInSet,
  saveHabitsToSet,
  getHabitsFromSet
} from '@/lib/firestoreService';
import HabitSetManager from './HabitSetManager';
import { toast } from 'react-hot-toast';
import { collection, writeBatch, getDocs, doc, serverTimestamp, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, FirestoreDataConverter, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseSubscription } from '@/hooks/useFirebaseSubscription';
import { ErrorBoundary } from './ErrorBoundary';
import HabitList from './HabitList';
import ProgressDisplay from './ProgressDisplay';
import AddHabitForm from './AddHabitForm';
import Link from 'next/link';
import { calculateLevel } from '@/utils/levelCalculator';
import QuestPet from './QuestPet';

// Constants
const MAX_HABITS = 10;
const XP_PER_COMPLETION = 50;
const MAX_DAILY_XP = 500;

// Firestore converters
const habitSetConverter: FirestoreDataConverter<HabitSet> = {
  toFirestore: (habitSet) => ({
    name: habitSet.name,
    description: habitSet.description,
    isPremium: habitSet.isPremium,
    isActive: habitSet.isActive,
    createdAt: habitSet.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  }),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name,
      description: data.description,
      isPremium: data.isPremium || false,
      isActive: data.isActive,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
    };
  },
};

const habitConverter: FirestoreDataConverter<Habit> = {
  toFirestore: (habit) => ({
    name: habit.name,
    logs: habit.logs,
    xp: habit.xp,
    streak: habit.streak,
    category: habit.category,
    daysOfWeek: habit.daysOfWeek,
    createdAt: habit.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  }),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name,
      logs: data.logs || [],
      xp: data.xp || 0,
      streak: data.streak,
      category: data.category,
      daysOfWeek: data.daysOfWeek,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
    };
  },
};

const userStatsConverter: FirestoreDataConverter<UserStats> = {
  toFirestore: (stats) => ({
    totalXP: stats.totalXP,
    dailyXP: stats.dailyXP,
    createdAt: stats.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  }),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      totalXP: data.totalXP || 0,
      dailyXP: {
        date: data.dailyXP?.date || new Date().toISOString().split('T')[0],
        xp: data.dailyXP?.xp || 0,
      },
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
    };
  },
};

// Checkmark icon component with animation - enhanced with smooth transitions
const CheckmarkIcon = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => {
  return (
    <button
      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transform transition-all duration-300 ease-in-out ${
        checked 
          ? 'bg-gradient-to-br from-green-400 to-green-500 border-transparent scale-105' 
          : 'bg-white/80 backdrop-blur-sm border-gray-200 dark:bg-gray-800/80 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      }`}
      onClick={onClick}
    >
      {checked && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5 text-white transform scale-110 transition-transform duration-300"
          viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      )}
    </button>
  );
};

// Helper function to calculate streak
const calculateStreak = (logs: string[]): number => {
  if (!logs.length) return 0;
  
  // Sort logs by date
  const sortedLogs = [...logs].sort();
  
  // Get today and yesterday
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Check if today or yesterday is in logs
  const hasToday = logs.includes(todayStr);
  const hasYesterday = logs.includes(yesterdayStr);
  
  if (!hasToday && !hasYesterday) return 0;
  
  // Count consecutive days
  let streak = 1;
  let currentDate = hasToday ? todayStr : yesterdayStr;
  
  while (true) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    if (logs.includes(prevDateStr)) {
      streak++;
      currentDate = prevDateStr;
    } else {
      break;
    }
  }
  
  return streak;
};

export default function HabitTracker() {
  const { user, authLoading } = useAuth();
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  
  // Subscribe to habit sets
  const { data: rawHabitSets, loading: loadingHabitSets } = useFirebaseSubscription<HabitSet[]>(
    user ? collection(db, 'users', user.uid, 'habitSets').withConverter(habitSetConverter) : null,
    {
      onError: (error) => {
        console.error('Error subscribing to habit sets:', error);
        toast.error('Failed to load habit sets');
      }
    }
  );
  const habitSets = rawHabitSets ?? [];

  // Find the active set
  const activeSet = habitSets.find(set => set.isActive) || null;
  console.log('Active habit set:', activeSet);

  // Subscribe to habits for the active set
  const { data: rawHabits, loading: loadingHabits } = useFirebaseSubscription<Habit[]>(
    user && activeSet ? collection(db, 'users', user.uid, 'habitSets', activeSet.id, 'habits').withConverter(habitConverter) : null,
    {
      onError: (error) => {
        console.error('Error subscribing to habits:', error);
        toast.error('Failed to load habits');
      }
    }
  );
  const habits = rawHabits ?? [];

  // Get user stats
  const defaultStats: UserStats = {
    totalXP: 0,
    dailyXP: { date: new Date().toISOString().split('T')[0], xp: 0 },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  const { data: rawStats, loading: loadingStats } = 
    useFirebaseSubscription<UserStats>(
      user ? doc(db, 'users', user.uid, 'stats', 'daily').withConverter(userStatsConverter) : null
    );
  const stats = rawStats ?? defaultStats;

  // Calculate level
  const level = calculateLevel(stats.totalXP);

  // Function to handle level up
  const handleLevelUp = (prev: number, curr: number) => {
    if (curr > prev) {
      setPreviousLevel(prev);
      setShowLevelUp(true);
    }
  };

  // Function to handle switching habit sets
  const handleSwitchSet = async (setId: string, setName: string) => {
    if (!user || !activeSet) return;

    try {
      const batch = writeBatch(db);

      // Update current active set
      if (activeSet) {
        batch.update(doc(db, 'users', user.uid, 'habitSets', activeSet.id), {
          isActive: false,
          updatedAt: serverTimestamp()
        });
      }

      // Update new active set
      batch.update(doc(db, 'users', user.uid, 'habitSets', setId), {
        isActive: true,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      toast.success(`Switched to ${setName}`);
    } catch (error) {
      console.error('Error switching habit set:', error);
      toast.error('Failed to switch habit set');
    }
  };

  // Function to create a new habit set
  const handleCreateSet = async (name: string) => {
    if (!user) return;

    try {
      const newSet = {
        name,
        isActive: false,
        isPremium: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'habitSets'), newSet);
      toast.success('Created new habit set');
    } catch (error) {
      console.error('Error creating habit set:', error);
      toast.error('Failed to create habit set');
    }
  };

  // Function to edit a habit set
  const handleEditSet = async (setId: string, name: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid, 'habitSets', setId), {
        name,
        updatedAt: serverTimestamp()
      });
      toast.success('Updated habit set');
    } catch (error) {
      console.error('Error updating habit set:', error);
      toast.error('Failed to update habit set');
    }
  };

  // Function to delete a habit set
  const handleDeleteSet = async (setId: string) => {
    if (!user) return;

    try {
      // If deleting active set, make another set active
      if (activeSet?.id === setId) {
        const newActiveSet = habitSets?.find(set => set.id !== setId);
        if (newActiveSet) {
          await handleSwitchSet(newActiveSet.id, newActiveSet.name);
        }
      }

      await deleteDoc(doc(db, 'users', user.uid, 'habitSets', setId));
      toast.success('Deleted habit set');
    } catch (error) {
      console.error('Error deleting habit set:', error);
      toast.error('Failed to delete habit set');
    }
  };

  // Function to add a new habit
  const addHabit = async (name: string) => {
    if (!user || !activeSet) {
      toast.error('Please wait while we set up your habit tracking');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a habit name');
      return;
    }
    
    if (habits.length >= MAX_HABITS) {
      toast.error(`You can only have ${MAX_HABITS} habits at a time`);
      return;
    }

    try {
      // Create a new document reference with auto-generated ID
      const newHabitRef = doc(collection(db, 'users', user.uid, 'habitSets', activeSet.id, 'habits'));
      
      // Create the habit data
      const newHabit: Omit<Habit, 'id'> = {
        name: name.trim(),
      logs: [],
        xp: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Save the habit
      await setDoc(newHabitRef, newHabit);
      console.log("Successfully added new habit:", newHabit);
      toast.success('Added new habit');
    } catch (error) {
      console.error('Error adding habit:', error);
      toast.error('Failed to add habit');
      throw error;
    }
  };

  // Function to delete a habit
  const deleteHabit = async (id: string) => {
    if (!user || !activeSet) {
      toast.error("You must be logged in and have an active habit set to delete habits");
      return;
    }

    try {
      console.log("Deleting habit:", { id, activeSetId: activeSet.id });
      const habitRef = doc(db, 'users', user.uid, 'habitSets', activeSet.id, 'habits', id);
      await deleteDoc(habitRef);
      console.log("Successfully deleted habit:", id);
      toast.success("Habit deleted");
    } catch (error) {
      console.error("Error deleting habit:", error);
      toast.error("Failed to delete habit");
    }
  };

  // Function to toggle habit completion
  const toggleHabitCompletion = async (id: string) => {
    if (!user || !activeSet || !habits) {
      console.log("Toggle failed: Missing user, activeSet, or habits", { user: !!user, activeSet: !!activeSet, habits: !!habits });
      return;
    }

    const habit = habits.find(h => h.id === id);
    if (!habit) {
      console.log("Toggle failed: Habit not found", { id });
      return;
    }

    console.log("Toggling habit:", { id, habit, activeSetId: activeSet.id });
    const today = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.logs.includes(today);

    try {
      const habitRef = doc(db, 'users', user.uid, 'habitSets', activeSet.id, 'habits', id);
      const statsRef = doc(db, 'users', user.uid, 'stats', 'daily');

      const batch = writeBatch(db);

      // Update habit logs
      const updatedHabit = {
        logs: isCompletedToday
          ? habit.logs.filter(date => date !== today)
          : [...habit.logs, today],
        updatedAt: serverTimestamp()
      };
      batch.update(habitRef, updatedHabit);

      // Update stats only when completing (not when uncompleting)
      if (!isCompletedToday) {
        const newStats = {
          totalXP: stats.totalXP + XP_PER_COMPLETION,
            dailyXP: {
            date: today,
            xp: Math.min(MAX_DAILY_XP, (stats.dailyXP?.xp ?? 0) + XP_PER_COMPLETION)
          },
          updatedAt: serverTimestamp()
        };
        batch.set(statsRef, newStats, { merge: true });
      }

      await batch.commit();
      console.log("Successfully toggled habit:", { id, isCompletedToday: !isCompletedToday });
    } catch (error) {
      console.error("Error updating habit:", error);
      toast.error("Failed to update habit");
    }
  };

  // Show loading UI only during authentication
  if (authLoading) {
  return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black dark:border-white border-t-transparent"></div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Checking authentication...
        </div>
      </div>
    );
  }

  // If not loading and no user, show sign in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Welcome to Habit Tracker
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Sign in to start tracking your habits, earn XP, and level up your life!
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Sign In to Get Started
          </Link>
        </div>
              </div>
    );
  }

  // Show loading for habit sets
  if (loadingHabitSets) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black dark:border-white border-t-transparent"></div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Loading your habit sets...
        </div>
                        </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <HabitSetManager
          habitSets={habitSets}
          activeSetId={activeSet?.id || null}
          onSwitchSet={handleSwitchSet}
          onCreateSet={handleCreateSet}
          onEditSet={handleEditSet}
          onDeleteSet={handleDeleteSet}
          isPremium={!!user?.isPremium}
        />

        {activeSet ? (
          <>
            <ProgressDisplay
              habits={habits}
              totalXP={stats.totalXP}
              dailyXP={stats.dailyXP.xp}
              onLevelUp={handleLevelUp}
            />

            <AddHabitForm
              key={activeSet.id}
              onAddHabit={addHabit}
              maxHabits={MAX_HABITS}
              currentHabitCount={habits?.length ?? 0}
            />

            <HabitList
              habits={habits}
              onToggleHabit={toggleHabitCompletion}
              onDeleteHabit={deleteHabit}
              onEditHabit={setSelectedHabit}
            />

            {showLevelUp && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center animate-bounce-slow">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Level Up!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    You've reached level {level}
                  </p>
                </div>
          </div>
        )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">
              Create a habit set to get started!
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 
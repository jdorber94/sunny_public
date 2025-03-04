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
import { collection, writeBatch, getDocs, doc, serverTimestamp, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseSubscription } from '@/hooks/useFirebaseSubscription';
import { ErrorBoundary } from './ErrorBoundary';
import HabitList from './HabitList';
import ProgressDisplay from './ProgressDisplay';
import AddHabitForm from './AddHabitForm';

// Constants
const MAX_HABITS = 10;
const XP_PER_COMPLETION = 10;
const MAX_DAILY_XP = 50;

// Calculate level based on XP
const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
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
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitSets, setHabitSets] = useState<HabitSet[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<UserStats>({
    totalXP: 0,
    dailyXP: { date: new Date().toISOString().split('T')[0], xp: 0 }
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showHabitSetManager, setShowHabitSetManager] = useState(true);
  const [activeHabitSetState, setActiveHabitSetState] = useState<{ id: string; name: string } | null>(null);
  const [showNewSetForm, setShowNewSetForm] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [showCreateSetModal, setShowCreateSetModal] = useState(false);
  const [canCreateHabitSet, setCanCreateHabitSet] = useState(true);
  const [showEditSetModal, setShowEditSetModal] = useState(false);
  const [editSetId, setEditSetId] = useState('');
  const [editSetName, setEditSetName] = useState('');
  const [editSetDescription, setEditSetDescription] = useState('');
  const [showDeleteSetModal, setShowDeleteSetModal] = useState(false);
  const [deleteSetId, setDeleteSetId] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const statsUnsubscribeRef = useRef<(() => void) | null>(null);
  const habitsUnsubscribeRef = useRef<(() => void) | null>(null);
  const habitSetsUnsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to habit sets
  const { data: habitSetList = [], loading: loadingHabitSets } = useFirebaseSubscription<HabitSet[]>(
    user ? collection(db, 'users', user.uid, 'habitSets') : null,
    { errorMessage: 'Failed to load habit sets' }
  ) ?? { data: [], loading: false };

  // Get active habit set
  const activeSet = habitSetList?.find(set => set.isActive);

  // Subscribe to habits in active set
  const { data: habitList = [], loading: loadingHabits } = useFirebaseSubscription<Habit[]>(
    user && activeSet ? collection(db, 'users', user.uid, 'habitSets', activeSet.id, 'habits') : null,
    { errorMessage: 'Failed to load habits' }
  ) ?? { data: [], loading: false };

  // Subscribe to user stats
  const defaultStats: UserStats = {
    totalXP: 0,
    dailyXP: { date: new Date().toISOString().split('T')[0], xp: 0 }
  };
  const { data: userStats = defaultStats, loading: loadingStats } = useFirebaseSubscription<UserStats>(
    user ? doc(db, 'users', user.uid, 'stats', 'daily') : null,
    { errorMessage: 'Failed to load stats' }
  ) ?? { data: defaultStats, loading: false };

  // Calculate current level
  const level = calculateLevel(userStats?.totalXP ?? 0);

  // Function to subscribe to habits for the current active habit set
  const subscribeToActiveSetHabits = (userId: string, activeSetId: string) => {
    console.log(`Subscribing to habits for set ${activeSetId}`);
    
    // Clean up previous subscription if it exists
    if (habitsUnsubscribeRef.current) {
      console.log("Cleaning up previous habits subscription");
      habitsUnsubscribeRef.current();
      habitsUnsubscribeRef.current = null;
    }
    
    // Subscribe to habits for this specific set
    const habitsCollectionRef = collection(db, 'users', userId, 'habitSets', activeSetId, 'habits');
    
    console.log(`Setting up onSnapshot for habits collection: users/${userId}/habitSets/${activeSetId}/habits`);
    
    const unsubscribe = onSnapshot(habitsCollectionRef, (querySnapshot) => {
      console.log(`Received snapshot with ${querySnapshot.size} habits for set ${activeSetId}`);
      
      const firestoreHabits: Habit[] = [];
      querySnapshot.forEach((doc) => {
        const habitData = doc.data() as Habit;
        firestoreHabits.push(habitData);
      });
      
      // Only update if we actually got habits or if we have no habits
      // This prevents clearing habits when there's a temporary network issue
      if (firestoreHabits.length > 0 || habits.length === 0) {
        console.log(`Updating habits state with ${firestoreHabits.length} habits`);
        setHabits(firestoreHabits);
        // Also update localStorage
        localStorage.setItem('habits', JSON.stringify(firestoreHabits));
      } else {
        console.log(`No habits received for set ${activeSetId}, keeping current habits`);
      }
    }, (error) => {
      console.error(`Error in habits subscription for set ${activeSetId}:`, error);
    });
    
    habitsUnsubscribeRef.current = unsubscribe;
    return unsubscribe;
  };

  // Function to directly save habits to a specific set
  const saveHabitsToCurrentSet = async () => {
    if (!user || !activeHabitSetState || habits.length === 0) return;
    
    try {
      console.log(`Directly saving ${habits.length} habits to set ${activeHabitSetState.id}`);
      const success = await saveHabitsToSet(user.uid, activeHabitSetState.id, habits);
      if (success) {
        console.log(`Successfully saved habits to set ${activeHabitSetState.id}`);
      } else {
        console.error(`Failed to save habits to set ${activeHabitSetState.id}`);
      }
    } catch (error) {
      console.error('Error saving habits to current set:', error);
    }
  };

  // Function to load habits from a specific set
  const loadHabitsFromSet = async (setId: string) => {
    if (!user) return;
    
    try {
      console.log(`Directly loading habits from set ${setId}`);
      const loadedHabits = await getHabitsFromSet(user.uid, setId);
      console.log(`Loaded ${loadedHabits.length} habits from set ${setId}`);
      setHabits(loadedHabits);
      localStorage.setItem('habits', JSON.stringify(loadedHabits));
    } catch (error) {
      console.error(`Error loading habits from set ${setId}:`, error);
    }
  };

  // Handle switching habit sets
  const handleSwitchSet = async (setId: string, setName: string) => {
    if (!user) {
      toast.error('You must be logged in to switch habit sets');
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // Update current active set
      if (activeSet) {
        batch.update(doc(db, 'users', user.uid, 'habitSets', activeSet.id), {
          isActive: false,
          updatedAt: serverTimestamp()
        });
      }
      
      // Set new active set
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

  // Effect to initialize data
  useEffect(() => {
    console.log("=== INITIALIZING HABIT TRACKER ===");
    console.log("User state:", user ? `Authenticated: ${user.uid}` : "Not authenticated");
    
    // Initialize from localStorage if not authenticated
    if (!user) {
      console.log("Loading from localStorage (no user)");
      const savedHabits = localStorage.getItem('habits');
      const savedStats = localStorage.getItem('habitStats');
      
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }
      
      if (savedStats) {
        setStats(JSON.parse(savedStats));
        
        // Calculate level
        const parsedStats = JSON.parse(savedStats);
        const level = calculateLevel(parsedStats.totalXP);
        setCurrentLevel(level);
      }
    }
    
    // If user is authenticated, load from Firestore
    if (user) {
      console.log(`Loading data for user: ${user.uid}`);
      
      // First, directly fetch the active habit set to ensure we have one
      const initializeHabitSets = async () => {
        try {
          console.log("Directly fetching active habit set from Firestore");
          const activeSet = await getActiveHabitSet(user.uid);
          
          if (activeSet) {
            console.log(`Found active set: ${activeSet.id} - ${activeSet.name}`);
            setActiveHabitSetState({
              id: activeSet.id,
              name: activeSet.name
            });
            
            // Subscribe to habits for this set
            subscribeToActiveSetHabits(user.uid, activeSet.id);
          } else {
            console.log("No active habit set found, checking for any habit sets");
            
            // Check if there are any habit sets
            const habitSetsCollectionRef = collection(db, 'users', user.uid, 'habitSets');
            const habitSetsSnapshot = await getDocs(habitSetsCollectionRef);
            
            if (!habitSetsSnapshot.empty) {
              console.log(`Found ${habitSetsSnapshot.size} habit sets, setting first one as active`);
              
              // Get the first habit set
              const firstDoc = habitSetsSnapshot.docs[0];
              const firstSetData = firstDoc.data();
              
              // Set it as active in Firestore
              await updateDoc(doc(db, 'users', user.uid, 'habitSets', firstDoc.id), {
                isActive: true,
                updatedAt: serverTimestamp()
              });
              
              console.log(`Set habit set ${firstDoc.id} as active`);
              
              // Update local state
              setActiveHabitSetState({
                id: firstDoc.id,
                name: firstSetData.name || "Unnamed Set"
              });
              
              // Subscribe to habits for this set
              subscribeToActiveSetHabits(user.uid, firstDoc.id);
            } else {
              console.log("No habit sets found, creating default habit set");
              
              // Create a default habit set
              const defaultSetRef = doc(collection(db, 'users', user.uid, 'habitSets'));
              const defaultSet = {
                name: "My Habits",
                description: "Your default habit set",
                isActive: true,
                isPremium: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              
              await setDoc(defaultSetRef, defaultSet);
              console.log(`Created default set with ID: ${defaultSetRef.id}`);
              
              // Update local state
              setActiveHabitSetState({
                id: defaultSetRef.id,
                name: "My Habits"
              });
              
              // Subscribe to habits for this set
              subscribeToActiveSetHabits(user.uid, defaultSetRef.id);
            }
          }
        } catch (error) {
          console.error("Error initializing habit sets:", error);
        }
      };
      
      // Initialize habit sets immediately
      initializeHabitSets();
      
      // Then set up subscriptions for real-time updates
      
      // Subscribe to habit sets
      const habitSetsUnsubscribe = subscribeToHabitSets(user.uid, (sets) => {
        console.log(`Subscription update: Received ${sets.length} habit sets from Firestore`);
        setHabitSets(sets);
      });
      
      habitSetsUnsubscribeRef.current = habitSetsUnsubscribe;
      
      // Subscribe to user stats
      const statsUnsubscribe = subscribeToUserStats(user.uid, (firestoreStats) => {
        if (firestoreStats) {
        // Reset daily XP if it's a new day
          const today = new Date().toISOString().split('T')[0];
          if (firestoreStats.dailyXP.date !== today) {
            firestoreStats.dailyXP = { date: today, xp: 0 };
            // Update Firestore with the reset daily XP
            saveUserStats(user.uid, firestoreStats);
          }
          
          setStats(firestoreStats);
          
          // Check for level up
          const newLevel = calculateLevel(firestoreStats.totalXP);
          if (newLevel > currentLevel) {
            setPreviousLevel(currentLevel);
            setCurrentLevel(newLevel);
            setShowLevelUp(true);
          } else {
            setCurrentLevel(newLevel);
          }
          
          // Also update localStorage
          localStorage.setItem('habitStats', JSON.stringify(firestoreStats));
        }
      });
      
      statsUnsubscribeRef.current = statsUnsubscribe;
    }
    
    return () => {
      // Cleanup subscriptions
      console.log("Cleaning up subscriptions");
      if (habitsUnsubscribeRef.current) {
        habitsUnsubscribeRef.current();
      }
      if (statsUnsubscribeRef.current) {
        statsUnsubscribeRef.current();
      }
      if (habitSetsUnsubscribeRef.current) {
        habitSetsUnsubscribeRef.current();
      }
    };
  }, [user]);

  // Add a new habit
  const addHabit = async () => {
    console.log("=== ADD HABIT FUNCTION CALLED ===");
    console.log("Current user:", user ? `Authenticated: ${user.uid}` : "Not authenticated");
    console.log("Active habit set:", activeHabitSetState);
    console.log("New habit name:", newHabitName);
    
    if (!user) {
      console.log("Error: No user authenticated");
      toast.error("You must be logged in to add habits");
      return;
    }
    
    if (!activeHabitSetState || !activeHabitSetState.id) {
      console.log("Error: No active habit set found");
      toast.error("No active habit set found. Please create or select a habit set first.");
      return;
    }

    if (!newHabitName.trim()) {
      console.log("Error: Empty habit name");
      toast.error("Please enter a habit name");
      return;
    }

    try {
      // Generate a unique ID for the new habit
      const habitId = Date.now();
      console.log(`Generated habit ID: ${habitId}`);
      
      // Create the new habit object
      const newHabit: Habit = {
        id: habitId,
        name: newHabitName.trim(),
        logs: [],
        streak: 0,
        xp: 0
      };
      
      console.log("New habit object:", newHabit);
      
      // Create the Firestore document reference
      const habitDocRef = doc(
        db, 
        'users', 
        user.uid, 
        'habitSets', 
        activeHabitSetState.id, 
        'habits', 
        habitId.toString()
      );
      
      // Create the Firestore object with timestamps
      const firestoreHabit = {
        ...newHabit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log(`Saving habit to Firestore at path: users/${user.uid}/habitSets/${activeHabitSetState.id}/habits/${habitId}`);
      
      // Save to Firestore
      await setDoc(habitDocRef, firestoreHabit);
      
      console.log("Successfully saved habit to Firestore");
      
      // Update local state after successful Firestore save
      setHabits(prevHabits => {
        const updatedHabits = [...prevHabits, newHabit];
        console.log("Updated habits array:", updatedHabits);
        return updatedHabits;
      });
      
      // Clear the input field
      setNewHabitName("");
      
      toast.success(`Added habit: ${newHabit.name}`);
    } catch (error) {
      console.error("Error adding habit:", error);
      toast.error("Failed to add habit");
    }
  };

  // Delete a habit
  const deleteHabit = async (id: number) => {
    if (!user) {
      toast.error("You must be logged in to delete habits");
      return;
    }
    
    if (!activeHabitSetState || !activeHabitSetState.id) {
      toast.error("No active habit set found");
      return;
    }

    try {
      console.log(`Deleting habit ${id} from set: ${activeHabitSetState.id}`);
      
      // Delete from Firestore
      const habitRef = doc(
        db, 
        'users', 
        user.uid, 
        'habitSets', 
        activeHabitSetState.id, 
        'habits', 
        id.toString()
      );
      
      await deleteDoc(habitRef);
      
      // Update local state
      const updatedHabits = habits.filter(habit => habit.id !== id);
      setHabits(updatedHabits);
      
      toast.success("Habit deleted");
    } catch (error) {
      console.error("Error deleting habit:", error);
      toast.error("Failed to delete habit");
    }
  };

  // Toggle habit completion for today
  const toggleHabitCompletion = async (id: number) => {
    console.log(`=== TOGGLE HABIT COMPLETION CALLED FOR ID: ${id} ===`);
    
    if (!user) {
      console.log("Error: No user authenticated");
      toast.error("You must be logged in to update habits");
      return;
    }
    
    if (!activeHabitSetState || !activeHabitSetState.id) {
      console.log("Error: No active habit set found");
      toast.error("No active habit set found");
      return;
    }

    try {
      // Find the habit
      const habitIndex = habits.findIndex(h => h.id === id);
      if (habitIndex === -1) {
        console.log(`Error: Habit with ID ${id} not found`);
        return;
      }
      
      const habit = habits[habitIndex];
      console.log("Found habit:", habit);
      
      const today = new Date().toISOString().split('T')[0];
      console.log(`Today's date: ${today}`);
      
      // Check if already completed today
      const isCompletedToday = habit.logs.includes(today);
      console.log(`Habit is completed today: ${isCompletedToday}`);
      
      // Create a copy of the habit to update
      const updatedHabit = { ...habit };
      
      // Update logs and XP
      if (isCompletedToday) {
        // Remove today's log
        updatedHabit.logs = habit.logs.filter(date => date !== today);
        updatedHabit.xp = Math.max(0, habit.xp - XP_PER_COMPLETION);
        console.log("Removing today's completion and reducing XP");
      } else {
        // Add today's log
        updatedHabit.logs = [...habit.logs, today];
        updatedHabit.xp = habit.xp + XP_PER_COMPLETION;
        console.log("Adding today's completion and increasing XP");
      }
      
      console.log("Updated habit:", updatedHabit);
      
      // Update local state immediately for instant feedback
      const updatedHabits = [...habits];
      updatedHabits[habitIndex] = updatedHabit;
      setHabits(updatedHabits);
      
      // Update user stats
      const newStats = { ...stats };
      if (isCompletedToday) {
        // Decrease XP
        newStats.totalXP = Math.max(0, stats.totalXP - XP_PER_COMPLETION);
        newStats.dailyXP.xp = Math.max(0, stats.dailyXP.xp - XP_PER_COMPLETION);
      } else {
        // Increase XP
        newStats.totalXP += XP_PER_COMPLETION;
        newStats.dailyXP.xp = Math.min(MAX_DAILY_XP, stats.dailyXP.xp + XP_PER_COMPLETION);
      }
      
      console.log("Updated stats:", newStats);
      setStats(newStats);
      
      // Check for level up
      const newLevel = calculateLevel(newStats.totalXP);
      if (newLevel > currentLevel) {
        setPreviousLevel(currentLevel);
        setCurrentLevel(newLevel);
        setShowLevelUp(true);
      }
      
      // Create Firestore object with timestamp
      const firestoreHabit = {
        ...updatedHabit,
        updatedAt: serverTimestamp()
      };
      
      // Update in Firestore
      console.log(`Updating habit in Firestore at path: users/${user.uid}/habitSets/${activeHabitSetState.id}/habits/${id}`);
      const habitRef = doc(
        db, 
        'users', 
        user.uid, 
        'habitSets', 
        activeHabitSetState.id, 
        'habits', 
        id.toString()
      );
      
      await updateDoc(habitRef, firestoreHabit);
      console.log("Successfully updated habit in Firestore");
      
      // Save user stats to Firestore
      const userStatsRef = doc(db, 'users', user.uid, 'stats', 'userStats');
      await setDoc(userStatsRef, newStats, { merge: true });
      console.log("Successfully saved user stats to Firestore");
      
      toast.success(isCompletedToday ? "Habit marked as incomplete" : "Habit completed!");
    } catch (error) {
      console.error("Error updating habit:", error);
      toast.error("Failed to update habit");
      
      // Reload habits from Firestore if update fails
      if (activeHabitSetState && activeHabitSetState.id) {
        console.log("Reloading habits from Firestore due to error");
        loadHabitsFromSet(activeHabitSetState.id);
      }
    }
  };

  // Get today's date in a readable format
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Calculate progress percentage for today
  const todayHabits = habits.filter(habit => {
    const today = new Date().toISOString().split('T')[0];
    return habit.logs.includes(today);
  });
  
  const progressPercentage = habits.length > 0
    ? Math.round((todayHabits.length / habits.length) * 100)
    : 0;

  // Handle creating a new habit set
  const handleCreateSet = async (name: string, description: string) => {
    if (!user) {
      toast.error('You must be logged in to create habit sets');
      return;
    }

    try {
      const batch = writeBatch(db);
      const setRef = doc(collection(db, 'users', user.uid, 'habitSets'));
      
      batch.set(setRef, {
        name,
        description,
        isActive: (habitSetList ?? []).length === 0,
        isPremium: (habitSetList ?? []).length > 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      toast.success('Created new habit set');
    } catch (error) {
      console.error('Error creating habit set:', error);
      toast.error('Failed to create habit set');
    }
  };

  // Save habits whenever they change
  useEffect(() => {
    if (user && activeHabitSetState && habits.length > 0) {
      console.log(`Auto-saving ${habits.length} habits to set ${activeHabitSetState.id} due to habit change`);
      const saveTimer = setTimeout(() => {
        saveHabitsToSet(user.uid, activeHabitSetState.id, habits)
          .then(success => {
            if (success) {
              console.log(`Auto-save successful for set ${activeHabitSetState.id}`);
            } else {
              console.error(`Auto-save failed for set ${activeHabitSetState.id}`);
            }
          })
          .catch(error => {
            console.error('Error during auto-save:', error);
          });
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(saveTimer);
    }
  }, [habits, user, activeHabitSetState]);

  // Debug function to inspect and fix habit sets
  const debugHabitSets = async () => {
    if (!user) {
      toast.error("You must be logged in to debug habit sets");
      return;
    }
    
    try {
      toast.success("Starting habit set debug...");
      console.log("=== HABIT SET DEBUG START ===");
      
      // 1. Get all habit sets
      const habitSetsCollectionRef = collection(db, 'users', user.uid, 'habitSets');
      const habitSetsSnapshot = await getDocs(habitSetsCollectionRef);
      
      console.log(`Found ${habitSetsSnapshot.size} habit sets`);
      
      // Display all habit sets
      const allSets: {id: string, name: string, isActive: boolean, habits: Habit[]}[] = [];
      
      // Process each habit set
      for (const setDoc of habitSetsSnapshot.docs) {
        const setData = setDoc.data() as HabitSet;
        console.log(`Set: ${setDoc.id} - ${setData.name} (Active: ${setData.isActive})`);
        
        // Get habits for this set
        const habitsCollectionRef = collection(db, 'users', user.uid, 'habitSets', setDoc.id, 'habits');
        const habitsSnapshot = await getDocs(habitsCollectionRef);
        
        const setHabits: Habit[] = [];
        habitsSnapshot.forEach(habitDoc => {
          const habitData = habitDoc.data() as Habit;
          setHabits.push(habitData);
          console.log(`  - Habit: ${habitData.id} - ${habitData.name}`);
        });
        
        allSets.push({
          id: setDoc.id,
          name: setData.name,
          isActive: setData.isActive,
          habits: setHabits
        });
      }
      
      // Find active set
      const activeSet = allSets.find(set => set.isActive);
      
      if (!activeSet) {
        console.log("No active set found. Setting the first set as active...");
        
        if (allSets.length > 0) {
          // Set the first set as active
          const firstSetRef = doc(db, 'users', user.uid, 'habitSets', allSets[0].id);
          await updateDoc(firstSetRef, { isActive: true });
          console.log(`Set ${allSets[0].name} as active`);
          
          // Update local state
          setActiveHabitSetState({
            id: allSets[0].id,
            name: allSets[0].name
          });
          
          // Load habits from this set
          setHabits(allSets[0].habits);
          
          toast.success(`Fixed: Set "${allSets[0].name}" as active`);
        } else {
          console.log("No habit sets found. Creating a default set...");
          
          // Create a default set
          const newSetRef = doc(collection(db, 'users', user.uid, 'habitSets'));
          const defaultSet = {
            name: "Default Set",
            description: "Your default habit set",
            isActive: true,
            isPremium: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await setDoc(newSetRef, defaultSet);
          console.log(`Created default set with ID: ${newSetRef.id}`);
          
          // Update local state
          setActiveHabitSetState({
            id: newSetRef.id,
            name: "Default Set"
          });
          
          toast.success("Fixed: Created a default habit set");
        }
      } else {
        console.log(`Active set found: ${activeSet.name} with ${activeSet.habits.length} habits`);
        
        // Make sure local state matches
        setActiveHabitSetState({
          id: activeSet.id,
          name: activeSet.name
        });
        
        // Load habits from active set
        setHabits(activeSet.habits);
        
        toast.success(`Debug complete: Active set is "${activeSet.name}" with ${activeSet.habits.length} habits`);
      }
      
      console.log("=== HABIT SET DEBUG END ===");
    } catch (error) {
      console.error("Error debugging habit sets:", error);
      toast.error("Failed to debug habit sets");
    }
  };

  // Function to edit a habit set
  const handleEditSet = async (setId: string, name: string, description: string) => {
    if (!user) {
      toast.error("You must be logged in to edit habit sets");
      return;
    }

    if (!name.trim()) {
      toast.error("Set name cannot be empty");
      return;
    }

    try {
      console.log(`Editing habit set ${setId} to name: ${name}`);
      toast.loading("Saving changes...", { id: "editSet" });
      
      // Update in Firestore
      const setRef = doc(db, 'users', user.uid, 'habitSets', setId);
      const updateData = {
        name: name.trim(),
        description: description.trim() || "",
        updatedAt: serverTimestamp()
      };
      
      console.log("Updating Firestore with data:", updateData);
      await updateDoc(setRef, updateData);
      
      // Update local state for habit sets
      setHabitSets(prevSets => 
        prevSets.map(set => 
          set.id === setId 
            ? { 
                ...set, 
                name: name.trim(), 
                description: description.trim() || "" 
              } 
            : set
        )
      );
      
      // If this is the active set, update the active set state
      if (activeHabitSetState && activeHabitSetState.id === setId) {
        console.log("Updating active set state with new name:", name.trim());
        setActiveHabitSetState({
          id: setId,
          name: name.trim()
        });
      }
      
      toast.success("Habit set updated successfully", { id: "editSet" });
      setShowEditSetModal(false);
      setEditSetId("");
      setEditSetName("");
      setEditSetDescription("");
    } catch (error) {
      console.error("Error editing habit set:", error);
      toast.error("Failed to edit habit set", { id: "editSet" });
    }
  };
  
  // Handle deleting habit sets
  const handleDeleteSet = async (setId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete habit sets');
      return;
    }

    if ((habitSetList ?? []).length <= 1) {
      toast.error('You must have at least one habit set');
      return;
    }

    try {
      // If deleting active set, make another set active
      if (activeSet?.id === setId) {
        const newActiveSet = (habitSetList ?? []).find(set => set.id !== setId);
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

  // Handle level up animation
  useEffect(() => {
    if (showLevelUp) {
      const timer = setTimeout(() => {
        setShowLevelUp(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUp]);

  // Handle level up callback
  const handleLevelUp = (prev: number, curr: number) => {
    setPreviousLevel(prev);
    setShowLevelUp(true);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">
          Please log in to track your habits
        </p>
      </div>
    );
  }

  if (loadingHabitSets || loadingHabits || loadingStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <HabitSetManager
          habitSets={habitSetList ?? []}
          activeSetId={activeSet?.id || null}
          onSwitchSet={handleSwitchSet}
          onCreateSet={handleCreateSet}
          onEditSet={handleEditSet}
          onDeleteSet={handleDeleteSet}
          isPremium={!!user?.isPremium}
        />

        {activeSet && (
          <>
            <ProgressDisplay
              habits={habitList ?? []}
              totalXP={userStats?.totalXP ?? 0}
              dailyXP={userStats?.dailyXP?.xp ?? 0}
              onLevelUp={handleLevelUp}
            />

            <AddHabitForm
              onAddHabit={addHabit}
              maxHabits={MAX_HABITS}
              currentHabitCount={(habitList ?? []).length}
            />

            <HabitList
              habits={habitList ?? []}
              onToggleHabit={toggleHabitCompletion}
              onDeleteHabit={deleteHabit}
              onEditHabit={setSelectedHabit}
            />
          </>
        )}

        {/* Level Up Animation */}
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
      </div>
    </ErrorBoundary>
  );
} 
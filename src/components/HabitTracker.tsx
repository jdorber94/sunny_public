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

// Constants
const MAX_HABITS = 5;
const XP_PER_COMPLETION = 10;
const MAX_DAILY_XP = 50;

// Calculate level based on XP
const calculateLevel = (xp: number, level = 1, requiredXP = 100): number => {
  if (xp < requiredXP) return level;
  return calculateLevel(xp - requiredXP, level + 1, Math.floor(requiredXP * 1.5));
};

// Checkmark icon component with animation
const CheckmarkIcon = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => {
  return (
    <button
      className={`w-6 h-6 rounded-full border flex items-center justify-center ${
        checked 
          ? 'bg-green-500 border-green-600' 
          : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600'
      }`}
      onClick={onClick}
    >
      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-white"
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
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const statsUnsubscribeRef = useRef<(() => void) | null>(null);
  const habitsUnsubscribeRef = useRef<(() => void) | null>(null);
  const habitSetsUnsubscribeRef = useRef<(() => void) | null>(null);

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

  // Handle switching to a different habit set
  const handleSwitchHabitSet = async (setId: string, setName: string) => {
    if (!user) {
      toast.error("You must be logged in to switch habit sets");
      return;
    }

    // Don't do anything if we're already on this set
    if (activeHabitSetState?.id === setId) {
      console.log(`Already on habit set ${setName}, no need to switch`);
      return;
    }

    try {
      console.log(`Switching to habit set: ${setId} - ${setName}`);
      
      // Show loading state
      toast.success(`Switching to ${setName}...`);
      
      // 1. Get all habit sets to find the current active one
      const habitSetsRef = collection(db, 'users', user.uid, 'habitSets');
      const habitSetsSnapshot = await getDocs(habitSetsRef);
      
      // Find the currently active set
      let currentActiveSetId = null;
      habitSetsSnapshot.forEach(doc => {
        const setData = doc.data();
        if (setData.isActive) {
          currentActiveSetId = doc.id;
        }
      });
      
      // 2. Create a batch to update all sets in one transaction
      const batch = writeBatch(db);
      
      // 3. If there's a currently active set, mark it as inactive
      if (currentActiveSetId) {
        console.log(`Marking current active set ${currentActiveSetId} as inactive`);
        const currentActiveSetRef = doc(db, 'users', user.uid, 'habitSets', currentActiveSetId);
        batch.update(currentActiveSetRef, { 
          isActive: false,
          updatedAt: serverTimestamp()
        });
      }
      
      // 4. Mark the new set as active
      console.log(`Marking new set ${setId} as active`);
      const newSetRef = doc(db, 'users', user.uid, 'habitSets', setId);
      batch.update(newSetRef, { 
        isActive: true,
        updatedAt: serverTimestamp()
      });
      
      // 5. Commit all changes in one transaction
      await batch.commit();
      
      // 6. Update local state
      setActiveHabitSetState({
        id: setId,
        name: setName
      });
      
      // 7. Clear current habits
      setHabits([]);
      
      // 8. Subscribe to habits from the new set
      if (habitsUnsubscribeRef.current) {
        console.log("Unsubscribing from previous habits subscription");
        habitsUnsubscribeRef.current();
      }
      
      // 9. Subscribe to habits for the new set
      console.log(`Subscribing to habits for set: ${setId}`);
      subscribeToActiveSetHabits(user.uid, setId);
      
      console.log(`Successfully switched to set ${setName}`);
      toast.success(`Switched to ${setName}`);
    } catch (error) {
      console.error("Error switching habit set:", error);
      toast.error("Failed to switch habit set");
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
      console.log(`Adding new habit "${newHabitName}" to set: ${activeHabitSetState.id}`);
      
      // Generate a unique ID for the new habit
      const habitId = Date.now();
      console.log(`Generated habit ID: ${habitId}`);
      
      // Create the new habit object with proper typing
      const newHabitObj = {
        id: habitId,
        name: newHabitName.trim(),
        logs: [] as string[],
        xp: 0
      };
      
      console.log("New habit object:", newHabitObj);
      
      // Update local state immediately for instant feedback
      console.log("Updating local state with new habit");
      setHabits(prevHabits => {
        const updatedHabits = [...prevHabits, newHabitObj as Habit];
        console.log("Updated habits array:", updatedHabits);
        return updatedHabits;
      });
      setNewHabitName("");
      
      console.log(`Preparing to save habit to Firestore in set: ${activeHabitSetState.id}`);
      
      // Firestore object with timestamps
      const firestoreHabitObj = {
        ...newHabitObj,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Save directly to Firestore
      const habitRef = doc(
        db, 
        'users', 
        user.uid, 
        'habitSets', 
        activeHabitSetState.id, 
        'habits', 
        habitId.toString()
      );
      
      console.log(`Saving habit to Firestore at path: users/${user.uid}/habitSets/${activeHabitSetState.id}/habits/${habitId}`);
      await setDoc(habitRef, firestoreHabitObj);
      
      console.log(`Successfully saved habit to Firestore`);
      toast.success(`Added habit: ${newHabitName}`);
    } catch (error) {
      console.error("Error adding habit:", error);
      toast.error("Failed to add habit");
      
      // Revert local state if Firestore save fails
      console.log("Reverting local state due to error");
      setHabits(prevHabits => prevHabits.filter(h => h.id !== Date.now()));
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
    if (!user) {
      toast.error("You must be logged in to update habits");
      return;
    }
    
    if (!activeHabitSetState || !activeHabitSetState.id) {
      toast.error("No active habit set found");
      return;
    }

    try {
      // Find the habit
      const habitIndex = habits.findIndex(h => h.id === id);
      if (habitIndex === -1) {
        toast.error("Habit not found");
        return;
      }
      
      const habit = habits[habitIndex];
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already completed today
      const isCompletedToday = habit.logs.includes(today);
      
      // Update the habit
      const updatedHabit = { ...habit };
      
      if (isCompletedToday) {
        // Remove today's date
        updatedHabit.logs = habit.logs.filter(date => date !== today);
        updatedHabit.xp = Math.max(0, (habit.xp || 0) - 10); // Subtract XP, minimum 0
      } else {
        // Add today's date
        updatedHabit.logs = [...habit.logs, today];
        updatedHabit.xp = (habit.xp || 0) + 10; // Add XP
      }
      
      // Update local state immediately for instant feedback
      const updatedHabits = [...habits];
      updatedHabits[habitIndex] = updatedHabit;
      setHabits(updatedHabits);
      
      // Update user stats immediately
      const newXP = isCompletedToday 
        ? Math.max(0, stats.totalXP - 10) 
        : stats.totalXP + 10;
      
      const newStats = {
        ...stats,
        totalXP: newXP
      };
      
      setStats(newStats);
      
      // Check for level up
      const newLevel = calculateLevel(newXP);
      if (newLevel > currentLevel) {
        setPreviousLevel(currentLevel);
        setCurrentLevel(newLevel);
        setShowLevelUp(true);
      }
      
      // Add timestamp for Firestore
      updatedHabit.updatedAt = serverTimestamp() as any;
      
      console.log(`Updating habit ${id} in set: ${activeHabitSetState.id}`);
      
      // Update in Firestore
      const habitRef = doc(
        db, 
        'users', 
        user.uid, 
        'habitSets', 
        activeHabitSetState.id, 
        'habits', 
        id.toString()
      );
      
      await updateDoc(habitRef, updatedHabit);
      
      // Save user stats to Firestore
      if (user) {
        const userStatsRef = doc(db, 'users', user.uid, 'stats', 'userStats');
        await setDoc(userStatsRef, newStats, { merge: true });
      }
      
      toast.success(isCompletedToday ? "Habit marked as incomplete" : "Habit completed!");
    } catch (error) {
      console.error("Error updating habit:", error);
      toast.error("Failed to update habit");
      
      // Reload habits from Firestore if update fails
      if (activeHabitSetState && activeHabitSetState.id) {
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
  const handleCreateSet = async () => {
    if (!user) {
      toast.error("You must be logged in to create a habit set");
      return;
    }

    if (!newSetName.trim()) {
      toast.error("Please enter a name for your habit set");
      return;
    }

    try {
      console.log("Starting to create new habit set:", newSetName);
      toast.success("Creating new habit set...");
      
      // 1. Get all habit sets to find the current active one
      const habitSetsRef = collection(db, 'users', user.uid, 'habitSets');
      const habitSetsSnapshot = await getDocs(habitSetsRef);
      
      console.log(`Found ${habitSetsSnapshot.size} existing habit sets`);
      
      // Find the currently active set
      let currentActiveSetId = null;
      habitSetsSnapshot.forEach(doc => {
        const setData = doc.data();
        if (setData.isActive) {
          currentActiveSetId = doc.id;
          console.log(`Found active set: ${doc.id}`);
        }
      });
      
      // 2. Create a batch to update all sets in one transaction
      const batch = writeBatch(db);
      
      // 3. If there's a currently active set, mark it as inactive
      if (currentActiveSetId) {
        console.log(`Marking current active set ${currentActiveSetId} as inactive`);
        const currentActiveSetRef = doc(db, 'users', user.uid, 'habitSets', currentActiveSetId);
        batch.update(currentActiveSetRef, { 
          isActive: false,
          updatedAt: serverTimestamp()
        });
      }
      
      // 4. Create the new set
      const newSetRef = doc(collection(db, 'users', user.uid, 'habitSets'));
      console.log(`Creating new set with ID: ${newSetRef.id}`);
      
      const newSetData = {
        name: newSetName.trim(),
        description: newSetDescription.trim() || "",
        isActive: true,
        isPremium: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log("New set data:", newSetData);
      batch.set(newSetRef, newSetData);
      
      // 5. Commit all changes in one transaction
      console.log("Committing batch...");
      await batch.commit();
      console.log("Batch committed successfully");
      
      // 6. Update local state
      console.log("Updating local state...");
      setActiveHabitSetState({
        id: newSetRef.id,
        name: newSetName.trim()
      });
      
      // 7. Clear habits since this is a new set
      setHabits([]);
      
      // 8. Add the new set to the local habitSets state
      const newSetWithId: HabitSet = {
        id: newSetRef.id,
        name: newSetName.trim(),
        description: newSetDescription.trim() || undefined,
        isActive: true,
        isPremium: false
      };
      
      console.log("Adding new set to local state:", newSetWithId);
      setHabitSets(prevSets => [...prevSets, newSetWithId]);
      
      // 9. Reset form and close modal
      setNewSetName('');
      setNewSetDescription('');
      setShowCreateSetModal(false);
      
      console.log(`Successfully created new set ${newSetName} with ID ${newSetRef.id}`);
      toast.success(`Created new habit set: ${newSetName}`);
    } catch (error) {
      console.error("Error creating habit set:", error);
      toast.error("Failed to create habit set");
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
  const handleEditHabitSet = async (setId: string, newName: string, newDescription: string) => {
    if (!user) {
      toast.error("You must be logged in to edit habit sets");
      return;
    }

    try {
      console.log(`Editing habit set ${setId} to name: ${newName}`);
      
      // Update in Firestore
      const setRef = doc(db, 'users', user.uid, 'habitSets', setId);
      await updateDoc(setRef, { 
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setHabitSets(prevSets => 
        prevSets.map(set => 
          set.id === setId 
            ? { ...set, name: newName.trim(), description: newDescription.trim() || undefined } 
            : set
        )
      );
      
      // If this is the active set, update the active set state
      if (activeHabitSetState && activeHabitSetState.id === setId) {
        setActiveHabitSetState({
          id: setId,
          name: newName.trim()
        });
      }
      
      toast.success("Habit set updated");
      setShowEditSetModal(false);
      setEditSetId("");
      setEditSetName("");
      setEditSetDescription("");
    } catch (error) {
      console.error("Error editing habit set:", error);
      toast.error("Failed to edit habit set");
    }
  };
  
  // Function to delete a habit set
  const handleDeleteHabitSet = async (setId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete habit sets");
      return;
    }
    
    if (habitSets.length <= 1) {
      toast.error("You cannot delete your only habit set");
      return;
    }

    try {
      console.log(`Deleting habit set ${setId}`);
      
      // Check if this is the active set
      const isActiveSet = activeHabitSetState && activeHabitSetState.id === setId;
      
      // Find another set to make active if we're deleting the active set
      let newActiveSetId = "";
      if (isActiveSet) {
        const otherSet = habitSets.find(set => set.id !== setId);
        if (otherSet) {
          newActiveSetId = otherSet.id;
        }
      }
      
      // Create a batch to handle all operations
      const batch = writeBatch(db);
      
      // Delete the set
      const setRef = doc(db, 'users', user.uid, 'habitSets', setId);
      batch.delete(setRef);
      
      // If we're deleting the active set, make another set active
      if (isActiveSet && newActiveSetId) {
        const newActiveSetRef = doc(db, 'users', user.uid, 'habitSets', newActiveSetId);
        batch.update(newActiveSetRef, { 
          isActive: true,
          updatedAt: serverTimestamp()
        });
      }
      
      // Commit the batch
      await batch.commit();
      
      // Update local state
      setHabitSets(prevSets => prevSets.filter(set => set.id !== setId));
      
      // If we deleted the active set, switch to the new active set
      if (isActiveSet && newActiveSetId) {
        const newActiveSet = habitSets.find(set => set.id === newActiveSetId);
        if (newActiveSet) {
          handleSwitchHabitSet(newActiveSetId, newActiveSet.name);
        }
      }
      
      toast.success("Habit set deleted");
      setShowDeleteSetModal(false);
      setDeleteSetId("");
    } catch (error) {
      console.error("Error deleting habit set:", error);
      toast.error("Failed to delete habit set");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Level Up Celebration */}
      {showLevelUp && (
        <LevelUpCelebration
          level={currentLevel}
          onClose={() => setShowLevelUp(false)}
        />
      )}
      
      {/* Debug Button - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
          <div className="flex space-x-2">
            <button 
              onClick={debugHabitSets}
              className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md"
            >
              Debug Habit Sets
            </button>
            <button 
              onClick={() => {
                console.log("Direct create set button clicked");
                const testSetName = "Test Set " + new Date().toLocaleTimeString();
                setNewSetName(testSetName);
                setNewSetDescription("Created via debug button");
                setTimeout(() => {
                  console.log("Calling handleCreateSet with:", testSetName);
                  handleCreateSet();
                }, 100);
              }}
              className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md"
            >
              Create Test Set
            </button>
          </div>
          <p className="text-xs text-yellow-800 mt-1">
            These buttons will help debug habit set issues
          </p>
        </div>
      )}
      
      {/* Header with level info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Habit Tracker
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your daily habits and level up your life
          </p>
        </div>
        <div className="mt-2 md:mt-0 flex items-center">
          <div className="mr-2 text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {currentLevel}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Sparkles />
          </div>
        </div>
      </div>
      
      {/* Habit Set Selector - New Design */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Habit Sets
            </h2>
            <button
              onClick={() => setShowCreateSetModal(true)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md flex items-center"
              disabled={!canCreateHabitSet}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Set
            </button>
          </div>
          
          {/* Horizontal scrollable habit set cards */}
          <div className="flex overflow-x-auto pb-2 -mx-1 hide-scrollbar">
            {habitSets.map(set => (
              <div 
                key={set.id} 
                className={`flex-shrink-0 w-48 mx-1 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  activeHabitSetState?.id === set.id 
                    ? 'bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleSwitchHabitSet(set.id, set.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {activeHabitSetState?.id === set.id && (
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    )}
                    <h3 className="font-medium text-gray-800 dark:text-white truncate">
                      {set.name}
                    </h3>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditSetId(set.id);
                        setEditSetName(set.name);
                        setEditSetDescription(set.description || '');
                        setShowEditSetModal(true);
                      }}
                      className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteSetId(set.id);
                        setShowDeleteSetModal(true);
                      }}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {set.description || "No description"}
                </p>
              </div>
            ))}
            
            {/* Add set card if user can create more */}
            {canCreateHabitSet && (
              <div 
                className="flex-shrink-0 w-48 mx-1 p-3 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 flex items-center justify-center"
                onClick={() => setShowCreateSetModal(true)}
              >
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add New Set</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Active Habit Set Info */}
      {activeHabitSetState && (
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {activeHabitSetState.name}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {habits.length} / {MAX_HABITS} habits
            </div>
          </div>
          
          {/* Progress bar for habit limit */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ width: `${(habits.length / MAX_HABITS) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Weekly Progress */}
      <div className="mb-6">
        <WeeklyProgress habits={habits} />
      </div>
      
      {/* Add New Habit Form */}
      <div className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="Enter a new habit..."
            className="flex-grow p-2 border border-gray-300 dark:border-gray-700 rounded-l-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && addHabit()}
            disabled={habits.length >= MAX_HABITS || !activeHabitSetState}
          />
          <button
            onClick={addHabit}
            className={`px-4 py-2 rounded-r-md font-medium ${
              habits.length >= MAX_HABITS || !activeHabitSetState
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white`}
            disabled={habits.length >= MAX_HABITS || !activeHabitSetState}
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        {!activeHabitSetState && (
          <p className="text-amber-500 text-sm mt-1">
            Please create or select a habit set first
          </p>
        )}
        {habits.length >= MAX_HABITS && (
          <p className="text-amber-500 text-sm mt-1">
            You've reached the maximum number of habits for this set
          </p>
        )}
      </div>
      
      {/* Habits List */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No habits yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {activeHabitSetState 
                ? "Add your first habit to get started" 
                : "Select or create a habit set first"}
            </p>
          </div>
        ) : (
          habits.map((habit) => {
            const isCompletedToday = habit.logs.includes(
              new Date().toISOString().split('T')[0]
            );
            
            return (
              <div
                key={habit.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <CheckmarkIcon
                    checked={isCompletedToday}
                    onClick={() => toggleHabitCompletion(habit.id)}
                  />
                  <div className="ml-3">
                    <h3 className={`font-medium ${
                      isCompletedToday 
                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                        : 'text-gray-800 dark:text-white'
                    }`}>
                      {habit.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                        XP: {habit.xp || 0}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Streak: {calculateStreak(habit.logs)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
      
      {/* Create Set Modal */}
      {showCreateSetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New Habit Set
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="My Habit Set"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="What's this habit set for?"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateSetModal(false);
                  setNewSetName('');
                  setNewSetDescription('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log("Create button clicked");
                  handleCreateSet();
                }}
                disabled={!newSetName.trim()}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  !newSetName.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Set Modal */}
      {showEditSetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Edit Habit Set
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editSetName}
                  onChange={(e) => setEditSetName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="My Habit Set"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={editSetDescription}
                  onChange={(e) => setEditSetDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="What's this habit set for?"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditSetModal(false);
                  setEditSetId('');
                  setEditSetName('');
                  setEditSetDescription('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditHabitSet(editSetId, editSetName, editSetDescription)}
                disabled={!editSetName.trim()}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  !editSetName.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Set Confirmation Modal */}
      {showDeleteSetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Delete Habit Set
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this habit set? This action cannot be undone and all habits in this set will be lost.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteSetModal(false);
                  setDeleteSetId('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteHabitSet(deleteSetId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
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
  subscribeToHabitsInSet
} from '@/lib/firestoreService';
import HabitSetManager from './HabitSetManager';
import { toast } from 'react-hot-toast';

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

export default function HabitTracker() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitSets, setHabitSets] = useState<HabitSet[]>([]);
  const [newHabit, setNewHabit] = useState('');
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
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const statsUnsubscribeRef = useRef<(() => void) | null>(null);
  const habitsUnsubscribeRef = useRef<(() => void) | null>(null);
  const habitSetsUnsubscribeRef = useRef<(() => void) | null>(null);

  // Function to subscribe to habits for the current active habit set
  const subscribeToActiveSetHabits = (userId: string, activeSetId: string) => {
    console.log(`Subscribing to habits for set ${activeSetId}`);
    
    // Clean up previous subscription if it exists
    if (habitsUnsubscribeRef.current) {
      habitsUnsubscribeRef.current();
    }
    
    // Subscribe to habits for this specific set
    const unsubscribe = subscribeToHabitsInSet(userId, activeSetId, (firestoreHabits) => {
      console.log(`Received ${firestoreHabits.length} habits for set ${activeSetId}`);
      setHabits(firestoreHabits);
      // Also update localStorage
      localStorage.setItem('habits', JSON.stringify(firestoreHabits));
    });
    
    habitsUnsubscribeRef.current = unsubscribe;
  };

  // Handle switching to a different habit set
  const handleSwitchHabitSet = async (setId: string, setName: string) => {
    if (!user) return;
    
    try {
      console.log(`Switching to habit set ${setId} (${setName})`);
      
      // Clear current habits immediately to avoid showing previous set's habits
      setHabits([]);
      
      // Set this set as active in Firestore
      await setActiveHabitSet(user.uid, setId);
      
      // Update local state
      setActiveHabitSetState({
        id: setId,
        name: setName
      });
      
      // Subscribe to habits for this set
      subscribeToActiveSetHabits(user.uid, setId);
      
      toast.success(`Switched to habit set: ${setName}`);
    } catch (error) {
      console.error('Error switching habit set:', error);
      toast.error('Failed to switch habit set');
    }
  };

  // Initialize habits from localStorage or Firestore
  useEffect(() => {
    // Initialize habits from localStorage
    if (typeof window !== 'undefined') {
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }
      
      const savedStats = localStorage.getItem('habitStats');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        
        // Reset daily XP if it's a new day
        const today = new Date().toISOString().split('T')[0];
        if (parsedStats.dailyXP.date !== today) {
          parsedStats.dailyXP = { date: today, xp: 0 };
        }
        
        setStats(parsedStats);
        setCurrentLevel(calculateLevel(parsedStats.totalXP));
        setPreviousLevel(calculateLevel(parsedStats.totalXP));
      }
    }
    
    // If user is authenticated, subscribe to Firestore data
    if (user) {
      // Get active habit set
      getActiveHabitSet(user.uid).then(habitSet => {
        if (habitSet) {
          console.log(`Found active habit set: ${habitSet.id} (${habitSet.name})`);
          setActiveHabitSetState({
            id: habitSet.id,
            name: habitSet.name
          });
          
          // Subscribe to habits for this set
          subscribeToActiveSetHabits(user.uid, habitSet.id);
        } else {
          console.log('No active habit set found');
          // Clear habits if no active set
          setHabits([]);
          localStorage.removeItem('habits');
        }
      });
      
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
      
      // Subscribe to habit sets
      const habitSetsUnsubscribe = subscribeToHabitSets(user.uid, (sets) => {
        console.log(`Received ${sets.length} habit sets`);
        setHabitSets(sets);
      });
      
      habitSetsUnsubscribeRef.current = habitSetsUnsubscribe;
    }
    
    return () => {
      // Cleanup subscriptions
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
    if (!newHabit.trim()) {
      setError('Habit name cannot be empty');
      return;
    }
    
    if (habits.length >= MAX_HABITS) {
      setError(`You can only have up to ${MAX_HABITS} habits per set`);
      return;
    }
    
    // Create a new habit
    const newHabitObj: Habit = {
      id: Date.now(),
      name: newHabit.trim(),
      logs: [],
      xp: 0
    };
    
    // Add to state
    const updatedHabits = [...habits, newHabitObj];
    setHabits(updatedHabits);
    setNewHabit('');
    setError('');
    
    // Save to localStorage
    localStorage.setItem('habits', JSON.stringify(updatedHabits));
    
    // Save to Firestore if user is authenticated
    if (user && activeHabitSetState) {
      console.log(`Saving habits to active set ${activeHabitSetState.id}`);
      await saveHabits(user.uid, updatedHabits);
    }
  };

  // Delete a habit
  const deleteHabit = async (id: number) => {
    const updatedHabits = habits.filter(habit => habit.id !== id);
    setHabits(updatedHabits);
    
    // Save to localStorage
    localStorage.setItem('habits', JSON.stringify(updatedHabits));
    
    // Save to Firestore if user is authenticated
    if (user && activeHabitSetState) {
      console.log(`Saving updated habits to active set ${activeHabitSetState.id} after deletion`);
      await saveHabits(user.uid, updatedHabits);
    }
  };

  // Toggle habit completion for today
  const toggleHabitCompletion = async (id: number) => {
    const today = new Date().toISOString().split('T')[0];
    
    const updatedHabits = habits.map(habit => {
      if (habit.id === id) {
        const isCompleted = habit.logs.includes(today);
        let logs = [...habit.logs];
        let xpChange = 0;
        
        if (isCompleted) {
          // Remove today's log
          logs = logs.filter(date => date !== today);
          xpChange = -XP_PER_COMPLETION;
        } else {
          // Add today's log
          logs.push(today);
          xpChange = XP_PER_COMPLETION;
        }
        
        return { ...habit, logs, xp: habit.xp + xpChange };
      }
      return habit;
    });
    
    setHabits(updatedHabits);
    
    // Update stats
    const isCompleted = habits.find(h => h.id === id)?.logs.includes(today) || false;
    
    // Only update XP if we're not already at max daily XP
    // or if we're removing XP (unchecking a habit)
    let updatedStats = { ...stats };
    if (isCompleted || stats.dailyXP.xp < MAX_DAILY_XP) {
      const xpChange = isCompleted ? -XP_PER_COMPLETION : XP_PER_COMPLETION;
      
      // Ensure we don't go over the daily XP limit
      let newDailyXP = stats.dailyXP.xp + xpChange;
      if (!isCompleted && newDailyXP > MAX_DAILY_XP) {
        newDailyXP = MAX_DAILY_XP;
        alert(`You've reached your daily XP limit of ${MAX_DAILY_XP}!`);
      }
      
      updatedStats = {
        ...stats,
        totalXP: stats.totalXP + xpChange,
        dailyXP: {
          date: today,
          xp: newDailyXP
        }
      };
      
      setStats(updatedStats);
      
      // Check for level up
      const newLevel = calculateLevel(updatedStats.totalXP);
      if (newLevel > currentLevel) {
        setPreviousLevel(currentLevel);
        setCurrentLevel(newLevel);
        setShowLevelUp(true);
      }
    }
    
    // Save to localStorage
    localStorage.setItem('habits', JSON.stringify(updatedHabits));
    localStorage.setItem('habitStats', JSON.stringify(updatedStats));
    
    // Save to Firestore if user is authenticated
    if (user && activeHabitSetState) {
      console.log(`Saving updated habits to active set ${activeHabitSetState.id} after completion toggle`);
      await saveHabits(user.uid, updatedHabits);
      await saveUserStats(user.uid, updatedStats);
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
    if (!user) return;
    
    if (!newSetName.trim()) {
      setError('Habit set name cannot be empty');
      return;
    }
    
    try {
      const newSet: Omit<HabitSet, 'id'> = {
        name: newSetName.trim(),
        description: newSetDescription.trim(),
        isActive: habitSets.length === 0, // First set is active by default
        isPremium: habitSets.length > 1, // First two sets are free, others are premium
      };
      
      const createdSet = await createHabitSet(user.uid, newSet);
      
      // Reset form
      setNewSetName('');
      setNewSetDescription('');
      setShowNewSetForm(false);
      setError('');
      
      toast.success('Habit set created successfully!');
      
      // If this is not the first set (which is automatically active),
      // switch to the newly created set
      if (createdSet && habitSets.length > 0) {
        // Clear current habits
        setHabits([]);
        
        // Switch to the new set
        await handleSwitchHabitSet(createdSet.id, createdSet.name);
      }
    } catch (error) {
      console.error('Error creating habit set:', error);
      toast.error('Failed to create habit set');
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
      
      {/* Header with level info */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Habit Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your daily habits and build consistency
          </p>
        </div>
        
        {/* Add prominent button for Habit Set Manager */}
        <button
          onClick={() => setShowHabitSetManager(!showHabitSetManager)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
          </svg>
          <span>{showHabitSetManager ? 'Hide Habit Sets' : 'Manage Habit Sets'}</span>
        </button>
      </div>
      
      {/* Header with Level and XP */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quest Master</h1>
          <p className="text-gray-600 dark:text-gray-300">{today}</p>
        </div>
        <div className="flex items-center">
          <div className="mr-2 text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Level {currentLevel}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{stats.totalXP} XP</p>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
            <Sparkles />
          </div>
        </div>
      </div>
      
      {/* Active Habit Set Info */}
      {activeHabitSetState && (
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Set: {activeHabitSetState.name}
            </span>
          </div>
          <button
            onClick={() => setShowHabitSetManager(!showHabitSetManager)}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            {showHabitSetManager ? 'Hide Sets' : 'Show Sets'}
          </button>
        </div>
      )}
      
      {/* Habit Set Manager */}
      {showHabitSetManager && (
        <div className="mb-6 h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="h-full">
            {/* Custom Habit Set Manager with Switch Functionality */}
            <div className="bg-white dark:bg-gray-800 h-full overflow-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  Your Habit Sets
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Each set can have up to {MAX_HABITS} habits
                </p>
              </div>
              
              <div className="p-4 space-y-3">
                {user && (
                  <>
                    {/* Create New Set Button */}
                    <button
                      onClick={() => setShowNewSetForm(!showNewSetForm)}
                      className="flex items-center justify-center space-x-2 w-full p-3 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">New Habit Set</span>
                    </button>
                    
                    {/* New Set Form */}
                    {showNewSetForm && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-600">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Create New Habit Set</h3>
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="setName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              id="setName"
                              value={newSetName}
                              onChange={(e) => setNewSetName(e.target.value)}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                              placeholder="e.g., Morning Routine"
                            />
                          </div>
                          <div>
                            <label htmlFor="setDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Description (optional)
                            </label>
                            <textarea
                              id="setDescription"
                              value={newSetDescription}
                              onChange={(e) => setNewSetDescription(e.target.value)}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                              placeholder="e.g., Habits to start my day right"
                              rows={2}
                            />
                          </div>
                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={handleCreateSet}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors"
                            >
                              Create Set
                            </button>
                            <button
                              onClick={() => {
                                setShowNewSetForm(false);
                                setNewSetName('');
                                setNewSetDescription('');
                              }}
                              className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {habitSets.map((set) => (
                      <div 
                        key={set.id}
                        className={`p-3 rounded-lg border ${
                          set.isActive 
                            ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' 
                            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                              {set.name}
                              {set.isPremium && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Premium
                                </span>
                              )}
                            </h3>
                            {set.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {set.description}
                              </p>
                            )}
                          </div>
                          
                          {set.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSwitchHabitSet(set.id, set.name)}
                              className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                            >
                              Switch to this set
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {habitSets.length === 0 && (
                      <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                        <p>You don't have any habit sets yet.</p>
                        <p className="mt-1">Create one to get started!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Today's Progress</h2>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {todayHabits.length}/{habits.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Weekly Progress */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Weekly Overview</h2>
        <WeeklyProgress habits={habits} />
      </div>
      
      {/* Habits List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          {activeHabitSetState 
            ? `Your Habits - ${activeHabitSetState.name}` 
            : "Your Habits"}
        </h2>
        {habits.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            You haven't added any habits yet. Add your first habit below!
          </p>
        ) : (
          <ul className="space-y-2">
            {habits.map(habit => {
              const today = new Date().toISOString().split('T')[0];
              const isCompleted = habit.logs.includes(today);
              
              return (
                <li 
                  key={habit.id}
                  className={`p-3 rounded-lg border flex justify-between items-center ${
                    isCompleted 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <CheckmarkIcon 
                      checked={isCompleted} 
                      onClick={() => toggleHabitCompletion(habit.id)} 
                    />
                    <span className={`ml-3 ${
                      isCompleted 
                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                        : 'text-gray-800 dark:text-white'
                    }`}>
                      {habit.name}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      {/* Add New Habit Form */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Add New Habit</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Enter a new habit..."
            className="flex-grow p-2 border border-gray-300 dark:border-gray-700 rounded-l-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addHabit();
              }
            }}
          />
          <button
            onClick={addHabit}
            className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          You can add up to {MAX_HABITS} habits. Each completed habit earns you {XP_PER_COMPLETION} XP (max {MAX_DAILY_XP} XP per day).
        </p>
      </div>
    </div>
  );
} 
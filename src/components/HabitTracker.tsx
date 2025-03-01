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
  getActiveHabitSet
} from '@/lib/firestoreService';
import HabitSetManager from './HabitSetManager';

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
  const [newHabit, setNewHabit] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<UserStats>({
    totalXP: 0,
    dailyXP: { date: new Date().toISOString().split('T')[0], xp: 0 }
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showHabitSetManager, setShowHabitSetManager] = useState(false);
  const [activeHabitSet, setActiveHabitSet] = useState<{ id: string; name: string } | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const statsUnsubscribeRef = useRef<(() => void) | null>(null);

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
          setActiveHabitSet({
            id: habitSet.id,
            name: habitSet.name
          });
        }
      });
      
      // Subscribe to habits
      const unsubscribe = subscribeToHabits(user.uid, (firestoreHabits) => {
        if (firestoreHabits.length > 0) {
          setHabits(firestoreHabits);
          // Also update localStorage
          localStorage.setItem('habits', JSON.stringify(firestoreHabits));
        }
      });
      
      unsubscribeRef.current = unsubscribe;
      
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
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (statsUnsubscribeRef.current) {
        statsUnsubscribeRef.current();
      }
    };
  }, [user, currentLevel]);

  // Add a new habit
  const addHabit = async () => {
    if (!newHabit.trim()) {
      setError('Habit name cannot be empty');
      return;
    }
    
    if (habits.length >= MAX_HABITS) {
      setError(`You can only track up to ${MAX_HABITS} habits at a time`);
      return;
    }
    
    const habit: Habit = {
      id: Date.now(),
      name: newHabit.trim(),
      logs: [],
      xp: 0
    };
    
    const updatedHabits = [...habits, habit];
    setHabits(updatedHabits);
    setNewHabit('');
    setError('');
    
    // Save to localStorage
    localStorage.setItem('habits', JSON.stringify(updatedHabits));
    
    // Save to Firestore if user is authenticated
    if (user) {
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
    if (user) {
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
    if (user) {
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

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Level Up Celebration */}
      {showLevelUp && (
        <LevelUpCelebration 
          level={currentLevel}
          onClose={() => setShowLevelUp(false)} 
        />
      )}
      
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
      {activeHabitSet && (
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Set: {activeHabitSet.name}
            </span>
          </div>
          <button
            onClick={() => setShowHabitSetManager(!showHabitSetManager)}
            className="text-xs bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded"
          >
            {showHabitSetManager ? 'Hide Sets' : 'Manage Sets'}
          </button>
        </div>
      )}
      
      {/* Habit Set Manager */}
      {showHabitSetManager && (
        <div className="mb-6">
          <HabitSetManager />
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
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Your Habits</h2>
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
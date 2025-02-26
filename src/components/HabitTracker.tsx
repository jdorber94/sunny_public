'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from './Sparkles';
import { WeeklyProgress } from './WeeklyProgress';
import { LevelUpCelebration } from './LevelUpCelebration';
import { format, addDays, subDays, isToday } from 'date-fns';

interface Habit {
  id: number;
  name: string;
  logs: string[];
  xp: number;
}

interface UserStats {
  totalXP: number;
  dailyXP: {
    date: string;
    xp: number;
  };
}

const MAX_HABITS = 5;
const XP_PER_COMPLETION = 20;
const MAX_DAILY_XP = 100;

const calculateLevel = (xp: number) => {
  // Each level requires double XP of the previous level
  // Level 1: 0-60
  // Level 2: 60-180 (60 + 120)
  // Level 3: 180-420 (180 + 240)
  // Level 4: 420-900 (420 + 480)
  // and so on...
  const getRequiredXP = (level: number): number => {
    if (level === 1) return 60;
    return getRequiredXP(level - 1) * 2;
  };

  let level = 1;
  let totalRequired = 60; // First level requirement

  while (xp >= totalRequired) {
    level++;
    totalRequired += getRequiredXP(level);
  }

  const prevLevelXP = level === 1 ? 0 : totalRequired - getRequiredXP(level);
  const currentLevelXP = xp - prevLevelXP;
  const nextLevelXP = getRequiredXP(level);

  return { level, currentLevelXP, nextLevelXP };
};

function CheckmarkIcon({ checked, animate = false }: { checked: boolean; animate?: boolean }) {
  return checked ? (
    <div className="relative">
      {animate && (
        <>
          <div className="absolute inset-0 animate-ping opacity-30 rounded-full bg-[#00B971]" />
          <div className="absolute inset-[-8px] animate-scale-up rounded-full border-2 border-[#00B971]" />
        </>
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`w-6 h-6 ${animate ? 'animate-bounce-small' : ''}`}
      >
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window !== 'undefined') {
      const savedHabits = localStorage.getItem('habits');
      return savedHabits ? JSON.parse(savedHabits) : [];
    }
    return [];
  });

  const [newHabit, setNewHabit] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<UserStats>(() => {
    if (typeof window !== 'undefined') {
      const savedStats = localStorage.getItem('habitStats');
      const today = new Date().toISOString().split('T')[0];
      
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        // Reset daily XP if it's a new day
        if (parsedStats.dailyXP.date !== today) {
          return {
            totalXP: parsedStats.totalXP,
            dailyXP: {
              date: today,
              xp: 0
            }
          };
        }
        return parsedStats;
      }
      
      return {
        totalXP: 0,
        dailyXP: {
          date: today,
          xp: 0
        }
      };
    }
    return {
      totalXP: 0,
      dailyXP: {
        date: new Date().toISOString().split('T')[0],
        xp: 0
      }
    };
  });

  const [celebrateHabitId, setCelebrateHabitId] = useState<number | null>(null);
  const [celebrateProgress, setCelebrateProgress] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const { level, currentLevelXP, nextLevelXP } = calculateLevel(stats.totalXP);

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('habitStats', JSON.stringify(stats));
  }, [habits, stats]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (stats.dailyXP.date !== today) {
      setStats(prev => ({
        totalXP: prev.totalXP,
        dailyXP: {
          date: today,
          xp: 0
        }
      }));
    }
  }, [selectedDate]);

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    
    if (habits.length >= MAX_HABITS) {
      setError(`Maximum ${MAX_HABITS} habits allowed`);
      return;
    }

    const habit: Habit = {
      id: Date.now(),
      name: newHabit,
      logs: [],
      xp: 0
    };
    
    setHabits([...habits, habit]);
    setNewHabit('');
    setError('');
  };

  const toggleHabit = (habitId: number) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const today = new Date().toISOString().split('T')[0];
    
    // Only allow toggling if selected date is today
    if (!isToday(selectedDate)) return;
    
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const hasLog = habit.logs.includes(dateStr);
        
        if (!hasLog && stats.dailyXP.xp < MAX_DAILY_XP) {
          setCelebrateHabitId(habitId);
          setCelebrateProgress(true);
          setTimeout(() => {
            setCelebrateHabitId(null);
            setCelebrateProgress(false);
          }, 1000);

          setStats(prev => ({
            totalXP: prev.totalXP + XP_PER_COMPLETION,
            dailyXP: {
              date: today, // Always use today's date for XP tracking
              xp: prev.dailyXP.xp + XP_PER_COMPLETION
            }
          }));

          return {
            ...habit,
            logs: [...habit.logs, dateStr],
            xp: habit.xp + XP_PER_COMPLETION
          };
        } else if (hasLog) {
          setStats(prev => ({
            totalXP: prev.totalXP - XP_PER_COMPLETION,
            dailyXP: {
              date: today, // Always use today's date for XP tracking
              xp: prev.dailyXP.xp - XP_PER_COMPLETION
            }
          }));

          return {
            ...habit,
            logs: habit.logs.filter(date => date !== dateStr),
            xp: habit.xp - XP_PER_COMPLETION
          };
        }
      }
      return habit;
    }));
  };

  const deleteHabit = (habitId: number) => {
    setHabits(habits.filter(habit => habit.id !== habitId));
  };

  const isHabitCompletedForDate = (habit: Habit, date: Date) => {
    return habit.logs.includes(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2"></h1>
          <p className="text-slate-600"></p>
        </header>
        
        {showLevelUp && (
          <div className="mb-8">
            <LevelUpCelebration level={level} onClose={() => setShowLevelUp(false)} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-8">
          <div className="md:col-span-5">
            <div className="glass-card p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-slate-700 text-xl">Today's Quests</h2>
                  <p className="text-slate-500 text-sm">{format(selectedDate, 'EEEE, MMMM d')}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                    className="p-2 rounded-full hover:bg-indigo-100 transition-colors"
                    title="Previous day"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className={`text-sm px-3 py-1 rounded-full ${isToday(selectedDate) ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-indigo-50'} transition-colors`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    className="p-2 rounded-full hover:bg-indigo-100 transition-colors"
                    title="Next day"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {habits.length > 0 ? (
                <ul className="space-y-3">
                  {habits.map((habit) => {
                    const isCompleted = isHabitCompletedForDate(habit, selectedDate);
                    return (
                      <li 
                        key={habit.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                          isCompleted 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleHabit(habit.id)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full mr-3 flex items-center justify-center transition-all duration-200 ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : 'border-2 border-slate-300 hover:border-indigo-400'
                            }`}
                          >
                            <CheckmarkIcon checked={isCompleted} animate={true} />
                          </button>
                          <span className={`text-slate-700 font-medium ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                            {habit.name}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 mr-2">{habit.xp} XP</span>
                          <button
                            onClick={() => deleteHabit(habit.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title="Delete habit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center p-8">
                  <div className="inline-block p-3 rounded-full bg-indigo-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-slate-700 font-medium mb-1">No quests yet</h3>
                  <p className="text-slate-500 text-sm mb-4">Start by adding your first daily quest</p>
                </div>
              )}

              {habits.length < MAX_HABITS && (
                <div className="mt-6">
                  <form onSubmit={addHabit} className="flex items-center">
                    <input
                      type="text"
                      value={newHabit}
                      onChange={(e) => setNewHabit(e.target.value)}
                      placeholder="Enter a new quest..."
                      className="flex-1 rounded-l-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newHabit.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Quest
                    </button>
                  </form>
                </div>
              )}
            </div>
            
            <WeeklyProgress habits={habits} />
          </div>
          
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {level}
                  </div>
                  {stats.dailyXP.xp > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                      +{stats.dailyXP.xp}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-700">Level {level}</h3>
                <p className="text-slate-500 text-sm mb-4">Quest Master</p>
                
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentLevelXP / nextLevelXP) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600">{stats.totalXP} XP total</p>
              </div>
            </div>
            
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Today's Progress</h3>
              <div className="flex items-center mb-2">
                <div className="w-full bg-slate-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.dailyXP.xp / MAX_DAILY_XP) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-slate-600 whitespace-nowrap">{stats.dailyXP.xp}/{MAX_DAILY_XP} XP</span>
              </div>
              <p className="text-sm text-slate-500">
                {habits.filter(habit => isHabitCompletedForDate(habit, new Date())).length} of {habits.length} quests completed today
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
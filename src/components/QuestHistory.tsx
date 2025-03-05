'use client';

import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getWeek, getYear, getMonth } from 'date-fns';

interface QuestHistoryProps {
  habits: {
    id: string;
    name: string;
    logs: string[];
  }[];
}

export function QuestHistory({ habits }: QuestHistoryProps) {
  const [selectedWeek, setSelectedWeek] = useState(() => getWeek(new Date()));
  const [selectedYear, setSelectedYear] = useState(() => getYear(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(() => getMonth(new Date()));
  
  const getWeekDates = (weekNumber: number) => {
    const now = new Date(selectedYear, selectedMonth);
    const start = startOfWeek(now);
    start.setDate(start.getDate() + (weekNumber - getWeek(now)) * 7);
    const end = endOfWeek(start);
    
    return eachDayOfInterval({ start, end });
  };

  const weekDates = getWeekDates(selectedWeek);

  const getCompletionForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (habits.length === 0) return { percentage: 0, completed: [], streak: 0 };
    const completedHabits = habits.filter(habit => habit.logs.includes(dateStr));
    
    // Calculate streak
    let streak = 0;
    let currentDate = new Date(date);
    while (true) {
      const dateToCheck = format(currentDate, 'yyyy-MM-dd');
      const completion = habits.filter(habit => habit.logs.includes(dateToCheck)).length;
      if (completion === 0) break;
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return {
      percentage: Math.round((completedHabits.length / habits.length) * 100),
      completed: completedHabits.map(h => h.name),
      streak
    };
  };

  // Simplified function to just return the percentage for UI display
  const getCompletionPercentage = (date: Date): number => {
    const result = getCompletionForDate(date);
    return result.percentage;
  };

  const getWeeklyAverage = () => {
    const percentages = weekDates.map(date => 
      getCompletionForDate(date).percentage
    );
    return Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Quest History</h1>
          <p className="text-slate-600">Track your journey and see your progress over time</p>
        </header>

        <div className="glass-card p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Progress Overview</h2>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-white rounded-lg shadow-sm">
                <button 
                  onClick={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)}
                  className="p-2 hover:bg-slate-50 text-slate-600 rounded-l-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-3 py-2 text-sm font-medium text-slate-700">
                  {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy')}
                </span>
                <button 
                  onClick={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)}
                  className="p-2 hover:bg-slate-50 text-slate-600 rounded-r-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center bg-white rounded-lg shadow-sm">
                <button 
                  onClick={() => setSelectedWeek(prev => prev === 1 ? 52 : prev - 1)}
                  className="p-2 hover:bg-slate-50 text-slate-600 rounded-l-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-3 py-2 text-sm font-medium text-slate-700">Week {selectedWeek}</span>
                <button 
                  onClick={() => setSelectedWeek(prev => prev === 52 ? 1 : prev + 1)}
                  className="p-2 hover:bg-slate-50 text-slate-600 rounded-r-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {habits.length > 0 ? (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-700">Weekly Average</h3>
                  <div className="text-2xl font-bold text-indigo-600">{getWeeklyAverage()}%</div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${getWeeklyAverage()}%` }}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-medium text-slate-700 mb-4">Daily Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getWeekDates(selectedWeek).map(date => {
                    const completionPct = getCompletionPercentage(date);
                    const dateString = format(date, 'yyyy-MM-dd');
                    const isCurrentDay = dateString === format(new Date(), 'yyyy-MM-dd');
                    
                    return (
                      <div 
                        key={dateString}
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          isCurrentDay 
                            ? 'border-indigo-200 bg-indigo-50' 
                            : 'border-slate-200 bg-white hover:border-indigo-100 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <div className="text-sm font-medium text-slate-500">{format(date, 'EEE')}</div>
                            <div className="text-lg font-semibold text-slate-800">{format(date, 'd MMM')}</div>
                          </div>
                          <div className={`text-2xl font-bold ${
                            completionPct >= 80 ? 'text-green-500' : 
                            completionPct >= 50 ? 'text-indigo-500' : 
                            completionPct > 0 ? 'text-amber-500' : 'text-slate-300'
                          }`}>
                            {completionPct}%
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {habits.map(habit => {
                            const isCompleted = habit.logs.includes(dateString);
                            return (
                              <div key={habit.id} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                                  isCompleted ? 'bg-green-500' : 'bg-slate-200'
                                }`} />
                                <span className={`text-sm ${
                                  isCompleted ? 'text-slate-700' : 'text-slate-400'
                                }`}>
                                  {habit.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="inline-block p-3 rounded-full bg-indigo-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-700 mb-2">No Quest History Yet</h3>
              <p className="text-slate-500 mb-6">Start adding quests to see your progress over time</p>
              <a href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors">
                Go to Quests
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
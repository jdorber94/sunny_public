'use client';

import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getWeek, getYear, getMonth } from 'date-fns';

interface QuestHistoryProps {
  habits: {
    id: number;
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

  const getWeeklyAverage = () => {
    const percentages = weekDates.map(date => 
      getCompletionForDate(date).percentage
    );
    return Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-700">Quest History</h2>
          <div className="flex items-center gap-4">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white rounded-lg px-3 py-2 text-slate-700"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {format(new Date(2024, i), 'MMMM')}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white rounded-lg px-3 py-2 text-slate-700"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={2024 - i}>
                  {2024 - i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedWeek(prev => prev - 1)}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              ←
            </button>
            <span className="text-slate-600 font-medium">
              Week {selectedWeek}
            </span>
            <button
              onClick={() => setSelectedWeek(prev => prev + 1)}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              →
            </button>
          </div>
          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl">
            Weekly Average: {getWeeklyAverage()}%
          </div>
        </div>

        <div className="grid gap-4">
          {weekDates.map(date => {
            const { percentage, completed, streak } = getCompletionForDate(date);
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <div 
                key={date.toISOString()} 
                className={`glass-card p-4 ${isToday ? 'ring-2 ring-blue-200' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-lg font-medium text-slate-700">
                      {format(date, 'EEEE')}
                    </div>
                    <div className="text-sm text-slate-500">
                      {format(date, 'MMMM d, yyyy')}
                    </div>
                    {streak > 0 && (
                      <div className="mt-1 text-sm text-orange-500">
                        🔥 {streak} day streak
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-700">
                    {percentage}%
                  </div>
                </div>
                
                {completed.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-600">Completed:</div>
                    <div className="flex flex-wrap gap-2">
                      {completed.map(habit => (
                        <span 
                          key={habit}
                          className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-sm"
                        >
                          {habit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
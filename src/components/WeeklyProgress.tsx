'use client';

import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getWeek } from 'date-fns';

interface WeeklyProgressProps {
  habits: {
    id: string;
    name: string;
    logs: string[];
  }[];
}

export function WeeklyProgress({ habits }: WeeklyProgressProps) {
  const [selectedWeek, setSelectedWeek] = useState(() => getWeek(new Date()));
  
  const getWeekDates = (weekNumber: number) => {
    const now = new Date();
    const start = startOfWeek(now);
    start.setDate(start.getDate() + (weekNumber - getWeek(now)) * 7);
    const end = endOfWeek(start);
    
    return eachDayOfInterval({ start, end });
  };

  const weekDates = getWeekDates(selectedWeek);

  const getDailyCompletion = (date: string) => {
    if (habits.length === 0) return 0;
    const completedHabits = habits.filter(habit => habit.logs.includes(date)).length;
    return Math.round((completedHabits / habits.length) * 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: format(date, 'EEE'), // Mon, Tue, etc
      date: format(date, 'd'), // 1, 2, etc
    };
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-700">Weekly Overview</h3>
        <div className="flex items-center space-x-2 text-sm">
          <button 
            onClick={() => setSelectedWeek(selectedWeek - 1)}
            className="p-1.5 rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-slate-600">Week {selectedWeek}</span>
          <button 
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            className="p-1.5 rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors"
            disabled={selectedWeek >= getWeek(new Date())}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const completion = getDailyCompletion(dateStr);
          const isCurrentDay = dateStr === format(new Date(), 'yyyy-MM-dd');
          const { day, date: dayNumber } = formatDate(dateStr);
          
          return (
            <div key={dateStr} className="flex flex-col items-center">
              <div className="text-xs text-slate-500 mb-1">{day}</div>
              <div 
                className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 font-medium text-sm
                  ${isCurrentDay 
                    ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300 ring-offset-2' 
                    : 'bg-slate-100 text-slate-700'}`}
              >
                {dayNumber}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-16 relative">
                <div 
                  className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-300 ease-out
                    ${completion > 0 
                      ? 'bg-gradient-to-t from-green-500 to-green-400' 
                      : 'bg-slate-200'}`}
                  style={{ 
                    height: `${completion}%`,
                    minHeight: completion > 0 ? '8px' : '0'
                  }}
                />
              </div>
              <div className="text-xs font-medium mt-2 text-slate-700">{completion}%</div>
            </div>
          );
        })}
      </div>
      
      {habits.length === 0 && (
        <div className="text-center text-slate-500 mt-6 text-sm">
          Add habits to start tracking your weekly progress
        </div>
      )}
    </div>
  );
} 
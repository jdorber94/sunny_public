'use client';

import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getWeek } from 'date-fns';

interface WeeklyProgressProps {
  habits: {
    id: number;
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
    <div className="glass-card p-4 sm:p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-700 mb-4 sm:mb-6">Weekly Overview</h3>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {weekDates.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const completion = getDailyCompletion(dateStr);
          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
          const { day, date: dayNumber } = formatDate(dateStr);
          
          return (
            <div 
              key={dateStr}
              className={`flex flex-col items-center ${isToday ? 'relative' : ''}`}
            >
              {isToday && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500" />
              )}
              <div className="text-[10px] sm:text-xs font-medium text-slate-400 mb-0.5 sm:mb-1">
                {day}
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-slate-600 mb-1.5 sm:mb-2">
                {dayNumber}
              </div>
              <div className="relative w-full pt-[100%] rounded-md sm:rounded-lg bg-slate-100/50 overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-indigo-400 transition-all duration-300"
                  style={{ height: `${completion}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-medium text-slate-700">
                    {completion}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 
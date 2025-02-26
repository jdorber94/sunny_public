'use client';

import React from 'react';

interface CalendarProps {
  habits: Array<{
    id: number;
    name: string;
    logs: string[];
  }>;
}

export function WeeklyCalendar({ habits }: CalendarProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
      border border-white/20 mb-12 transition-all duration-300 hover:bg-white/70">
      <h2 className="text-xl font-semibold text-slate-700 mb-6">Weekly Overview</h2>
      
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {days.map(day => (
          <div key={day} className="text-center text-sm font-medium text-slate-400">
            {day}
          </div>
        ))}
        
        {/* Calendar cells */}
        {days.map((_, index) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + index);
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === today.toISOString().split('T')[0];
          const completedHabits = habits.filter(habit => habit.logs.includes(dateStr));
          const completionRate = habits.length ? (completedHabits.length / habits.length) * 100 : 0;

          return (
            <div
              key={dateStr}
              className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-center
                transition-all duration-200
                ${isToday ? 'bg-blue-50/50 border-2 border-blue-200' : 'bg-slate-50/50'}`}
            >
              <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>
                {date.getDate()}
              </span>
              {habits.length > 0 && (
                <div className="mt-1 w-8 h-1 rounded-full overflow-hidden bg-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-400"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 
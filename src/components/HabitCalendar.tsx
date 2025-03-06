import React, { useState, useEffect } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { Habit } from '@/types';
import { FaCheck, FaTimes } from 'react-icons/fa';

export const HabitCalendar: React.FC = () => {
  const { habits, isHabitCompletedToday } = useHabits();
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  
  // Generate the dates for the current week
  useEffect(() => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - day);
    
    // Generate an array of dates for the week
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
    
    setCurrentWeek(weekDates);
  }, []);
  
  // Check if a habit was completed on a specific date
  const isHabitCompletedOnDate = (habit: Habit, date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    return habit.logs.includes(dateString);
  };
  
  // Format date as "Mon 01"
  const formatDate = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate().toString().padStart(2, '0');
    return `${day} ${dayOfMonth}`;
  };
  
  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  if (!habits.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">
          No habits to display in the calendar. Add some habits first!
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-gray-600 font-medium">Habit</th>
            {currentWeek.map((date) => (
              <th 
                key={date.toISOString()} 
                className={`py-3 px-4 text-center text-gray-600 font-medium ${
                  isToday(date) ? 'bg-blue-50' : ''
                }`}
              >
                {formatDate(date)}
                {isToday(date) && (
                  <span className="ml-1 text-xs bg-blue-500 text-white px-1 py-0.5 rounded">
                    Today
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {habits.map((habit) => (
            <tr key={habit.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 text-gray-800 font-medium">{habit.name}</td>
              {currentWeek.map((date) => {
                const completed = isHabitCompletedOnDate(habit, date);
                const isPast = date <= new Date();
                
                return (
                  <td 
                    key={date.toISOString()} 
                    className={`py-3 px-4 text-center ${
                      isToday(date) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {isPast ? (
                      completed ? (
                        <div className="flex justify-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <FaCheck className="text-white text-xs" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                            <FaTimes className="text-red-500 text-xs" />
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-center">
                        <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 
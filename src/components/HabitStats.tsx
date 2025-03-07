import React from 'react';
import { Habit } from '@/lib/firestoreService';
import { FaFire, FaCalendarCheck, FaTrophy } from 'react-icons/fa';

interface HabitStatsProps {
  habits: Habit[];
}

export const HabitStats: React.FC<HabitStatsProps> = ({ habits }) => {
  // Calculate total habits
  const totalHabits = habits.length;
  
  // Calculate total completions
  const totalCompletions = habits.reduce((sum, habit) => sum + habit.logs.length, 0);
  
  // Calculate average streak
  const averageStreak = habits.length 
    ? Math.round(habits.reduce((sum, habit) => sum + (habit.streak || 0), 0) / habits.length) 
    : 0;
  
  // Find the habit with the longest streak
  const habitWithLongestStreak = habits.reduce<Habit | null>(
    (longest, habit) => {
      const currentStreak = habit.streak || 0;
      const longestStreak = longest?.streak || 0;
      return currentStreak > longestStreak ? habit : longest;
    },
    null
  );
  
  // Calculate completion rate for the last 7 days
  const calculateCompletionRate = () => {
    if (!habits.length) return 0;
    
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    
    let totalPossible = 0;
    let totalCompleted = 0;
    
    habits.forEach(habit => {
      // For each habit, check how many days in the last 7 days it was completed
      last7Days.forEach(dateString => {
        totalPossible++;
        if (habit.logs.includes(dateString)) {
          totalCompleted++;
        }
      });
    });
    
    return totalPossible ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  };
  
  const completionRate = calculateCompletionRate();
  
  if (!habits.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">
          No habits to display statistics for. Add some habits first!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <FaCalendarCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Completions</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalCompletions}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
              <FaFire size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Streak</p>
              <h3 className="text-2xl font-bold text-gray-800">{averageStreak} days</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <FaTrophy size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completion Rate (7 days)</p>
              <h3 className="text-2xl font-bold text-gray-800">{completionRate}%</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Habit Performance</h3>
        <div className="space-y-4">
          {habits.map(habit => {
            const completionPercentage = habit.logs.length ? 
              Math.min(100, Math.round((habit.logs.length / 30) * 100)) : 0;
            
            return (
              <div key={habit.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{habit.name}</span>
                  <span className="text-sm text-gray-500">
                    {habit.streak ? `${habit.streak} day streak` : 'No streak'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {habitWithLongestStreak && (habitWithLongestStreak.streak || 0) > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Longest Streak</h3>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <FaFire size={24} />
            </div>
            <div>
              <p className="text-gray-700">{habitWithLongestStreak.name}</p>
              <p className="text-xl font-bold text-gray-800">
                {habitWithLongestStreak.streak || 0} days
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
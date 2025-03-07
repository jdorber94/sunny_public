'use client';

import React from 'react';
import { HabitList } from './HabitList';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { useHabits } from '@/hooks/useHabits';

export default function HabitTracker() {
  const { habits, isLoading, error, deleteHabitById, logHabit } = useHabits();

  const handleDeleteHabit = async (habitId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this habit?');
    if (confirmed) {
      await deleteHabitById(habitId);
    }
  };

  const handleLogHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    await logHabit(habitId, today);
  };

  return (
    <ErrorBoundary>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Habit Tracker</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error.message}</span>
            </div>
          ) : (
            <HabitList 
              habits={habits} 
              onEdit={() => {}} 
              onDelete={handleDeleteHabit}
              onLog={handleLogHabit}
            />
          )}
        </div>
        
        <Toaster position="bottom-right" />
      </main>
    </ErrorBoundary>
  );
} 
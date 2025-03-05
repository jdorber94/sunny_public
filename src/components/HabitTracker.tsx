'use client';

import React from 'react';
import { HabitList } from './HabitList';
import { HabitSetSelector } from './HabitSetSelector';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';

export default function HabitTracker() {
  return (
    <ErrorBoundary>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Habit Tracker</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <HabitSetSelector />
          <HabitList />
        </div>
        
        <Toaster position="bottom-right" />
      </main>
    </ErrorBoundary>
  );
} 
'use client';

import { HabitList } from '@/components/HabitList';
import { HabitSetSelector } from '@/components/HabitSetSelector';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Habit Tracker</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <HabitSetSelector />
        <HabitList />
      </div>
      
      <Toaster position="bottom-right" />
    </main>
  );
}

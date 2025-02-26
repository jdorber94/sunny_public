'use client';

import { WeeklyProgress } from '@/components/WeeklyProgress';
import { useState, useEffect } from 'react';

export default function ProgressPage() {
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 pb-24 lg:pb-6">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-slate-700 mb-8">Progress</h1>
        <WeeklyProgress habits={habits} />
        {/* Add more progress visualizations here */}
      </div>
    </div>
  );
} 
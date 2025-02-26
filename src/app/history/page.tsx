'use client';

import { QuestHistory } from '@/components/QuestHistory';
import { useState, useEffect } from 'react';

export default function HistoryPage() {
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-slate-700 mb-8">History</h1>
        <QuestHistory habits={habits} />
      </div>
    </div>
  );
} 
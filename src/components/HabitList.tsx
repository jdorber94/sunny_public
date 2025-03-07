import React from 'react';
import { Habit as HabitType } from '@/lib/firestoreService';
import { Habit } from './Habit';
import { AnimatePresence } from 'framer-motion';

interface HabitListProps {
  habits: HabitType[];
  onEdit: (habit: HabitType) => void;
  onDelete: (habitId: string) => void;
  onLog: (habitId: string) => void;
}

export const HabitList: React.FC<HabitListProps> = ({ 
  habits,
  onEdit,
  onDelete,
  onLog
}) => {
  // Render empty state
  if (!habits || habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-medium text-gray-700 mb-2">No habits yet</h3>
        <p className="text-gray-500 mb-6 text-center">
          Start tracking your habits by adding your first habit.
        </p>
      </div>
    );
  }
  
  // Render habit list
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {habits.map(habit => (
          <Habit 
            key={habit.id} 
            habit={habit} 
            onEdit={() => onEdit(habit)} 
            onDelete={() => onDelete(habit.id)}
            onLog={() => onLog(habit.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}; 
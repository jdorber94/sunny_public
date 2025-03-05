import { useState } from 'react';
import { Habit } from '@/lib/firestoreService';
import { toast } from 'react-hot-toast';
import { calculateStreak } from '@/utils/habitUtils';

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => Promise<void>;
  onDeleteHabit: (id: string) => Promise<void>;
  onEditHabit: (habit: Habit) => void;
}

export default function HabitList({
  habits,
  onToggleHabit,
  onDeleteHabit,
  onEditHabit
}: HabitListProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleToggle = async (habit: Habit) => {
    setLoadingStates(prev => ({ ...prev, [habit.id]: true }));
    try {
      await onToggleHabit(habit.id);
    } catch (error) {
      toast.error('Failed to update habit');
    } finally {
      setLoadingStates(prev => ({ ...prev, [habit.id]: false }));
    }
  };

  const handleDelete = async (habit: Habit) => {
    if (window.confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      setLoadingStates(prev => ({ ...prev, [habit.id]: true }));
      try {
        await onDeleteHabit(habit.id);
        toast.success('Habit deleted');
      } catch (error) {
        toast.error('Failed to delete habit');
      } finally {
        setLoadingStates(prev => ({ ...prev, [habit.id]: false }));
      }
    }
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No habits yet. Add your first habit to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {habits.map(habit => (
        <div
          key={habit.id}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleToggle(habit)}
                disabled={loadingStates[habit.id]}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors
                  ${
                    habit.logs.includes(new Date().toISOString().split('T')[0])
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
              >
                {habit.logs.includes(new Date().toISOString().split('T')[0]) && (
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  {habit.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {calculateStreak(habit.logs)} day streak
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEditHabit(habit)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(habit)}
                disabled={loadingStates[habit.id]}
                className="p-2 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 
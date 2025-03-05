import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface AddHabitFormProps {
  onAddHabit: (name: string) => Promise<void>;
  maxHabits: number;
  currentHabitCount: number;
}

export default function AddHabitForm({
  onAddHabit,
  maxHabits,
  currentHabitCount
}: AddHabitFormProps) {
  const [habitName, setHabitName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!habitName.trim()) {
      toast.error('Please enter a habit name');
      return;
    }

    if (currentHabitCount >= maxHabits) {
      toast.error(`You can only have ${maxHabits} habits at a time`);
      return;
    }

    setLoading(true);
    try {
      await onAddHabit(habitName);
      setHabitName('');
    } catch (error) {
      console.error('Error adding habit:', error);
      toast.error('Failed to add habit');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Input value:', e.target.value); // Debug log
    setHabitName(e.target.value);
  };

  return (
    <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Habit</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={habitName}
          onChange={handleInputChange}
          placeholder="Enter a new habit..."
          disabled={loading || currentHabitCount >= maxHabits}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={loading || !habitName.trim() || currentHabitCount >= maxHabits}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            'Add Habit'
          )}
        </button>
      </form>
      
      {currentHabitCount >= maxHabits ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          You have reached the maximum number of habits ({maxHabits})
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {maxHabits - currentHabitCount} more habits available
        </p>
      )}
    </div>
  );
} 
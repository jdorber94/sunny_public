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
      toast.error('You have reached the maximum number of habits');
      return;
    }

    setLoading(true);
    try {
      await onAddHabit(habitName.trim());
      setHabitName('');
      toast.success('Habit added successfully');
    } catch (error) {
      toast.error('Failed to add habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          placeholder="Add a new habit..."
          disabled={loading || currentHabitCount >= maxHabits}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={loading || !habitName.trim() || currentHabitCount >= maxHabits}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Habit'}
        </button>
      </form>
      
      {currentHabitCount >= maxHabits && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          You have reached the maximum number of habits ({maxHabits})
        </p>
      )}
    </div>
  );
} 
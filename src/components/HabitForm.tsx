import React, { useState, useEffect } from 'react';
import { Habit } from '@/lib/firestoreService';
import { motion } from 'framer-motion';
import { FaTimes, FaSave } from 'react-icons/fa';

interface HabitFormProps {
  habit: Habit | null;
  onSave: (habit: Omit<Habit, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export const HabitForm: React.FC<HabitFormProps> = ({ habit, onSave, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  
  // Initialize form with habit data if editing
  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setCategory(habit.category || '');
      setDaysOfWeek(habit.daysOfWeek || []);
    }
  }, [habit]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const habitData: Omit<Habit, 'id'> = {
        name: name.trim(),
        logs: habit?.logs || [],
        xp: habit?.xp || 0,
        streak: habit?.streak || 0
      };
      
      // Only add category if it has a value
      if (category && category.trim()) {
        habitData.category = category.trim();
      }
      
      // Only add daysOfWeek if it has values
      if (daysOfWeek.length > 0) {
        habitData.daysOfWeek = daysOfWeek;
      }
      
      await onSave(habitData);
      onCancel();
    } catch (err) {
      console.error('Error saving habit:', err);
      setError('Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle a day of the week
  const toggleDay = (day: number) => {
    setDaysOfWeek(current => {
      if (current.includes(day)) {
        return current.filter(d => d !== day);
      } else {
        return [...current, day].sort();
      }
    });
  };
  
  // Get day name
  const getDayName = (day: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day];
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {habit ? 'Edit Habit' : 'Add New Habit'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
            Habit Name*
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Drink Water"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
            Category (optional)
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Health, Fitness, Learning"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Days of Week (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${daysOfWeek.includes(day)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                `}
              >
                {getDayName(day)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Save Habit
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}; 
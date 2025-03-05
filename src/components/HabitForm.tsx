import React, { useState, useEffect } from 'react';
import { Habit } from '@/types';
import { useHabits } from '@/hooks/useHabits';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSave } from 'react-icons/fa';

interface HabitFormProps {
  onClose: () => void;
  habitToEdit: Habit | null;
}

export const HabitForm: React.FC<HabitFormProps> = ({ onClose, habitToEdit }) => {
  const { createHabit, updateHabit } = useHabits();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  
  // Initialize form with habit data if editing
  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setCategory(habitToEdit.category || '');
      setDaysOfWeek(habitToEdit.daysOfWeek || []);
    }
  }, [habitToEdit]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (habitToEdit) {
        // Update existing habit
        await updateHabit(habitToEdit.id, {
          name,
          category: category || undefined,
          daysOfWeek: daysOfWeek.length ? daysOfWeek : undefined
        });
      } else {
        // Create new habit
        await createHabit({
          name,
          logs: [],
          xp: 0,
          category: category || undefined,
          daysOfWeek: daysOfWeek.length ? daysOfWeek : undefined
        });
      }
      
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle day selection
  const toggleDay = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day].sort()
    );
  };
  
  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              {habitToEdit ? 'Edit Habit' : 'Add New Habit'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Habit Name*
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Drink water"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category (optional)
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Health, Productivity"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week (optional)
              </label>
              <div className="flex justify-between">
                {dayNames.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                      ${daysOfWeek.includes(index)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      transition-colors duration-200
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
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
                    {habitToEdit ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}; 
import React, { useState } from 'react';
import { Habit as HabitType } from '@/types';
import { Habit } from './Habit';
import { useHabits } from '@/hooks/useHabits';
import { AnimatePresence, motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';
import { HabitForm } from './HabitForm';

export const HabitList: React.FC = () => {
  const { 
    habits, 
    activeHabitSet, 
    loadingHabits, 
    habitsError 
  } = useHabits();
  
  // Add console logging for debugging
  console.log('HabitList rendering with:', {
    habitCount: habits?.length,
    activeHabitSet: activeHabitSet?.name,
    loading: loadingHabits,
    hasError: !!habitsError
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<HabitType | null>(null);
  
  // Handle opening the form for editing a habit
  const handleEditHabit = (habit: HabitType) => {
    setHabitToEdit(habit);
    setIsFormOpen(true);
  };
  
  // Handle closing the form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setHabitToEdit(null);
  };
  
  // Render loading state
  if (loadingHabits) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading habits...</p>
      </div>
    );
  }
  
  // Render error state
  if (habitsError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {habitsError.message || 'Error loading habits'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (!habits.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <img 
          src="/empty-state.svg" 
          alt="No habits" 
          className="w-48 h-48 mb-4 opacity-60"
          onError={(e) => {
            // Fallback if image doesn't exist
            e.currentTarget.style.display = 'none';
          }}
        />
        <h3 className="text-xl font-medium text-gray-700 mb-2">No habits yet</h3>
        <p className="text-gray-500 mb-6 text-center">
          {activeHabitSet 
            ? `Start tracking your habits in "${activeHabitSet.name}" by adding your first habit.`
            : 'Create a habit set first to start tracking your habits.'}
        </p>
        
        {activeHabitSet && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
          >
            <FaPlus className="mr-2" />
            Add your first habit
          </button>
        )}
        
        {isFormOpen && (
          <HabitForm onClose={handleCloseForm} habitToEdit={habitToEdit} />
        )}
      </div>
    );
  }
  
  // Render habit list
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {activeHabitSet?.name || 'My Habits'}
        </h2>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Habit
        </motion.button>
      </div>
      
      <AnimatePresence>
        {Array.isArray(habits) && habits.length > 0 ? (
          habits.map(habit => (
            <Habit 
              key={habit.id} 
              habit={habit} 
              onEdit={handleEditHabit} 
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            No habits yet. Click "Add Habit" to create your first habit.
          </div>
        )}
      </AnimatePresence>
      
      {isFormOpen && (
        <HabitForm onClose={handleCloseForm} habitToEdit={habitToEdit} />
      )}
    </div>
  );
}; 
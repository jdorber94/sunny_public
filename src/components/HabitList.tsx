import React, { useState, useEffect } from 'react';
import { Habit as HabitType } from '@/types';
import { Habit } from './Habit';
import { useHabits } from '@/hooks/useHabits';
import { AnimatePresence } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';
import { HabitForm } from './HabitForm';

interface HabitListProps {
  onEditHabit?: (habit: HabitType) => void;
  showAddButton?: boolean;
}

export const HabitList: React.FC<HabitListProps> = ({ 
  onEditHabit,
  showAddButton = false
}) => {
  const { 
    habits, 
    activeHabitSet, 
    loadingHabits, 
    habitsError 
  } = useHabits();
  
  // Add console logging for debugging
  useEffect(() => {
    console.log('HabitList rendering with:', {
      habitCount: habits?.length,
      activeHabitSet: activeHabitSet?.name,
      loading: loadingHabits,
      hasError: !!habitsError
    });
  }, [habits, activeHabitSet, loadingHabits, habitsError]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<HabitType | null>(null);
  
  // Handle opening the form for editing a habit
  const handleEditHabit = (habit: HabitType) => {
    if (onEditHabit) {
      onEditHabit(habit);
    } else {
      setHabitToEdit(habit);
      setIsFormOpen(true);
    }
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
  if (!habits || !habits.length) {
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
        
        {/* The Add Habit button is now handled by the parent component */}
        
        {isFormOpen && (
          <HabitForm onClose={handleCloseForm} habitToEdit={habitToEdit} />
        )}
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
            onEdit={handleEditHabit} 
          />
        ))}
      </AnimatePresence>
      
      {isFormOpen && (
        <HabitForm onClose={handleCloseForm} habitToEdit={habitToEdit} />
      )}
    </div>
  );
}; 
'use client';

import React, { useState, useEffect } from 'react';
import { HabitList } from './HabitList';
import { HabitForm } from './HabitForm';
import { HabitCalendar } from './HabitCalendar';
import { HabitStats } from './HabitStats';
import { useHabits } from '@/hooks/useHabits';
import { Habit as HabitType } from '@/lib/firestoreService';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function EnhancedHabitTracker() {
  const { 
    habits, 
    isLoading, 
    error,
    addHabit,
    updateHabitById,
    deleteHabitById,
    logHabit
  } = useHabits();
  
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<HabitType | null>(null);
  const [view, setView] = useState<'list' | 'calendar' | 'stats'>('list');
  
  // Add debugging logs
  useEffect(() => {
    console.log('EnhancedHabitTracker state:', {
      habitCount: habits?.length,
      isLoading,
      hasError: !!error,
      user: user?.uid
    });
    
    // Add more detailed debugging
    if (error) {
      console.error('Habits error:', error);
    }
  }, [habits, isLoading, error, user]);
  
  // Handle opening the form for adding a new habit
  const handleAddHabit = () => {
    setHabitToEdit(null);
    setIsFormOpen(true);
  };
  
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
  
  // Handle saving a habit
  const handleSaveHabit = async (habit: Omit<HabitType, 'id'>) => {
    if (habitToEdit) {
      // Update existing habit
      const success = await updateHabitById(habitToEdit.id, habit);
      if (success) {
        setIsFormOpen(false);
        setHabitToEdit(null);
      }
    } else {
      // Create new habit
      const newHabit = await addHabit(habit);
      if (newHabit) {
        setIsFormOpen(false);
      }
    }
  };
  
  // Handle deleting a habit
  const handleDeleteHabit = async (habitId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this habit?');
    if (confirmed) {
      await deleteHabitById(habitId);
    }
  };
  
  // Handle logging a habit
  const handleLogHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    await logHabit(habitId, today);
  };
  
  // Render the Add Habit button
  const renderAddHabitButton = () => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleAddHabit}
      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
    >
      <FaPlus className="mr-2" />
      Add Habit
    </motion.button>
  );
  
  // Render the view navigation
  const renderViewNav = () => (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => setView('list')}
        className={`px-3 py-2 rounded-md flex items-center ${
          view === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        <FaPlus className="mr-2" />
        List
      </button>
      <button
        onClick={() => setView('calendar')}
        className={`px-3 py-2 rounded-md flex items-center ${
          view === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        <FaCalendarAlt className="mr-2" />
        Calendar
      </button>
      <button
        onClick={() => setView('stats')}
        className={`px-3 py-2 rounded-md flex items-center ${
          view === 'stats' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        <FaChartBar className="mr-2" />
        Stats
      </button>
    </div>
  );
  
  // Render the main content based on the selected view
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error.message}</span>
        </div>
      );
    }
    
    if (!user) {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not logged in!</strong>
          <span className="block sm:inline"> Please log in to track your habits.</span>
        </div>
      );
    }
    
    if (habits.length === 0) {
      return (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No habits yet!</strong>
          <span className="block sm:inline"> Click the "Add Habit" button to create your first habit.</span>
        </div>
      );
    }
    
    switch (view) {
      case 'calendar':
        return <HabitCalendar habits={habits} />;
      case 'stats':
        return <HabitStats habits={habits} />;
      case 'list':
      default:
        return (
          <HabitList 
            habits={habits} 
            onEdit={handleEditHabit} 
            onDelete={handleDeleteHabit}
            onLog={handleLogHabit}
          />
        );
    }
  };
  
  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Toaster position="top-right" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Habit Tracker</h1>
          <div className="flex space-x-2">
            {renderAddHabitButton()}
          </div>
        </div>
        
        {renderViewNav()}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderContent()}
        </div>
        
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              >
                <HabitForm
                  habit={habitToEdit}
                  onSave={handleSaveHabit}
                  onCancel={handleCloseForm}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
} 
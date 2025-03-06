'use client';

import React, { useState, useEffect } from 'react';
import { HabitList } from './HabitList';
import { HabitSetSelector } from './HabitSetSelector';
import { HabitForm } from './HabitForm';
import { HabitCalendar } from './HabitCalendar';
import { HabitStats } from './HabitStats';
import { useHabits } from '@/hooks/useHabits';
import { Habit as HabitType } from '@/types';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaCalendarAlt, FaChartBar } from 'react-icons/fa';

export default function EnhancedHabitTracker() {
  const { 
    habits, 
    activeHabitSet, 
    loadingHabits, 
    habitsError 
  } = useHabits();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<HabitType | null>(null);
  const [view, setView] = useState<'list' | 'calendar' | 'stats'>('list');
  
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
  
  return (
    <ErrorBoundary>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Habit Tracker</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <HabitSetSelector />
          
          {activeHabitSet && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {activeHabitSet.name}
                </h2>
                
                <div className="flex space-x-2">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setView('list')}
                      className={`px-3 py-1 rounded-md ${
                        view === 'list' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      List
                    </button>
                    <button
                      onClick={() => setView('calendar')}
                      className={`px-3 py-1 rounded-md ${
                        view === 'calendar' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaCalendarAlt className="inline mr-1" />
                      Calendar
                    </button>
                    <button
                      onClick={() => setView('stats')}
                      className={`px-3 py-1 rounded-md ${
                        view === 'stats' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaChartBar className="inline mr-1" />
                      Stats
                    </button>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddHabit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
                  >
                    <FaPlus className="mr-2" />
                    Add Habit
                  </motion.button>
                </div>
              </div>
              
              {view === 'list' && (
                <HabitList onEditHabit={handleEditHabit} />
              )}
              
              {view === 'calendar' && (
                <HabitCalendar />
              )}
              
              {view === 'stats' && (
                <HabitStats />
              )}
            </div>
          )}
          
          {!activeHabitSet && !loadingHabits && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg mt-6">
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Active Habit Set</h3>
              <p className="text-gray-500 mb-6 text-center">
                Please create or select a habit set to start tracking your habits.
              </p>
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <HabitForm onClose={handleCloseForm} habitToEdit={habitToEdit} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <Toaster position="bottom-right" />
      </main>
    </ErrorBoundary>
  );
} 
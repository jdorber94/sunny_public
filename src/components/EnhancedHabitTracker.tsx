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
import { FaPlus, FaCalendarAlt, FaChartBar, FaUser } from 'react-icons/fa';
import { createTestUser } from '@/services/firebase/auth';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function EnhancedHabitTracker() {
  const { 
    habits, 
    activeHabitSet, 
    loadingHabits, 
    habitsError,
    loadingHabitSets,
    habitSets,
    createHabitSet
  } = useHabits();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<HabitType | null>(null);
  const [view, setView] = useState<'list' | 'calendar' | 'stats'>('list');
  
  // Add debugging logs
  useEffect(() => {
    console.log('EnhancedHabitTracker state:', {
      activeHabitSet: activeHabitSet?.name,
      habitCount: habits?.length,
      loadingHabits,
      loadingHabitSets,
      hasHabitsError: !!habitsError,
      habitSets: habitSets?.length || 0
    });
    
    // Add more detailed debugging
    if (habitsError) {
      console.error('Habits error:', habitsError);
    }
    
    if (!habitSets || habitSets.length === 0) {
      console.warn('No habit sets available in EnhancedHabitTracker');
    }
    
    if (!activeHabitSet && habitSets && habitSets.length > 0) {
      console.warn('Have habit sets but no active set selected');
    }
  }, [activeHabitSet, habits, loadingHabits, loadingHabitSets, habitsError, habitSets]);
  
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
  
  // Add a function to create a test habit set
  const createTestHabitSet = async () => {
    try {
      console.log('Creating test habit set from EnhancedHabitTracker');
      const result = await createHabitSet({
        name: `Test Set ${new Date().toLocaleTimeString()}`,
        description: "A test habit set created for debugging",
        isPremium: false,
        isActive: true
      });
      
      console.log('Test habit set creation result:', result);
    } catch (error) {
      console.error('Error creating test habit set:', error);
    }
  };
  
  // Add a function to login with a test user
  const loginWithTestUser = async () => {
    try {
      console.log('Logging in with test user');
      const testUser = await createTestUser();
      console.log('Test user logged in:', testUser);
      toast.success('Test user logged in successfully');
    } catch (error) {
      console.error('Error logging in with test user:', error);
      toast.error('Failed to log in with test user');
    }
  };
  
  return (
    <ErrorBoundary>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Habit Tracker</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Add debug button */}
          <div className="mb-4 p-2 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-700 mb-2">Debugging Tools:</p>
            <div className="flex space-x-2">
              <button 
                onClick={createTestHabitSet}
                className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm"
              >
                Create Test Habit Set
              </button>
              <button 
                onClick={loginWithTestUser}
                className="px-3 py-1 bg-green-500 text-white rounded-md text-sm flex items-center"
              >
                <FaUser className="mr-1" size={12} />
                Login Test User
              </button>
            </div>
          </div>
          
          <HabitSetSelector />
          
          {loadingHabitSets && (
            <div className="flex flex-col items-center justify-center p-8 mt-6">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading habit sets...</p>
            </div>
          )}
          
          {!loadingHabitSets && activeHabitSet && (
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
                  
                  {renderAddHabitButton()}
                </div>
              </div>
              
              {view === 'list' && (
                <>
                  {/* Add a standalone Add Habit button at the top of the list for better visibility */}
                  <div className="mb-6 flex justify-end">
                    {renderAddHabitButton()}
                  </div>
                  <HabitList onEditHabit={handleEditHabit} />
                </>
              )}
              
              {view === 'calendar' && (
                <HabitCalendar />
              )}
              
              {view === 'stats' && (
                <HabitStats />
              )}
              
              {/* Add a floating action button for adding habits */}
              <div className="fixed bottom-8 right-8">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddHabit}
                  className="w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600"
                >
                  <FaPlus size={24} />
                </motion.button>
              </div>
            </div>
          )}
          
          {!loadingHabitSets && !activeHabitSet && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg mt-6">
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Active Habit Set</h3>
              <p className="text-gray-500 mb-6 text-center">
                Please create or select a habit set to start tracking your habits.
              </p>
              
              {/* Add buttons to help users */}
              <div className="flex space-x-4">
                <button 
                  onClick={createTestHabitSet}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                >
                  Create Default Habit Set
                </button>
                <button 
                  onClick={loginWithTestUser}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
                >
                  <FaUser className="mr-2" />
                  Login with Test User
                </button>
              </div>
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
import React, { useState, useEffect } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { HabitSet } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaBug, FaUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { createTestUser } from '@/services/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';

export const HabitSetSelector: React.FC = () => {
  const { user } = useAuth();
  const { 
    habitSets, 
    activeHabitSet, 
    setActiveHabitSet, 
    createHabitSet, 
    deleteHabitSet,
    loadingHabitSets
  } = useHabits();
  
  // Add console logging for debugging
  useEffect(() => {
    console.log('HabitSetSelector - Current state:', {
      user: user?.uid,
      habitSets,
      habitSetsCount: habitSets?.length || 0,
      activeHabitSet,
      loadingHabitSets
    });
    
    // Add more detailed logging
    if (!habitSets || habitSets.length === 0) {
      console.warn('No habit sets found. This could be due to:');
      console.warn('1. User not authenticated properly');
      console.warn('2. Firestore connection issues');
      console.warn('3. No habit sets created yet');
      console.warn('4. Permissions issues');
    }
    
    if (user) {
      console.log('User is authenticated:', user.uid);
    } else {
      console.warn('No authenticated user found');
    }
  }, [habitSets, activeHabitSet, loadingHabitSets, user]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  
  // Add state to track if we're in local-only mode
  const [isLocalMode, setIsLocalMode] = useState(false);
  
  // Handle creating a new habit set
  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSetName.trim()) {
      return;
    }
    
    setIsCreating(true);
    try {
      console.log('Creating new habit set:', {
        name: newSetName,
        description: newSetDescription
      });
      
      const result = await createHabitSet({
        name: newSetName,
        description: newSetDescription ? newSetDescription.trim() : "",
        isPremium: false,
        isActive: habitSets.length === 0 // Make active if it's the first one
      });
      
      console.log('Habit set creation result:', result);
      
      if (result.status === 'success') {
        setNewSetName('');
        setNewSetDescription('');
        
        // Check if we're in local mode
        if (result.isLocal) {
          setIsLocalMode(true);
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      // This is a fallback in case the error isn't caught in the hook
      console.error('Error creating habit set:', error);
      toast.error('Failed to create habit set. You may have exceeded your Firebase quota.');
      setIsLocalMode(true);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle setting a habit set as active
  const handleSetActive = async (habitSetId: string) => {
    if (activeHabitSet?.id === habitSetId) {
      return; // Already active
    }
    
    console.log('Setting active habit set:', habitSetId);
    const result = await setActiveHabitSet(habitSetId);
    console.log('Set active result:', result);
    
    if (result.status === 'error' && result.error) {
      toast.error(result.error);
    }
  };
  
  // Handle deleting a habit set
  const handleDeleteSet = async (habitSetId: string) => {
    if (habitSets.length <= 1) {
      toast.error('You need at least one habit set');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this habit set? All habits in this set will be deleted.')) {
      setIsDeleting(habitSetId);
      try {
        console.log('Deleting habit set:', habitSetId);
        const result = await deleteHabitSet(habitSetId);
        console.log('Delete result:', result);
        
        if (result.status === 'error' && result.error) {
          toast.error(result.error);
        }
      } finally {
        setIsDeleting(null);
      }
    }
  };
  
  // Create a test habit set for debugging
  const createTestHabitSet = async () => {
    try {
      console.log('Creating test habit set');
      const result = await createHabitSet({
        name: `Test Set ${new Date().toLocaleTimeString()}`,
        description: "A test habit set created for debugging",
        isPremium: false,
        isActive: habitSets.length === 0
      });
      
      console.log('Test habit set creation result:', result);
      
      if (result.status === 'success') {
        toast.success('Test habit set created successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error creating test habit set:', error);
      toast.error('Failed to create test habit set');
    }
  };
  
  // Login with test user for debugging
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
  
  // Render loading state
  if (loadingHabitSets) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span className="text-gray-600">Loading habit sets...</span>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800">
          Habit Sets
          {isLocalMode && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Local Mode
            </span>
          )}
        </h2>
        
        <div className="flex space-x-2">
          {!user && (
            <button 
              onClick={loginWithTestUser}
              className="flex items-center text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              title="Login with test user (for debugging)"
            >
              <FaUser className="mr-1" />
              Login
            </button>
          )}
          
          <button 
            onClick={createTestHabitSet}
            className="flex items-center text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            title="Create test habit set (for debugging)"
          >
            <FaBug className="mr-1" />
            Test
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <AnimatePresence>
          {habitSets && habitSets.length > 0 ? (
            habitSets.map(set => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`
                  relative group flex items-center px-3 py-2 rounded-lg cursor-pointer
                  ${activeHabitSet?.id === set.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                `}
                onClick={() => handleSetActive(set.id)}
              >
                <span className="mr-2">{set.name}</span>
                
                {activeHabitSet?.id === set.id && (
                  <FaCheck className="text-xs" />
                )}
                
                <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1 text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Edit functionality would go here
                    }}
                  >
                    <FaEdit size={12} />
                  </button>
                  
                  <button
                    className="p-1 text-gray-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSet(set.id);
                    }}
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-gray-500 italic">No habit sets found. Create your first one!</div>
          )}
        </AnimatePresence>
        
        {!isCreating ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
            onClick={() => setIsCreating(true)}
          >
            <FaPlus className="mr-2" />
            New Set
          </motion.button>
        ) : (
          <motion.form
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            className="flex items-center"
            onSubmit={handleCreateSet}
          >
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Set name"
              className="px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600"
              disabled={!newSetName.trim()}
            >
              Add
            </button>
            <button
              type="button"
              className="ml-2 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              onClick={() => {
                setIsCreating(false);
                setNewSetName('');
              }}
            >
              Cancel
            </button>
          </motion.form>
        )}
      </div>
      
      {isLocalMode && (
        <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded-md">
          <p>You're in local mode due to Firebase quota limits. Changes will be saved locally but not synced to the cloud until quota resets.</p>
        </div>
      )}
    </div>
  );
}; 
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HabitSet, 
  getHabitSets, 
  createHabitSet, 
  updateHabitSet, 
  deleteHabitSet, 
  setActiveHabitSet,
  canCreateHabitSet
} from '@/lib/firestoreService';
import { PlusIcon, TrashIcon, PencilIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function HabitSetManager() {
  const { user } = useAuth();
  const [habitSets, setHabitSets] = useState<HabitSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSetForm, setShowNewSetForm] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [editingSet, setEditingSet] = useState<HabitSet | null>(null);
  const [canCreateNewSet, setCanCreateNewSet] = useState(false);

  // Load habit sets
  useEffect(() => {
    if (!user) {
      setHabitSets([]);
      setLoading(false);
      return;
    }

    const loadHabitSets = async () => {
      setLoading(true);
      try {
        const sets = await getHabitSets(user.uid);
        setHabitSets(sets);
        
        // Check if user can create more sets
        const canCreate = await canCreateHabitSet(user.uid);
        setCanCreateNewSet(canCreate);
      } catch (error) {
        console.error('Error loading habit sets:', error);
        toast.error('Failed to load habit sets');
      } finally {
        setLoading(false);
      }
    };

    loadHabitSets();
  }, [user]);

  const handleCreateSet = async () => {
    if (!user) return;
    if (!newSetName.trim()) {
      toast.error('Please enter a name for your habit set');
      return;
    }

    try {
      const canCreate = await canCreateHabitSet(user.uid);
      if (!canCreate) {
        toast.error('You need to upgrade to premium to create more habit sets');
        return;
      }

      const newSet: Omit<HabitSet, 'id'> = {
        name: newSetName.trim(),
        description: newSetDescription.trim(),
        isPremium: false,
        isActive: habitSets.length === 0 // Make active if it's the first set
      };

      const createdSet = await createHabitSet(user.uid, newSet);
      if (createdSet) {
        setHabitSets([...habitSets, createdSet as HabitSet]);
        setNewSetName('');
        setNewSetDescription('');
        setShowNewSetForm(false);
        toast.success('Habit set created successfully');
        
        // If it's the first set or we want it to be active, set it as active
        if (habitSets.length === 0 || newSet.isActive) {
          await setActiveHabitSet(user.uid, createdSet.id);
        }
        
        // Check if user can create more sets
        const canCreate = await canCreateHabitSet(user.uid);
        setCanCreateNewSet(canCreate);
      }
    } catch (error) {
      console.error('Error creating habit set:', error);
      toast.error('Failed to create habit set');
    }
  };

  const handleUpdateSet = async () => {
    if (!user || !editingSet) return;
    if (!newSetName.trim()) {
      toast.error('Please enter a name for your habit set');
      return;
    }

    try {
      const updates: Partial<HabitSet> = {
        name: newSetName.trim(),
        description: newSetDescription.trim()
      };

      const success = await updateHabitSet(user.uid, editingSet.id, updates);
      if (success) {
        setHabitSets(habitSets.map(set => 
          set.id === editingSet.id 
            ? { ...set, ...updates } 
            : set
        ));
        setNewSetName('');
        setNewSetDescription('');
        setEditingSet(null);
        toast.success('Habit set updated successfully');
      }
    } catch (error) {
      console.error('Error updating habit set:', error);
      toast.error('Failed to update habit set');
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this habit set? All habits in this set will be lost.')) {
      return;
    }

    try {
      const success = await deleteHabitSet(user.uid, setId);
      if (success) {
        setHabitSets(habitSets.filter(set => set.id !== setId));
        toast.success('Habit set deleted successfully');
        
        // Check if user can create more sets
        const canCreate = await canCreateHabitSet(user.uid);
        setCanCreateNewSet(canCreate);
      }
    } catch (error) {
      console.error('Error deleting habit set:', error);
      toast.error('Failed to delete habit set');
    }
  };

  const handleSetActive = async (setId: string) => {
    if (!user) return;

    try {
      const success = await setActiveHabitSet(user.uid, setId);
      if (success) {
        setHabitSets(habitSets.map(set => ({
          ...set,
          isActive: set.id === setId
        })));
        toast.success('Switched to habit set successfully');
      }
    } catch (error) {
      console.error('Error setting active habit set:', error);
      toast.error('Failed to switch habit set');
    }
  };

  const startEditSet = (set: HabitSet) => {
    setEditingSet(set);
    setNewSetName(set.name);
    setNewSetDescription(set.description || '');
    setShowNewSetForm(true);
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p>Please log in to manage your habit sets</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Your Habit Sets</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {habitSets.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center">You don't have any habit sets yet. Create your first one!</p>
            ) : (
              habitSets.map(set => (
                <div 
                  key={set.id} 
                  className={`p-3 rounded-lg border ${set.isActive 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white flex items-center">
                        {set.name}
                        {set.isActive && (
                          <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                        {set.isPremium && (
                          <SparklesIcon className="h-4 w-4 text-yellow-500 ml-1" />
                        )}
                      </h3>
                      {set.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{set.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {!set.isActive && (
                        <button
                          onClick={() => handleSetActive(set.id)}
                          className="text-xs bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded"
                        >
                          Switch to
                        </button>
                      )}
                      <button
                        onClick={() => startEditSet(set)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSet(set.id)}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!showNewSetForm && (
            <button
              onClick={() => {
                if (!canCreateNewSet && habitSets.length > 0) {
                  toast.error('You need to upgrade to premium to create more habit sets');
                  return;
                }
                setShowNewSetForm(true);
                setEditingSet(null);
                setNewSetName('');
                setNewSetDescription('');
              }}
              className={`flex items-center justify-center w-full p-2 rounded-lg border border-dashed 
                ${canCreateNewSet || habitSets.length === 0
                  ? 'border-indigo-300 text-indigo-500 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20'
                  : 'border-gray-300 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:text-gray-500'
                }`}
              disabled={!canCreateNewSet && habitSets.length > 0}
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              {habitSets.length === 0 ? 'Create Your First Habit Set' : 'Create New Habit Set'}
              {!canCreateNewSet && habitSets.length > 0 && ' (Premium)'}
            </button>
          )}

          <AnimatePresence>
            {showNewSetForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 overflow-hidden"
              >
                <div className="p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                  <h3 className="font-medium mb-3 text-gray-800 dark:text-white">
                    {editingSet ? 'Edit Habit Set' : 'Create New Habit Set'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="setName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="setName"
                        value={newSetName}
                        onChange={(e) => setNewSetName(e.target.value)}
                        placeholder="e.g., Morning Routine"
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="setDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description (optional)
                      </label>
                      <input
                        type="text"
                        id="setDescription"
                        value={newSetDescription}
                        onChange={(e) => setNewSetDescription(e.target.value)}
                        placeholder="e.g., Habits to start my day right"
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={editingSet ? handleUpdateSet : handleCreateSet}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        {editingSet ? 'Update' : 'Create'}
                      </button>
                      <button
                        onClick={() => {
                          setShowNewSetForm(false);
                          setEditingSet(null);
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      
      {habitSets.length > 0 && !user.isPremium && (
        <div className="mt-6 p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-start">
            <SparklesIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white">Upgrade to Premium</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create unlimited habit sets and unlock more premium features by upgrading to Premium.
              </p>
              <Link href="/premium">
                <button className="mt-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-md hover:from-yellow-500 hover:to-yellow-700 transition-colors text-sm font-medium">
                  Upgrade Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
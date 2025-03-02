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
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Handle creating a new habit set
  const handleCreateSet = async () => {
    if (!user) return;
    
    if (!newSetName.trim()) {
      toast.error('Please enter a name for your habit set');
      return;
    }
    
    try {
      // Check if user can create more sets
      const canCreate = await canCreateHabitSet(user.uid);
      if (!canCreate) {
        toast.error('You need to upgrade to premium to create more than 2 habit sets');
        return;
      }
      
      const newSet: Omit<HabitSet, 'id'> = {
        name: newSetName.trim(),
        description: newSetDescription.trim(),
        isPremium: habitSets.length > 1, // First two sets are free, others are premium
        isActive: habitSets.length === 0, // First set is active by default
      };
      
      const setId = await createHabitSet(user.uid, newSet);
      
      // Refresh habit sets
      const updatedSets = await getHabitSets(user.uid);
      setHabitSets(updatedSets);
      
      // Reset form
      setNewSetName('');
      setNewSetDescription('');
      setShowNewSetForm(false);
      
      toast.success('Habit set created successfully!');
    } catch (error) {
      console.error('Error creating habit set:', error);
      toast.error('Failed to create habit set');
    }
  };

  // Handle updating a habit set
  const handleUpdateSet = async () => {
    if (!user || !editingSet) return;
    
    if (!editingSet.name.trim()) {
      toast.error('Please enter a name for your habit set');
      return;
    }
    
    try {
      await updateHabitSet(user.uid, editingSet.id, {
        name: editingSet.name.trim(),
        description: editingSet.description?.trim() || '',
      });
      
      // Refresh habit sets
      const updatedSets = await getHabitSets(user.uid);
      setHabitSets(updatedSets);
      
      // Reset form
      setEditingSet(null);
      
      toast.success('Habit set updated successfully!');
    } catch (error) {
      console.error('Error updating habit set:', error);
      toast.error('Failed to update habit set');
    }
  };

  // Handle deleting a habit set
  const handleDeleteSet = async (setId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this habit set? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteHabitSet(user.uid, setId);
      
      // Refresh habit sets
      const updatedSets = await getHabitSets(user.uid);
      setHabitSets(updatedSets);
      
      toast.success('Habit set deleted successfully!');
    } catch (error) {
      console.error('Error deleting habit set:', error);
      toast.error('Failed to delete habit set');
    }
  };

  // Handle setting a habit set as active
  const handleSetActive = async (setId: string) => {
    if (!user) return;
    
    try {
      await setActiveHabitSet(user.uid, setId);
      
      // Refresh habit sets
      const updatedSets = await getHabitSets(user.uid);
      setHabitSets(updatedSets);
      
      toast.success('Active habit set updated!');
    } catch (error) {
      console.error('Error setting active habit set:', error);
      toast.error('Failed to update active habit set');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Habit Sets Sidebar */}
      <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full w-72">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white">
            Habit Sets
          </h2>
        </div>
        
        <div className="p-3">
          {/* Create New Set Button - Always visible and prominent */}
          <button
            onClick={() => setShowNewSetForm(true)}
            className="flex items-center justify-center space-x-2 w-full p-3 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            <span className="font-medium">New Habit Set</span>
          </button>
          
          {!canCreateNewSet && habitSets.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <SparklesIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Upgrade to premium to create more than 2 habit sets!
                  </p>
                  <Link
                    href="/premium"
                    className="text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:underline mt-1 inline-block"
                  >
                    Upgrade now
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Habit Sets List */}
          <div className="space-y-2">
            <AnimatePresence>
              {habitSets.map((set) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`relative group rounded-lg overflow-hidden ${
                    set.isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500' 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="p-3 flex items-center justify-between">
                    {/* Set Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {set.name}
                        </h3>
                        {set.isPremium && (
                          <SparklesIcon className="w-4 h-4 text-yellow-500 ml-1 flex-shrink-0" />
                        )}
                      </div>
                      {set.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {set.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Set Actions */}
                    <div className="flex items-center space-x-1">
                      {!set.isActive && (
                        <button
                          onClick={() => handleSetActive(set.id)}
                          className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                          title="Set as active"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingSet(set)}
                        className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                        title="Edit set"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSet(set.id)}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title="Delete set"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Active Indicator */}
                  {set.isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {habitSets.length === 0 && !showNewSetForm && (
              <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No habit sets yet.</p>
                <button
                  onClick={() => setShowNewSetForm(true)}
                  className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline mt-1"
                >
                  Create your first set
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 relative">
        {/* New Set Form */}
        <AnimatePresence>
          {showNewSetForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Habit Set</h2>
                <button
                  onClick={() => setShowNewSetForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="setDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="setDescription"
                    value={newSetDescription}
                    onChange={(e) => setNewSetDescription(e.target.value)}
                    placeholder="e.g., Habits to start my day right"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowNewSetForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSet}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
                  >
                    Create Set
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Edit Set Form */}
        <AnimatePresence>
          {editingSet && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Habit Set</h2>
                <button
                  onClick={() => setEditingSet(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="editSetName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="editSetName"
                    value={editingSet.name}
                    onChange={(e) => setEditingSet({ ...editingSet, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="editSetDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="editSetDescription"
                    value={editingSet.description || ''}
                    onChange={(e) => setEditingSet({ ...editingSet, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditingSet(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSet}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Content Area */}
        {!showNewSetForm && !editingSet && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {habitSets.length > 0 ? 'Your Habit Sets' : 'Get Started with Habit Sets'}
            </h2>
            
            {habitSets.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  You have {habitSets.length} habit set{habitSets.length !== 1 ? 's' : ''}.
                  {habitSets.find(set => set.isActive) ? (
                    <span> Your active set is <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {habitSets.find(set => set.isActive)?.name}
                    </span>.</span>
                  ) : (
                    <span> You don't have an active set selected.</span>
                  )}
                </p>
                
                {/* Add prominent button for creating new habit set */}
                {canCreateNewSet && (
                  <div className="flex justify-center my-6">
                    <button
                      onClick={() => setShowNewSetForm(true)}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Add New Habit Set</span>
                    </button>
                  </div>
                )}
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <h3 className="font-medium text-indigo-800 dark:text-indigo-300 mb-2">Tips:</h3>
                  <ul className="list-disc list-inside text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                    <li>Create different sets for different areas of your life (work, health, learning)</li>
                    <li>Only one set can be active at a time</li>
                    <li>You can switch between sets anytime</li>
                    {!user?.isPremium && (
                      <li>
                        <Link href="/premium" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                          Upgrade to premium
                        </Link> to create unlimited habit sets
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <PlusIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Create Your First Habit Set</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                  Habit sets help you organize your habits into meaningful groups. Start by creating your first set!
                </p>
                <button
                  onClick={() => setShowNewSetForm(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
                >
                  Create Habit Set
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floating Action Button for Mobile */}
      {canCreateNewSet && !showNewSetForm && !editingSet && (
        <button
          onClick={() => setShowNewSetForm(true)}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg md:hidden z-10"
          aria-label="Add new habit set"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
} 
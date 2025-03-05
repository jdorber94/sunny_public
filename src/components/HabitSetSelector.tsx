import React, { useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { HabitSet } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export const HabitSetSelector: React.FC = () => {
  const { 
    habitSets, 
    activeHabitSet, 
    setActiveHabitSet, 
    createHabitSet, 
    deleteHabitSet,
    loadingHabitSets
  } = useHabits();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  
  // Handle creating a new habit set
  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSetName.trim()) {
      return;
    }
    
    setIsCreating(true);
    try {
      const result = await createHabitSet({
        name: newSetName,
        description: newSetDescription || undefined,
        isPremium: false,
        isActive: habitSets.length === 0 // Make active if it's the first one
      });
      
      if (result.status === 'success') {
        setNewSetName('');
        setNewSetDescription('');
      } else if (result.error) {
        toast.error(result.error);
      }
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle setting a habit set as active
  const handleSetActive = async (habitSetId: string) => {
    if (activeHabitSet?.id === habitSetId) {
      return; // Already active
    }
    
    const result = await setActiveHabitSet(habitSetId);
    
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
        const result = await deleteHabitSet(habitSetId);
        
        if (result.status === 'error' && result.error) {
          toast.error(result.error);
        }
      } finally {
        setIsDeleting(null);
      }
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
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Habit Sets</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <AnimatePresence>
          {habitSets.map(set => (
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
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSet(set.id);
                }}
                disabled={isDeleting === set.id}
                className={`
                  ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100
                  ${activeHabitSet?.id === set.id 
                    ? 'text-white hover:bg-blue-600' 
                    : 'text-red-500 hover:bg-red-100'}
                  transition-opacity duration-200
                `}
                aria-label="Delete habit set"
              >
                {isDeleting === set.id ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaTrash className="text-xs" />
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: 1, 
            height: 'auto',
            transition: { duration: 0.3 }
          }}
          className="flex items-center space-x-2 w-full mt-2"
          onSubmit={handleCreateSet}
        >
          <input
            type="text"
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
            placeholder="New set name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCreating}
          />
          
          <input
            type="text"
            value={newSetDescription}
            onChange={(e) => setNewSetDescription(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCreating}
          />
          
          <button
            type="submit"
            disabled={isCreating || !newSetName.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaPlus className="mr-1" />
            )}
            Add
          </button>
        </motion.form>
      </div>
    </div>
  );
}; 
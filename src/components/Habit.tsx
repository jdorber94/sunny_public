import React, { useState } from 'react';
import { Habit as HabitType } from '@/types';
import { motion } from 'framer-motion';
import { FaCheck, FaTrash, FaEdit } from 'react-icons/fa';
import { useHabits } from '@/hooks/useHabits';
import { toast } from 'react-hot-toast';

interface HabitProps {
  habit: HabitType;
  onEdit?: (habit: HabitType) => void;
}

export const Habit: React.FC<HabitProps> = ({ habit, onEdit }) => {
  const { toggleHabitCompletion, deleteHabit, isHabitCompletedToday } = useHabits();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isCompleted = isHabitCompletedToday(habit);
  
  // Handle toggling habit completion
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      const result = await toggleHabitCompletion(habit.id);
      
      if (result.status === 'error') {
        toast.error(result.error || 'Failed to toggle habit completion');
      }
    } finally {
      setIsToggling(false);
    }
  };
  
  // Handle deleting a habit
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDeleting) return;
    
    if (window.confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      setIsDeleting(true);
      try {
        const result = await deleteHabit(habit.id);
        
        if (result.status === 'error') {
          toast.error(result.error || 'Failed to delete habit');
        }
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  // Handle editing a habit
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(habit);
    }
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`
        relative flex items-center justify-between p-4 mb-3 rounded-lg shadow-md
        ${isCompleted ? 'bg-green-50 border-l-4 border-green-500' : 'bg-white'}
        hover:shadow-lg transition-all duration-200
      `}
      onClick={handleToggle}
    >
      <div className="flex items-center">
        <motion.div
          whileTap={{ scale: 0.9 }}
          className={`
            flex items-center justify-center w-6 h-6 mr-4 rounded-full border
            ${isCompleted 
              ? 'bg-green-500 border-green-500' 
              : 'bg-white border-gray-300'}
            cursor-pointer transition-colors duration-200
          `}
          onClick={handleToggle}
        >
          {isCompleted && <FaCheck className="text-white text-xs" />}
        </motion.div>
        
        <div>
          <h3 className={`
            font-medium text-gray-800
            ${isCompleted ? 'line-through text-gray-500' : ''}
          `}>
            {habit.name}
          </h3>
          
          {habit.streak && habit.streak > 0 && (
            <span className="text-xs text-orange-500 font-medium">
              🔥 {habit.streak} day streak
            </span>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-gray-500 hover:text-blue-500 focus:outline-none"
          onClick={handleEdit}
          disabled={isToggling || isDeleting}
          aria-label="Edit habit"
        >
          <FaEdit />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-gray-500 hover:text-red-500 focus:outline-none"
          onClick={handleDelete}
          disabled={isToggling || isDeleting}
          aria-label="Delete habit"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaTrash />
          )}
        </motion.button>
      </div>
      
      {isToggling && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </motion.div>
  );
}; 
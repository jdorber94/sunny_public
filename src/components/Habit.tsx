import React, { useState } from 'react';
import { Habit as HabitType } from '@/lib/firestoreService';
import { motion } from 'framer-motion';
import { FaCheck, FaTrash, FaEdit } from 'react-icons/fa';

interface HabitProps {
  habit: HabitType;
  onEdit: () => void;
  onDelete: () => void;
  onLog: () => void;
}

export const Habit: React.FC<HabitProps> = ({ habit, onEdit, onDelete, onLog }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if habit is completed today
  const isCompletedToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return habit.logs.includes(today);
  };
  
  const isCompleted = isCompletedToday();
  
  // Handle toggling habit completion
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      await onLog();
    } finally {
      setIsToggling(false);
    }
  };
  
  // Handle deleting a habit
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle editing a habit
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
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
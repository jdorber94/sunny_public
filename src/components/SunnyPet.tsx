'use client';

import { useState } from 'react';
import { useTheme } from './ThemeProvider';

interface SunnyPetProps {
  level: number;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function SunnyPet({ level, onClick, size = 'medium' }: SunnyPetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { isDarkMode } = useTheme();

  // Determine which evolution of Sunny to show based on level
  const getEvolutionStage = () => {
    if (level >= 20) return 5; // Final form
    if (level >= 15) return 4;
    if (level >= 10) return 3;
    if (level >= 5) return 2;
    return 1; // Starting form
  };

  const evolutionStage = getEvolutionStage();
  
  // Get emoji and color based on evolution stage
  const getSunnyAppearance = () => {
    // Simple emoji-based approach
    switch (evolutionStage) {
      case 1: return { emoji: '🌞', bgColor: 'bg-slate-200' };
      case 2: return { emoji: '☀️', bgColor: 'bg-slate-300' };
      case 3: return { emoji: '⭐', bgColor: 'bg-slate-400' };
      case 4: return { emoji: '🌟', bgColor: 'bg-indigo-300' };
      case 5: return { emoji: '✨', bgColor: 'bg-indigo-400' };
      default: return { emoji: '🌞', bgColor: 'bg-slate-200' };
    }
  };

  const { emoji, bgColor } = getSunnyAppearance();

  // Get personality traits based on evolution stage
  const getPersonality = () => {
    switch (evolutionStage) {
      case 1: return "Sunny is just a little ray of sunshine. Keep up your habits to help Sunny grow!";
      case 2: return "Sunny is getting brighter! Your consistency is helping Sunny develop.";
      case 3: return "Sunny is now radiating positive energy! Your habit streak is impressive!";
      case 4: return "Sunny is beaming with pride at your dedication to your habits!";
      case 5: return "Sunny has reached cosmic brilliance! You're a habit master!";
      default: return "Meet Sunny, your habit companion!";
    }
  };

  // Get size class based on size prop
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'w-12 h-12 text-2xl';
      case 'large': return 'w-24 h-24 text-5xl';
      case 'medium':
      default: return 'w-16 h-16 text-3xl';
    }
  };

  const sizeClass = getSizeClass();
  const levelBadgeClass = size === 'large' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs';

  // Handle animation when clicked
  const handleClick = () => {
    if (onClick) onClick();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <div className="relative">
      <div 
        className="relative cursor-pointer"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Sun body - simple emoji-based approach */}
        <div 
          className={`relative rounded-full ${bgColor} dark:bg-opacity-80 shadow-lg flex items-center justify-center z-10
            ${sizeClass} ${isAnimating ? 'animate-bounce-small' : ''}`}
        >
          <span role="img" aria-label="Sunny">
            {emoji}
          </span>
        </div>
        
        {/* Level indicator */}
        <div className={`absolute -bottom-1 -right-1 bg-indigo-600 text-white font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 ${levelBadgeClass}`}>
          {level}
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg text-xs text-slate-700 dark:text-slate-200 z-20">
          <div className="font-bold text-center mb-1">
            {evolutionStage === 5 ? "Cosmic Sunny" : 
             evolutionStage === 4 ? "Radiant Sunny" : 
             evolutionStage === 3 ? "Bright Sunny" : 
             evolutionStage === 2 ? "Cheerful Sunny" : "Baby Sunny"}
          </div>
          <p>{getPersonality()}</p>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-slate-800"></div>
        </div>
      )}
    </div>
  );
} 
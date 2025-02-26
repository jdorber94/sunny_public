'use client';

import { useState } from 'react';
import { useTheme } from './ThemeProvider';

interface SunnyPetProps {
  level: number;
  onClick?: () => void;
}

export default function SunnyPet({ level, onClick }: SunnyPetProps) {
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
      case 1: return { emoji: '🌞', bgColor: 'bg-yellow-300' };
      case 2: return { emoji: '☀️', bgColor: 'bg-amber-300' };
      case 3: return { emoji: '⭐', bgColor: 'bg-orange-300' };
      case 4: return { emoji: '🌟', bgColor: 'bg-red-300' };
      case 5: return { emoji: '✨', bgColor: 'bg-purple-300' };
      default: return { emoji: '🌞', bgColor: 'bg-yellow-300' };
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
          className={`relative w-16 h-16 rounded-full ${bgColor} dark:bg-opacity-80 shadow-lg flex items-center justify-center z-10
            ${isAnimating ? 'animate-bounce-small' : ''}`}
        >
          <span className="text-3xl" role="img" aria-label="Sunny">
            {emoji}
          </span>
        </div>
        
        {/* Level indicator */}
        <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-slate-800">
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
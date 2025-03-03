'use client';

import { useState } from 'react';
import { useTheme } from './ThemeProvider';

interface QuestPetProps {
  level: number;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function QuestPet({ level, onClick, size = 'medium' }: QuestPetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { isDarkMode } = useTheme();

  // Determine which evolution of Quest to show based on level
  const getEvolutionStage = () => {
    if (level >= 20) return 5; // Final form
    if (level >= 15) return 4;
    if (level >= 10) return 3;
    if (level >= 5) return 2;
    return 1; // Starting form
  };

  const evolutionStage = getEvolutionStage();
  
  // Get emoji and color based on evolution stage
  const getQuestAppearance = () => {
    // Simple emoji-based approach
    switch (evolutionStage) {
      case 1: return { emoji: '🎯', bgColor: 'bg-slate-200' };
      case 2: return { emoji: '⚔️', bgColor: 'bg-slate-300' };
      case 3: return { emoji: '🛡️', bgColor: 'bg-slate-400' };
      case 4: return { emoji: '👑', bgColor: 'bg-slate-500' };
      case 5: return { emoji: '⚡', bgColor: 'bg-black' };
      default: return { emoji: '🎯', bgColor: 'bg-slate-200' };
    }
  };

  const { emoji, bgColor } = getQuestAppearance();

  // Get personality traits based on evolution stage
  const getPersonality = () => {
    switch (evolutionStage) {
      case 1: return "Quest is just beginning. Keep up your habits to level up!";
      case 2: return "Quest is getting stronger! Your consistency is building power.";
      case 3: return "Quest is now advancing! Your habit streak is impressive!";
      case 4: return "Quest has reached elite status! Your dedication is remarkable!";
      case 5: return "Quest has achieved mastery! You're a true champion!";
      default: return "Meet Quest, your habit companion!";
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
        {/* Quest body */}
        <div 
          className={`relative rounded-full ${bgColor} dark:bg-opacity-80 shadow-lg flex items-center justify-center z-10
            ${sizeClass} ${isAnimating ? 'animate-bounce-small' : ''}`}
        >
          <span role="img" aria-label="Quest">
            {emoji}
          </span>
        </div>
        
        {/* Level indicator */}
        <div className={`absolute -bottom-1 -right-1 bg-black text-white font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 ${levelBadgeClass}`}>
          {level}
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg text-xs text-slate-700 dark:text-slate-200 z-20">
          <div className="font-bold text-center mb-1">
            {evolutionStage === 5 ? "Master Quest" : 
             evolutionStage === 4 ? "Elite Quest" : 
             evolutionStage === 3 ? "Advanced Quest" : 
             evolutionStage === 2 ? "Skilled Quest" : "Novice Quest"}
          </div>
          <p>{getPersonality()}</p>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-slate-800"></div>
        </div>
      )}
    </div>
  );
} 
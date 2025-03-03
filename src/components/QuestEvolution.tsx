'use client';

import { useState } from 'react';

interface QuestEvolutionProps {
  level: number;
  onClick?: () => void;
}

export default function QuestEvolution({ level, onClick }: QuestEvolutionProps) {
  const [isAnimating, setIsAnimating] = useState(false);

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

  // Handle animation when clicked
  const handleClick = () => {
    if (onClick) onClick();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <div 
      className={`w-24 h-24 rounded-full ${bgColor} dark:bg-opacity-80 shadow-lg flex items-center justify-center text-5xl cursor-pointer
        ${isAnimating ? 'animate-bounce-small' : ''}`}
      onClick={handleClick}
    >
      <span role="img" aria-label="Quest">
        {emoji}
      </span>
    </div>
  );
} 
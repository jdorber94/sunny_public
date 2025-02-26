'use client';

import { useState, useEffect } from 'react';

interface SunnyPetProps {
  level: number;
  onClick?: () => void;
}

export default function SunnyPet({ level, onClick }: SunnyPetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine which evolution of Sunny to show based on level
  const getEvolutionStage = () => {
    if (level >= 20) return 5; // Final form
    if (level >= 15) return 4;
    if (level >= 10) return 3;
    if (level >= 5) return 2;
    return 1; // Starting form
  };

  const evolutionStage = getEvolutionStage();
  
  // Get color scheme based on evolution stage
  const getColors = () => {
    switch (evolutionStage) {
      case 1: return { primary: 'from-yellow-300 to-orange-400', rays: 'text-yellow-400', face: 'text-orange-700' };
      case 2: return { primary: 'from-yellow-300 to-amber-500', rays: 'text-amber-400', face: 'text-amber-800' };
      case 3: return { primary: 'from-amber-300 to-orange-500', rays: 'text-orange-400', face: 'text-orange-800' };
      case 4: return { primary: 'from-orange-300 to-red-500', rays: 'text-red-400', face: 'text-red-800' };
      case 5: return { primary: 'from-yellow-300 to-purple-500', rays: 'text-purple-400', face: 'text-purple-800' };
      default: return { primary: 'from-yellow-300 to-orange-400', rays: 'text-yellow-400', face: 'text-orange-700' };
    }
  };

  const colors = getColors();

  // Get personality traits based on evolution stage
  const getPersonality = () => {
    switch (evolutionStage) {
      case 1: return "Sunny is just a little ray of sunshine. Keep up your habits to help Sunny grow!";
      case 2: return "Sunny is getting brighter! Your consistency is helping Sunny develop new rays.";
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

  // Get the number of rays based on evolution
  const getRayCount = () => {
    return 8 + (evolutionStage - 1) * 2; // Starts with 8 rays, adds 2 per evolution
  };

  // Generate rays around the sun
  const generateRays = () => {
    const rayCount = getRayCount();
    const rays = [];
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (i * 360) / rayCount;
      const length = evolutionStage > 3 ? '1.8rem' : '1.5rem';
      const width = evolutionStage > 2 ? '0.35rem' : '0.25rem';
      
      rays.push(
        <div 
          key={i}
          className={`absolute bg-current ${colors.rays} rounded-full`}
          style={{
            height: length,
            width: width,
            transformOrigin: 'center calc(100% + 1.5rem)',
            transform: `rotate(${angle}deg) translateX(-50%)`,
            left: '50%',
            bottom: '50%',
          }}
        />
      );
    }
    
    return rays;
  };

  // Get the face features based on evolution stage
  const getFaceFeatures = () => {
    switch (evolutionStage) {
      case 1:
        return (
          <>
            <div className="flex justify-center space-x-3 mb-1">
              <div className={`w-1 h-1 rounded-full ${colors.face}`}></div>
              <div className={`w-1 h-1 rounded-full ${colors.face}`}></div>
            </div>
            <div className="w-3 h-1 mx-auto rounded-full bg-current"></div>
          </>
        );
      case 2:
        return (
          <>
            <div className="flex justify-center space-x-4 mb-1">
              <div className={`w-1.5 h-1.5 rounded-full ${colors.face}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full ${colors.face}`}></div>
            </div>
            <div className="w-4 h-1.5 mx-auto rounded-full bg-current"></div>
          </>
        );
      case 3:
        return (
          <>
            <div className="flex justify-center space-x-4 mb-1">
              <div className={`w-1.5 h-1.5 rounded-full ${colors.face}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full ${colors.face}`}></div>
            </div>
            <div className="w-5 h-2 mx-auto rounded-full bg-current flex items-center justify-center">
              <div className="w-3 h-0.5 bg-yellow-300 rounded-full"></div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="flex justify-center space-x-5 mb-2">
              <div className="relative">
                <div className={`w-2 h-2 rounded-full ${colors.face}`}></div>
                <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-0.5 right-0.5"></div>
              </div>
              <div className="relative">
                <div className={`w-2 h-2 rounded-full ${colors.face}`}></div>
                <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-0.5 right-0.5"></div>
              </div>
            </div>
            <div className="w-6 h-2 mx-auto rounded-full bg-current flex items-center justify-center">
              <div className="w-4 h-0.5 bg-yellow-300 rounded-full"></div>
            </div>
          </>
        );
      case 5:
        return (
          <>
            <div className="flex justify-center space-x-5 mb-2">
              <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.face}`}></div>
                <div className="absolute w-1 h-1 bg-white rounded-full top-0.5 right-0.5"></div>
              </div>
              <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.face}`}></div>
                <div className="absolute w-1 h-1 bg-white rounded-full top-0.5 right-0.5"></div>
              </div>
            </div>
            <div className="w-7 h-2.5 mx-auto rounded-full bg-current flex items-center justify-center">
              <div className="w-5 h-1 bg-yellow-300 rounded-full"></div>
            </div>
            {/* Gear teeth for final form */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <div 
                key={angle}
                className="absolute w-1.5 h-3 bg-purple-400 rounded-sm"
                style={{
                  transformOrigin: 'center',
                  transform: `rotate(${angle}deg) translateY(-2.5rem)`,
                }}
              />
            ))}
          </>
        );
      default:
        return (
          <>
            <div className="flex justify-center space-x-3 mb-1">
              <div className={`w-1 h-1 rounded-full ${colors.face}`}></div>
              <div className={`w-1 h-1 rounded-full ${colors.face}`}></div>
            </div>
            <div className="w-3 h-1 mx-auto rounded-full bg-current"></div>
          </>
        );
    }
  };

  return (
    <div className="relative">
      <div 
        className="relative cursor-pointer"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Rays */}
        <div className={`relative ${isAnimating ? 'animate-spin-slow' : ''}`}>
          {generateRays()}
        </div>
        
        {/* Sun body */}
        <div 
          className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${colors.primary} shadow-lg flex items-center justify-center z-10
            ${isAnimating ? 'animate-pulse' : ''}`}
        >
          {/* Face */}
          <div className={`${colors.face} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4`}>
            {getFaceFeatures()}
          </div>
        </div>
        
        {/* Level indicator */}
        <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
          {level}
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white rounded-lg shadow-lg text-xs text-slate-700 z-20">
          <div className="font-bold text-center mb-1">
            {evolutionStage === 5 ? "Cosmic Sunny" : 
             evolutionStage === 4 ? "Radiant Sunny" : 
             evolutionStage === 3 ? "Bright Sunny" : 
             evolutionStage === 2 ? "Cheerful Sunny" : "Baby Sunny"}
          </div>
          <p>{getPersonality()}</p>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white"></div>
        </div>
      )}
    </div>
  );
} 
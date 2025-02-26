'use client';

import { useState, useEffect } from 'react';

interface SunnyEvolutionProps {
  show: boolean;
  onClose: () => void;
  evolutionStage: number;
}

export default function SunnyEvolution({ show, onClose, evolutionStage }: SunnyEvolutionProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string; speed: number; angle: number }>>([]);
  
  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const newParticles = [];
      const colors = ['#FFDD00', '#FFA500', '#FF4500', '#9F2B68', '#8A2BE2'];
      
      for (let i = 0; i < 100; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: Math.random() * 3 + 1,
          angle: Math.random() * 360
        });
      }
      
      setParticles(newParticles);
      
      // Auto close after animation
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  if (!show) return null;
  
  const getEvolutionTitle = () => {
    switch (evolutionStage) {
      case 2: return "Cheerful Sunny";
      case 3: return "Bright Sunny";
      case 4: return "Radiant Sunny";
      case 5: return "Cosmic Sunny";
      default: return "Sunny";
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="relative w-full max-w-md mx-auto">
        {/* Confetti */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              transform: `rotate(${particle.angle}deg)`,
              animation: `fall ${particle.speed}s linear infinite`
            }}
          />
        ))}
        
        <div className="bg-gradient-to-br from-yellow-100 to-amber-200 rounded-2xl p-8 text-center shadow-xl transform animate-bounce-slow">
          <div className="text-3xl font-bold text-amber-800 mb-4">
            Sunny Has Evolved!
          </div>
          
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <div className="text-6xl">✨</div>
          </div>
          
          <div className="text-2xl font-semibold text-amber-700 mb-2">
            Welcome {getEvolutionTitle()}!
          </div>
          
          <p className="text-amber-600 mb-6">
            Your dedication to your habits has helped Sunny evolve into a brighter form!
          </p>
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Continue Your Journey
          </button>
        </div>
      </div>
    </div>
  );
} 
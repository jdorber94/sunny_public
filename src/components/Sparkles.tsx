'use client';

import React from 'react';

interface SparkleProps {
  color?: string;
}

export function Sparkles({ color = 'blue-400' }: SparkleProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`absolute animate-[sparkle_1s_ease-in-out] text-${color}`}
          style={{
            '--tw-translate-x': `${Math.random() * 100 - 50}%`,
            '--tw-translate-y': `${Math.random() * 100 - 50}%`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          } as React.CSSProperties}
        >
          ✨
        </div>
      ))}
    </div>
  );
} 
import React from 'react';

export default function HabitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 animate-gradient bg-[length:400%_400%] bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50" />
      </div>
      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
} 
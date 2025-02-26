'use client';

export function LevelUpCelebration({ level }: { level: number }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Level Up!
        </h2>
        <p className="text-[#6B7280] mb-6">
          You've reached level {level}
        </p>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold mb-4">
          {level}
        </div>
        <button className="button-primary w-full">
          Continue
        </button>
      </div>
    </div>
  );
} 
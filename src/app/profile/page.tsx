'use client';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-slate-700 mb-8">Profile</h1>
        <div className="glass-card">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-2xl font-medium">
              JD
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-700">John Doe</h2>
              <p className="text-slate-500">Level {5} Quester</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                Stats
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4">
                  <div className="text-2xl font-bold text-slate-700">1,234</div>
                  <div className="text-sm text-slate-500">Total XP</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-2xl font-bold text-slate-700">42</div>
                  <div className="text-sm text-slate-500">Days Active</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-2xl font-bold text-slate-700">3</div>
                  <div className="text-sm text-slate-500">Current Streak</div>
                </div>
              </div>
            </div>

            {/* Add more profile sections as needed */}
          </div>
        </div>
      </div>
    </div>
  );
} 
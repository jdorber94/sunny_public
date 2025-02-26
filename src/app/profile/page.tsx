'use client';

import { useState, useEffect } from 'react';
import SunnyPet from '@/components/SunnyPet';
import SunnyEvolution from '@/components/SunnyEvolution';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  level: number;
  totalXP: number;
  daysActive: number;
  currentStreak: number;
  joinDate: string;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    weekStartsOn: 'monday' | 'sunday';
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'JD',
    level: 5,
    totalXP: 1234,
    daysActive: 42,
    currentStreak: 3,
    joinDate: '2023-01-15',
    preferences: {
      notifications: true,
      darkMode: false,
      weekStartsOn: 'monday'
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const [sunnyInteractions, setSunnyInteractions] = useState(0);
  const [showEvolution, setShowEvolution] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(profile.level);
  
  // Check if Sunny has evolved to a new stage
  useEffect(() => {
    const currentEvolutionStage = Math.ceil(profile.level / 5);
    const previousEvolutionStage = Math.ceil(previousLevel / 5);
    
    if (currentEvolutionStage > previousEvolutionStage) {
      setShowEvolution(true);
    }
    
    setPreviousLevel(profile.level);
  }, [profile.level, previousLevel]);

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    // Here you would typically save to backend/localStorage
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setEditedProfile({
        ...editedProfile,
        [section]: {
          ...editedProfile[section as keyof UserProfile] as Record<string, any>,
          [field]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setEditedProfile({
        ...editedProfile,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setEditedProfile({
        ...editedProfile,
        [section]: {
          ...editedProfile[section as keyof UserProfile] as Record<string, any>,
          [field]: value
        }
      });
    } else {
      setEditedProfile({
        ...editedProfile,
        [name]: value
      });
    }
  };

  const handleSunnyClick = () => {
    setSunnyInteractions(prev => prev + 1);
    // Give a small XP boost when interacting with Sunny
    if (sunnyInteractions % 5 === 4) { // Every 5 clicks
      setProfile(prev => ({
        ...prev,
        totalXP: prev.totalXP + 10
      }));
    }
  };

  const handleLevelUp = () => {
    setProfile(prev => ({
      ...prev,
      level: prev.level + 1,
      totalXP: prev.totalXP + 100
    }));
  };

  const getCurrentEvolutionStage = () => {
    return Math.ceil(profile.level / 5);
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Evolution Celebration Modal */}
      <SunnyEvolution 
        show={showEvolution} 
        onClose={() => setShowEvolution(false)} 
        evolutionStage={getCurrentEvolutionStage()}
      />
      
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Your Profile</h1>
          <p className="text-slate-600">Manage your account and preferences</p>
        </header>

        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-medium">
                {profile.avatar}
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editedProfile.name}
                    onChange={handleChange}
                    className="text-xl font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 mb-1 w-full sm:w-auto"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-slate-700">{profile.name}</h2>
                )}
                <p className="text-slate-500">Level {profile.level} Quester</p>
              </div>
            </div>
            
            <div>
              {isEditing ? (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedProfile(profile);
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {/* Sunny Pet Section */}
            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-4">Your Companion</h3>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <SunnyPet level={profile.level} onClick={handleSunnyClick} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-amber-700 mb-2">
                      {profile.level >= 20 ? "Cosmic Sunny" : 
                       profile.level >= 15 ? "Radiant Sunny" : 
                       profile.level >= 10 ? "Bright Sunny" : 
                       profile.level >= 5 ? "Cheerful Sunny" : "Baby Sunny"}
                    </h4>
                    <p className="text-amber-600 mb-3">
                      {profile.level >= 20 ? "Sunny has reached cosmic brilliance! You're a habit master!" : 
                       profile.level >= 15 ? "Sunny is beaming with pride at your dedication to your habits!" : 
                       profile.level >= 10 ? "Sunny is now radiating positive energy! Your habit streak is impressive!" : 
                       profile.level >= 5 ? "Sunny is getting brighter! Your consistency is helping Sunny develop new rays." : 
                       "Sunny is just a little ray of sunshine. Keep up your habits to help Sunny grow!"}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-yellow-100 rounded-full flex-grow">
                        <div 
                          className="h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (profile.level % 5) * 20)}%`,
                            transition: 'width 0.5s ease-in-out'
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-amber-700">
                        {profile.level % 5 === 0 ? 'MAX' : `${(profile.level % 5) * 20}%`}
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 mt-2">
                      {profile.level % 5 === 0 
                        ? "Sunny has evolved to a new form!" 
                        : `${5 - (profile.level % 5)} more levels until Sunny evolves`}
                    </p>
                    <button 
                      onClick={handleLevelUp}
                      className="mt-4 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Level Up (Testing)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-4">Your Stats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">{profile.totalXP}</div>
                  <div className="text-sm text-slate-500">Total XP</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">{profile.daysActive}</div>
                  <div className="text-sm text-slate-500">Days Active</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">{profile.currentStreak}</div>
                  <div className="text-sm text-slate-500">Current Streak</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-2xl font-bold text-indigo-600">{new Date(profile.joinDate).toLocaleDateString()}</div>
                  <div className="text-sm text-slate-500">Member Since</div>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editedProfile.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700">
                        {profile.email}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Avatar Initials</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="avatar"
                        value={editedProfile.avatar}
                        onChange={handleChange}
                        maxLength={2}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700">
                        {profile.avatar}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-4">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                  <div>
                    <h4 className="font-medium text-slate-700">Notifications</h4>
                    <p className="text-sm text-slate-500">Receive reminders about your quests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="preferences.notifications"
                      checked={isEditing ? editedProfile.preferences.notifications : profile.preferences.notifications} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                  <div>
                    <h4 className="font-medium text-slate-700">Dark Mode</h4>
                    <p className="text-sm text-slate-500">Use dark theme for the app</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="preferences.darkMode"
                      checked={isEditing ? editedProfile.preferences.darkMode : profile.preferences.darkMode} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                  <div>
                    <h4 className="font-medium text-slate-700">Week Starts On</h4>
                    <p className="text-sm text-slate-500">Choose the first day of the week</p>
                  </div>
                  {isEditing ? (
                    <select
                      name="preferences.weekStartsOn"
                      value={editedProfile.preferences.weekStartsOn}
                      onChange={handleSelectChange}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="monday">Monday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 capitalize">
                      {profile.preferences.weekStartsOn}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <h4 className="font-medium text-red-700 mb-2">Reset Progress</h4>
                <p className="text-sm text-red-600 mb-4">This will reset all your quests and progress. This action cannot be undone.</p>
                <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  Reset All Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
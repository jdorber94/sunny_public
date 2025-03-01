'use client';

import { useState, useEffect } from 'react';
import SunnyPet from '@/components/SunnyPet';
import SunnyEvolution from '@/components/SunnyEvolution';
import { useTheme } from '@/components/ThemeProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserProfile as FirestoreUserProfile, 
  saveUserProfile, 
  getUserProfile, 
  subscribeToUserProfile,
  getUserStats,
  subscribeToUserStats,
  saveUserStats,
  getHabits,
  subscribeToHabits
} from '@/lib/firestoreService';

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

// Calculate level from XP
const calculateLevel = (xp: number) => {
  // Each level requires double XP of the previous level
  // Level 1: 0-60
  // Level 2: 60-180 (60 + 120)
  // Level 3: 180-420 (180 + 240)
  // Level 4: 420-900 (420 + 480)
  const getRequiredXP = (level: number): number => {
    if (level === 1) return 60;
    return getRequiredXP(level - 1) * 2;
  };

  let level = 1;
  let totalRequired = 60; // First level requirement

  while (xp >= totalRequired) {
    level++;
    totalRequired += getRequiredXP(level);
  }

  return level;
};

// Calculate streak from habit logs
const calculateStreak = (habits: any[]) => {
  if (!habits || habits.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  let currentDate = new Date(today);
  
  while (true) {
    const dateToCheck = currentDate.toISOString().split('T')[0];
    const completedHabits = habits.filter(habit => 
      habit.logs && habit.logs.includes(dateToCheck)
    );
    
    if (completedHabits.length === 0) break;
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

// Calculate days active from habit logs
const calculateDaysActive = (habits: any[]) => {
  if (!habits || habits.length === 0) return 0;
  
  // Get all unique dates from all habit logs
  const activeDates = new Set<string>();
  
  habits.forEach(habit => {
    if (habit.logs) {
      habit.logs.forEach((date: string) => {
        activeDates.add(date);
      });
    }
  });
  
  return activeDates.size;
};

function ProfileContent() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.displayName || 'User',
    email: user?.email || 'user@example.com',
    avatar: user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U',
    level: 1,
    totalXP: 0,
    daysActive: 0,
    currentStreak: 0,
    joinDate: new Date().toISOString().split('T')[0],
    preferences: {
      notifications: true,
      darkMode: isDarkMode,
      weekStartsOn: 'monday'
    }
  });

  // Load data from Firestore or localStorage
  useEffect(() => {
    if (!user) return;

    // Set up subscriptions to Firestore data
    const unsubscribeProfile = subscribeToUserProfile(user.uid, (firestoreProfile) => {
      if (firestoreProfile) {
        setProfile(prev => ({
          ...prev,
          name: firestoreProfile.name,
          email: firestoreProfile.email,
          avatar: firestoreProfile.avatar,
          level: firestoreProfile.level,
          totalXP: firestoreProfile.totalXP,
          daysActive: firestoreProfile.daysActive,
          currentStreak: firestoreProfile.currentStreak,
          joinDate: firestoreProfile.joinDate,
          preferences: firestoreProfile.preferences
        }));
      }
    });

    const unsubscribeStats = subscribeToUserStats(user.uid, (stats) => {
      if (stats) {
        const level = calculateLevel(stats.totalXP);
        setProfile(prev => ({
          ...prev,
          level,
          totalXP: stats.totalXP
        }));
      }
    });

    const unsubscribeHabits = subscribeToHabits(user.uid, (habits) => {
      if (habits && habits.length > 0) {
        const currentStreak = calculateStreak(habits);
        const daysActive = calculateDaysActive(habits);
        
        setProfile(prev => ({
          ...prev,
          currentStreak,
          daysActive
        }));
      }
    });

    // Fallback to localStorage if Firestore data is not available yet
    const loadFromLocalStorage = async () => {
      if (typeof window !== 'undefined') {
        // Check if we have data in Firestore first
        const firestoreProfile = await getUserProfile(user.uid);
        const firestoreStats = await getUserStats(user.uid);
        const firestoreHabits = await getHabits(user.uid);
        
        // If we don't have Firestore data, use localStorage
        if (!firestoreProfile || !firestoreStats || firestoreHabits.length === 0) {
          // Load habits
          const savedHabits = localStorage.getItem('habits');
          const habits = savedHabits ? JSON.parse(savedHabits) : [];
          
          // Load stats
          const savedStats = localStorage.getItem('habitStats');
          const stats = savedStats ? JSON.parse(savedStats) : { totalXP: 0 };
          
          // Calculate level from XP
          const level = calculateLevel(stats.totalXP);
          
          // Calculate streak and days active
          const currentStreak = calculateStreak(habits);
          const daysActive = calculateDaysActive(habits);
          
          // Get join date (or use current date if not available)
          const savedProfile = localStorage.getItem('userProfile');
          const joinDate = savedProfile 
            ? JSON.parse(savedProfile).joinDate 
            : new Date().toISOString().split('T')[0];
          
          // Update profile with actual data
          setProfile(prev => ({
            ...prev,
            name: user?.displayName || prev.name,
            email: user?.email || prev.email,
            avatar: user?.displayName ? user.displayName.charAt(0).toUpperCase() : prev.avatar,
            level,
            totalXP: stats.totalXP || 0,
            daysActive,
            currentStreak,
            joinDate,
            preferences: {
              ...prev.preferences,
              darkMode: isDarkMode
            }
          }));
        }
      }
    };

    loadFromLocalStorage();

    // Clean up subscriptions
    return () => {
      unsubscribeProfile();
      unsubscribeStats();
      unsubscribeHabits();
    };
  }, [user, isDarkMode]);

  // Save profile to Firestore when it changes
  useEffect(() => {
    if (!user) return;
    
    // Save to Firestore
    saveUserProfile(user.uid, profile as FirestoreUserProfile)
      .catch(error => console.error('Error saving profile to Firestore:', error));
    
    // Also save to localStorage as fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
  }, [profile, user]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const [sunnyInteractions, setSunnyInteractions] = useState(0);
  const [showEvolution, setShowEvolution] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(profile.level);
  
  // Update edited profile when profile changes
  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);
  
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
    
    // Update dark mode if changed
    if (editedProfile.preferences.darkMode !== isDarkMode) {
      toggleDarkMode();
    }
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
      // Update XP in both profile and habitStats
      const newXP = profile.totalXP + 10;
      setProfile(prev => ({
        ...prev,
        totalXP: newXP,
        level: calculateLevel(newXP)
      }));
      
      // Update habitStats in Firestore and localStorage
      if (user) {
        saveUserStats(user.uid, {
          totalXP: newXP,
          dailyXP: { date: new Date().toISOString().split('T')[0], xp: 0 }
        }).catch(error => console.error('Error saving stats to Firestore:', error));
      }
      
      // Also update localStorage as fallback
      if (typeof window !== 'undefined') {
        const savedStats = localStorage.getItem('habitStats');
        const stats = savedStats ? JSON.parse(savedStats) : { 
          totalXP: 0,
          dailyXP: { date: new Date().toISOString().split('T')[0], xp: 0 }
        };
        
        stats.totalXP = newXP;
        localStorage.setItem('habitStats', JSON.stringify(stats));
      }
    }
  };

  const handleLevelUp = () => {
    // Update XP in both profile and habitStats
    const newXP = profile.totalXP + 100;
    const newLevel = calculateLevel(newXP);
    
    setProfile(prev => ({
      ...prev,
      totalXP: newXP,
      level: newLevel
    }));
    
    // Update habitStats in Firestore and localStorage
    if (user) {
      saveUserStats(user.uid, {
        totalXP: newXP,
        dailyXP: { date: new Date().toISOString().split('T')[0], xp: 0 }
      }).catch(error => console.error('Error saving stats to Firestore:', error));
    }
    
    // Also update localStorage as fallback
    if (typeof window !== 'undefined') {
      const savedStats = localStorage.getItem('habitStats');
      const stats = savedStats ? JSON.parse(savedStats) : { 
        totalXP: 0,
        dailyXP: { date: new Date().toISOString().split('T')[0], xp: 0 }
      };
      
      stats.totalXP = newXP;
      localStorage.setItem('habitStats', JSON.stringify(stats));
    }
    
    setShowEvolution(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {showEvolution && (
        <SunnyEvolution 
          level={profile.level} 
          onClose={handleLevelUp} 
        />
      )}
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-2xl font-bold mr-4">
                {profile.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.level}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total XP</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.totalXP}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.currentStreak} days</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Days Active</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.daysActive} days</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(profile.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Profile
              </button>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Your Sunny</h3>
            <div className="flex justify-center mb-4" onClick={handleSunnyClick}>
              <SunnyPet level={profile.level} size="large" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Level {profile.level} • {Math.ceil(profile.level / 5)} Evolution
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-2/3">
          {isEditing ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Edit Profile</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={editedProfile.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={editedProfile.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    disabled={!!user} // Disable email editing if using Firebase auth
                  />
                </div>
                
                <div>
                  <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Avatar Initial
                  </label>
                  <input
                    type="text"
                    name="avatar"
                    id="avatar"
                    value={editedProfile.avatar}
                    onChange={handleChange}
                    maxLength={1}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-white pt-4">Preferences</h3>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="preferences.notifications"
                    id="notifications"
                    checked={editedProfile.preferences.notifications}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-slate-600"
                  />
                  <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Enable Notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="preferences.darkMode"
                    id="darkMode"
                    checked={editedProfile.preferences.darkMode}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-slate-600"
                  />
                  <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Dark Mode
                  </label>
                </div>
                
                <div>
                  <label htmlFor="weekStartsOn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Week Starts On
                  </label>
                  <select
                    name="preferences.weekStartsOn"
                    id="weekStartsOn"
                    value={editedProfile.preferences.weekStartsOn}
                    onChange={handleSelectChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Activity Overview</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Achievements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-indigo-900 dark:text-indigo-300">Reached Level {profile.level}</p>
                          <p className="text-sm text-indigo-700 dark:text-indigo-400">Keep going!</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-600 dark:text-green-300 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-300">{profile.currentStreak} Day Streak</p>
                          <p className="text-sm text-green-700 dark:text-green-400">Don't break the chain!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Preferences</h3>
                  <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {profile.preferences.notifications ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {profile.preferences.darkMode ? 'Dark Mode' : 'Light Mode'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Week Starts On</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {profile.preferences.weekStartsOn === 'monday' ? 'Monday' : 'Sunday'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
} 
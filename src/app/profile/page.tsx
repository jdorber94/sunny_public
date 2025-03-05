'use client';

import { useState, useEffect } from 'react';
import QuestPet from '@/components/QuestPet';
import QuestEvolution from '@/components/QuestEvolution';
import { useTheme } from '@/components/ThemeProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
import PremiumStatusFixer from '@/components/PremiumStatusFixer';

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

interface Achievement {
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
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
  const { user, signOut } = useAuth();
  const router = useRouter();
  
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

  // Define achievements
  const achievements: Achievement[] = [
    {
      name: 'First Quest',
      description: 'Complete your first habit',
      icon: '🎯',
      unlocked: profile.totalXP > 0
    },
    {
      name: 'Streak Master',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      unlocked: profile.currentStreak >= 7
    },
    {
      name: 'Level Up',
      description: 'Reach level 5',
      icon: '⚔️',
      unlocked: profile.level >= 5
    },
    {
      name: 'Quest Champion',
      description: 'Complete 50 habits',
      icon: '👑',
      unlocked: profile.totalXP >= 500
    }
  ];

  // Calculate total habits completed
  const calculateHabitsCompleted = (profile: UserProfile) => {
    return Math.floor(profile.totalXP / 10); // Assuming each habit gives 10 XP
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Quest Profile</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/settings')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
          <QuestPet level={profile.level} size="large" />
          
          {/* Progress Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Quest Progress</h2>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 dark:text-slate-300">Level {profile.level}</span>
                <span className="text-slate-600 dark:text-slate-300">{profile.totalXP} XP</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-black dark:bg-slate-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(profile.totalXP % 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Quest Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-white">{calculateHabitsCompleted(profile)}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Quests Completed</div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-white">{profile.currentStreak} days</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Current Streak</div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-white">{profile.currentStreak > 0 ? profile.currentStreak : 'N/A'}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Longest Streak</div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-white">{profile.totalXP}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Total XP</div>
              </div>
            </div>
          </div>

          {/* Achievements Section */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Quest Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    achievement.unlocked 
                      ? 'bg-slate-100 dark:bg-slate-700 border-black dark:border-slate-600' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="mr-4 text-2xl">
                      {achievement.unlocked ? achievement.icon : '🔒'}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        achievement.unlocked 
                          ? 'text-slate-900 dark:text-white' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-sm ${
                        achievement.unlocked 
                          ? 'text-slate-600 dark:text-slate-300' 
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showEvolution && (
        <QuestEvolution 
          level={profile.level} 
          onClick={handleLevelUp}
        />
      )}
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
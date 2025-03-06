import { 
  collection, 
  doc, 
  CollectionReference, 
  DocumentReference,
  Firestore
} from 'firebase/firestore';
import { db } from './config';
import { 
  Habit, 
  HabitSet, 
  UserProfile, 
  UserStats 
} from '@/types';
import { 
  habitConverter, 
  habitSetConverter, 
  userProfileConverter, 
  userStatsConverter 
} from './converters';

// Type-safe collection references
export const collections = {
  // User collections
  users: () => collection(db, 'users'),
  userProfiles: () => collection(db, 'users'),
  
  // Habit sets
  habitSets: (userId: string) => 
    collection(db, 'users', userId, 'habitSets').withConverter(habitSetConverter),
  habits: (userId: string, habitSetId: string) => 
    collection(db, 'users', userId, 'habitSets', habitSetId, 'habits').withConverter(habitConverter),
  
  // User stats
  userStats: (userId: string) => 
    collection(db, 'users', userId, 'stats').withConverter(userStatsConverter),
};

// Helper functions to get references with the default db instance
export const getUserProfileRef = (userId: string): DocumentReference<UserProfile> => 
  doc(db, 'users', userId).withConverter(userProfileConverter);

export const getHabitSetsRef = (userId: string): CollectionReference<HabitSet> => 
  collections.habitSets(userId);

export const getHabitSetRef = (userId: string, habitSetId: string): DocumentReference<HabitSet> => 
  doc(collections.habitSets(userId), habitSetId);

export const getHabitsRef = (userId: string, habitSetId: string): CollectionReference<Habit> => 
  collections.habits(userId, habitSetId);

export const getHabitRef = (userId: string, habitSetId: string, habitId: string): DocumentReference<Habit> => 
  doc(collections.habits(userId, habitSetId), habitId);

export const getUserStatsRef = (userId: string): CollectionReference<UserStats> => 
  collections.userStats(userId);

// Add a function to get a document reference for user stats
export const getUserStatsDocRef = (userId: string, statsId: string = 'current'): DocumentReference<UserStats> => 
  doc(collections.userStats(userId), statsId); 
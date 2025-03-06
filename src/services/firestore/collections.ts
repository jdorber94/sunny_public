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

export const getUserStatsRef = (userId: string, statsId: string = 'main'): DocumentReference<UserStats> => 
  doc(db, 'users', userId, 'stats', statsId).withConverter(userStatsConverter);

export const getHabitSetsRef = (userId: string): CollectionReference<HabitSet> => {
  console.log(`Creating habit sets collection reference for user ${userId}`);
  return collection(db, 'users', userId, 'habitSets').withConverter(habitSetConverter);
};

export const getHabitSetRef = (userId: string, habitSetId: string): DocumentReference<HabitSet> => {
  console.log(`Creating habit set document reference for user ${userId}, set ${habitSetId}`);
  return doc(db, 'users', userId, 'habitSets', habitSetId).withConverter(habitSetConverter);
};

export const getHabitsRef = (userId: string, habitSetId: string): CollectionReference<Habit> => {
  console.log(`Creating habits collection reference for user ${userId}, set ${habitSetId}`);
  return collection(db, 'users', userId, 'habitSets', habitSetId, 'habits').withConverter(habitConverter);
};

export const getHabitRef = (userId: string, habitSetId: string, habitId: string): DocumentReference<Habit> => {
  console.log(`Creating habit document reference for user ${userId}, set ${habitSetId}, habit ${habitId}`);
  return doc(db, 'users', userId, 'habitSets', habitSetId, 'habits', habitId).withConverter(habitConverter);
};

// Add a function to get a document reference for user stats
export const getUserStatsDocRef = (userId: string, statsId: string = 'current'): DocumentReference<UserStats> => 
  doc(collections.userStats(userId), statsId); 
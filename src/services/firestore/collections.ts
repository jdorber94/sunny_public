import { 
  collection, 
  doc, 
  CollectionReference, 
  DocumentReference,
  Firestore
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  users: (db: Firestore) => collection(db, 'users'),
  userProfile: (db: Firestore, userId: string) => 
    doc(db, 'users', userId).withConverter(userProfileConverter),
  
  // Habit sets
  habitSets: (db: Firestore, userId: string) => 
    collection(db, 'users', userId, 'habitSets').withConverter(habitSetConverter),
  habitSet: (db: Firestore, userId: string, habitSetId: string) => 
    doc(db, 'users', userId, 'habitSets', habitSetId).withConverter(habitSetConverter),
  
  // Habits within a habit set
  habits: (db: Firestore, userId: string, habitSetId: string) => 
    collection(db, 'users', userId, 'habitSets', habitSetId, 'habits').withConverter(habitConverter),
  habit: (db: Firestore, userId: string, habitSetId: string, habitId: string) => 
    doc(db, 'users', userId, 'habitSets', habitSetId, 'habits', habitId).withConverter(habitConverter),
  
  // User stats
  userStats: (db: Firestore, userId: string) => 
    doc(db, 'users', userId, 'stats', 'daily').withConverter(userStatsConverter),
};

// Helper functions to get references with the default db instance
export const getUserProfileRef = (userId: string): DocumentReference<UserProfile> => 
  collections.userProfile(db, userId);

export const getHabitSetsRef = (userId: string): CollectionReference<HabitSet> => 
  collections.habitSets(db, userId);

export const getHabitSetRef = (userId: string, habitSetId: string): DocumentReference<HabitSet> => 
  collections.habitSet(db, userId, habitSetId);

export const getHabitsRef = (userId: string, habitSetId: string): CollectionReference<Habit> => 
  collections.habits(db, userId, habitSetId);

export const getHabitRef = (userId: string, habitSetId: string, habitId: string): DocumentReference<Habit> => 
  collections.habit(db, userId, habitSetId, habitId);

export const getUserStatsRef = (userId: string): DocumentReference<UserStats> => 
  collections.userStats(db, userId); 
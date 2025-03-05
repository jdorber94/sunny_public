import { 
  FirestoreDataConverter, 
  DocumentData, 
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  serverTimestamp,
  WithFieldValue,
  PartialWithFieldValue,
  SetOptions
} from 'firebase/firestore';
import { 
  Habit, 
  HabitSet, 
  UserProfile, 
  UserStats 
} from '@/types';

// Helper function to add timestamps to new documents
export const withTimestamps = <T extends object>(data: T) => {
  return {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
};

// Helper function to add update timestamp
export const withUpdateTimestamp = <T extends object>(data: T) => {
  return {
    ...data,
    updatedAt: serverTimestamp()
  };
};

// Generic converter factory
export function createConverter<T extends { id: string }>(
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>) => T,
  toFirestore: (data: Partial<T>) => DocumentData
): FirestoreDataConverter<T> {
  return {
    fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions) => {
      return fromFirestore(snapshot);
    },
    toFirestore: (modelObject: WithFieldValue<T> | PartialWithFieldValue<T>, options?: SetOptions) => {
      // We need to handle both full and partial objects
      const data = modelObject as Partial<T>;
      // Remove id from the data to avoid saving it in the document
      const { id, ...rest } = data as any;
      return toFirestore(rest);
    }
  };
}

// Habit converter
export const habitConverter = createConverter<Habit>(
  (snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name || '',
      logs: data.logs || [],
      xp: data.xp || 0,
      streak: data.streak,
      category: data.category,
      daysOfWeek: data.daysOfWeek,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp
    };
  },
  (habit) => {
    return habit;
  }
);

// HabitSet converter
export const habitSetConverter = createConverter<HabitSet>(
  (snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name || '',
      description: data.description,
      isPremium: data.isPremium || false,
      isActive: data.isActive || false,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp
    };
  },
  (habitSet) => {
    return habitSet;
  }
);

// UserProfile converter
export const userProfileConverter = createConverter<UserProfile>(
  (snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name || '',
      email: data.email || '',
      avatar: data.avatar || '',
      level: data.level || 1,
      totalXP: data.totalXP || 0,
      daysActive: data.daysActive || 0,
      currentStreak: data.currentStreak || 0,
      joinDate: data.joinDate || new Date().toISOString().split('T')[0],
      isPremium: data.isPremium || false,
      preferences: {
        notifications: data.preferences?.notifications || false,
        darkMode: data.preferences?.darkMode || false,
        weekStartsOn: data.preferences?.weekStartsOn || 'monday'
      },
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp
    };
  },
  (profile) => {
    return profile;
  }
);

// UserStats converter
export const userStatsConverter = createConverter<UserStats>(
  (snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      totalXP: data.totalXP || 0,
      dailyXP: {
        date: data.dailyXP?.date || new Date().toISOString().split('T')[0],
        xp: data.dailyXP?.xp || 0
      },
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp
    };
  },
  (stats) => {
    return stats;
  }
); 
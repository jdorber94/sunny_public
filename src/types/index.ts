import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

// Error types
export enum ErrorType {
  AUTH = 'auth',
  FIRESTORE = 'firestore',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

export interface AppError extends Error {
  type: ErrorType;
  originalError?: unknown;
  code?: string;
}

// Base types with common fields
export interface BaseModel {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// User related types
export interface UserProfile extends BaseModel {
  name: string;
  email: string;
  avatar: string;
  level: number;
  totalXP: number;
  daysActive: number;
  currentStreak: number;
  joinDate: string;
  isPremium: boolean;
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  weekStartsOn: 'monday' | 'sunday';
}

export interface UserStats extends BaseModel {
  totalXP: number;
  dailyXP: DailyXP;
}

export interface DailyXP {
  date: string;
  xp: number;
}

// Habit related types
export interface Habit extends BaseModel {
  name: string;
  logs: string[];
  xp: number;
  streak?: number;
  category?: string;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
}

export interface HabitSet extends BaseModel {
  name: string;
  description?: string;
  isPremium: boolean;
  isActive: boolean;
}

// Extended user type with premium status
export interface AppUser extends FirebaseUser {
  isPremium?: boolean;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

// Form state types
export interface FormState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Subscription options
export interface SubscriptionOptions {
  onError?: (error: AppError) => void;
  onData?: (data: any) => void;
  errorMessage?: string;
  showErrorToast?: boolean;
} 
import { toast } from 'react-hot-toast';
import { FirebaseError } from 'firebase/app';

// Error types
export enum ErrorType {
  AUTH = 'auth',
  FIRESTORE = 'firestore',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

// Custom error class
export class AppError extends Error {
  type: ErrorType;
  originalError?: unknown;
  code?: string;

  constructor(message: string, type: ErrorType, originalError?: unknown) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
    
    if (originalError instanceof FirebaseError) {
      this.code = originalError.code;
    }
  }
}

// Handle different error types
export function handleError(error: unknown, customMessage?: string): AppError {
  // Already an AppError, just return it
  if (error instanceof AppError) {
    return error;
  }
  
  // Firebase error
  if (error instanceof FirebaseError) {
    const message = customMessage || getFirebaseErrorMessage(error);
    const type = getErrorTypeFromFirebaseError(error);
    return new AppError(message, type, error);
  }
  
  // Network error
  if (error instanceof TypeError && error.message.includes('network')) {
    return new AppError(
      customMessage || 'Network error. Please check your connection.',
      ErrorType.NETWORK,
      error
    );
  }
  
  // Generic error
  const message = customMessage || 
    (error instanceof Error ? error.message : 'An unknown error occurred');
  
  return new AppError(message, ErrorType.UNKNOWN, error);
}

// Get user-friendly message for Firebase errors
export function getFirebaseErrorMessage(error: FirebaseError): string {
  // Add specific handling for quota exceeded errors
  if (error.code === 'resource-exhausted') {
    return 'Firebase quota exceeded. The app will use cached data where possible. Some features may be limited until quota resets.';
  }
  
  switch (error.code) {
    // Auth errors
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password';
    case 'auth/email-already-in-use':
      return 'This email is already in use';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/requires-recent-login':
      return 'Please log in again to continue';
      
    // Firestore errors
    case 'permission-denied':
      return 'You don\'t have permission to access this data';
    case 'not-found':
      return 'The requested document was not found';
      
    // Default
    default:
      return `Error: ${error.message}`;
  }
}

// Determine error type from Firebase error
export function getErrorTypeFromFirebaseError(error: FirebaseError): ErrorType {
  if (error.code.startsWith('auth/')) {
    return ErrorType.AUTH;
  }
  
  if (['permission-denied', 'not-found', 'already-exists'].includes(error.code)) {
    return ErrorType.FIRESTORE;
  }
  
  if (['unavailable', 'deadline-exceeded'].includes(error.code)) {
    return ErrorType.NETWORK;
  }
  
  return ErrorType.UNKNOWN;
}

// Show error toast
export function showErrorToast(error: unknown, customMessage?: string): void {
  const appError = handleError(error, customMessage);
  toast.error(appError.message);
  logError(appError);
}

// Log error to monitoring service
export function logError(error: AppError | unknown): void {
  // In a real app, you would send this to a monitoring service
  // For now, just log to console
  const appError = error instanceof AppError ? error : handleError(error);
  console.error('Error logged:', appError);
}

// Add a function to check if an error is a quota exceeded error
export function isQuotaExceededError(error: unknown): boolean {
  if (!error) return false;
  
  // Check if it's a Firebase error with the resource-exhausted code
  if (error instanceof FirebaseError && error.code === 'resource-exhausted') {
    return true;
  }
  
  // Check for error message containing "quota" or "resource exhausted"
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('quota') || 
           errorMessage.includes('resource exhausted') ||
           errorMessage.includes('resource-exhausted');
  }
  
  // If it's an object with a code property
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    if (errorObj.code === 'resource-exhausted') {
      return true;
    }
    
    // Check message property if it exists
    if (errorObj.message && typeof errorObj.message === 'string') {
      const errorMessage = errorObj.message.toLowerCase();
      return errorMessage.includes('quota') || 
             errorMessage.includes('resource exhausted') ||
             errorMessage.includes('resource-exhausted');
    }
  }
  
  return false;
} 
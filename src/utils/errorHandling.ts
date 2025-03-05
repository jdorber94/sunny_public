import { toast } from 'react-hot-toast';
import { FirebaseError } from 'firebase/app';
import { ErrorType } from '@/types';

// Custom error class
export class AppError extends Error {
  type: ErrorType;
  originalError?: unknown;
  code?: string;

  constructor(
    message: string, 
    type: ErrorType = ErrorType.UNKNOWN, 
    originalError?: unknown,
    code?: string
  ) {
    super(message);
    
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
    this.code = code;
  }
}

// Function to handle errors
export function handleError(error: unknown, defaultMessage = 'An error occurred'): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }
  
  // Firebase error
  if (error instanceof FirebaseError) {
    const message = getFirebaseErrorMessage(error) || defaultMessage;
    const type = getErrorTypeFromFirebaseError(error);
    return new AppError(message, type, error, error.code);
  }
  
  // Standard Error
  if (error instanceof Error) {
    return new AppError(error.message || defaultMessage, ErrorType.UNKNOWN, error);
  }
  
  // String error
  if (typeof error === 'string') {
    return new AppError(error, ErrorType.UNKNOWN);
  }
  
  // Unknown error
  return new AppError(defaultMessage, ErrorType.UNKNOWN, error);
}

// Function to get user-friendly message from Firebase error
function getFirebaseErrorMessage(error: FirebaseError): string {
  switch (error.code) {
    // Auth errors
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password';
    case 'auth/email-already-in-use':
      return 'Email is already in use';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/requires-recent-login':
      return 'Please log in again to continue';
    
    // Firestore errors
    case 'permission-denied':
      return 'You do not have permission to access this resource';
    case 'not-found':
      return 'The requested document was not found';
    
    // Network errors
    case 'network-request-failed':
      return 'Network error. Please check your connection';
    
    // Default
    default:
      return error.message;
  }
}

// Function to determine error type from Firebase error
function getErrorTypeFromFirebaseError(error: FirebaseError): ErrorType {
  const code = error.code;
  
  if (code.startsWith('auth/')) {
    return ErrorType.AUTH;
  }
  
  if (
    code === 'permission-denied' || 
    code === 'not-found' || 
    code.includes('firestore')
  ) {
    return ErrorType.FIRESTORE;
  }
  
  if (code === 'network-request-failed') {
    return ErrorType.NETWORK;
  }
  
  return ErrorType.UNKNOWN;
}

// Function to show error toast
export function showErrorToast(error: unknown, defaultMessage = 'An error occurred'): void {
  const appError = error instanceof AppError ? error : handleError(error, defaultMessage);
  toast.error(appError.message);
}

// Function to log error to analytics/monitoring service
export function logError(error: unknown): void {
  const appError = error instanceof AppError ? error : handleError(error);
  
  // In a real app, you would send this to a monitoring service
  console.error('Error:', {
    message: appError.message,
    type: appError.type,
    code: appError.code,
    stack: appError.stack,
    originalError: appError.originalError
  });
} 
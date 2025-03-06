import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { app } from './config';

// Initialize Firebase Auth
const auth = getAuth(app);

// Authentication functions
export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const createUser = async (email: string, password: string, displayName: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return result.user;
};

export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user (returns null if not authenticated)
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Create a test user for debugging purposes
export const createTestUser = async (): Promise<User> => {
  try {
    // Try to sign in with test credentials first
    try {
      const result = await signInWithEmailAndPassword(auth, 'test@example.com', 'Test123!');
      console.log('Signed in with test user');
      return result.user;
    } catch (error) {
      // If sign in fails, create a new test user
      console.log('Creating new test user');
      const result = await createUserWithEmailAndPassword(auth, 'test@example.com', 'Test123!');
      await updateProfile(result.user, { displayName: 'Test User' });
      return result.user;
    }
  } catch (error) {
    console.error('Error creating/signing in test user:', error);
    throw error;
  }
};

// Export Firebase auth instance
export { auth }; 
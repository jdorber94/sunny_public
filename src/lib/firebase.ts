// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdZ0VmtWqbPVuxdqUlNPHSKUcWmcBeA34",
  authDomain: "sunny-e813e.firebaseapp.com",
  projectId: "sunny-e813e",
  storageBucket: "sunny-e813e.firebasestorage.app",
  messagingSenderId: "796344000230",
  appId: "1:796344000230:web:2eb9fd289589b38995a527",
  measurementId: "G-HV9FPZZTLY"
};

// Debug log the config (excluding sensitive values)
console.log('Firebase Config:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

// Export Firebase instances
export { db, auth }; 
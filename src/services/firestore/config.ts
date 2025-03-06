import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { app } from '../firebase/config';

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence
export const enableOfflineMode = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Offline persistence is enabled');
    return true;
  } catch (error) {
    console.error('Error enabling offline persistence:', error);
    return false;
  }
}; 
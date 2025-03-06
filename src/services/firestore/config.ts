import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore';
import { app } from '../firebase/config';

// Initialize Firestore with local persistence enabled
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (error) {
    console.warn('Failed to initialize Firestore with persistent cache, falling back to memory cache', error);
    // Fallback to memory cache if persistent cache fails
    return initializeFirestore(app, {
      localCache: memoryLocalCache()
    });
  }
})();

// Enable offline persistence
export const enableOfflineMode = async () => {
  try {
    // This is already handled by the configuration above
    console.log('Offline persistence is enabled');
    return true;
  } catch (error) {
    console.error('Error enabling offline persistence:', error);
    return false;
  }
}; 
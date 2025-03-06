import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
export function initializeFirebaseAdmin() {
  // Only initialize if it hasn't been initialized already
  if (getApps().length === 0) {
    try {
      // Get the service account from environment variables
      const serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      };
      
      // Check if we have the required environment variables
      if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
        throw new Error('Missing required Firebase Admin environment variables');
      }
      
      // Initialize the app
      initializeApp({
        credential: cert(serviceAccount)
      });
      
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      throw error;
    }
  }
} 
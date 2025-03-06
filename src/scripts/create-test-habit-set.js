// Simple script to create a test habit set
// Run with: node src/scripts/create-test-habit-set.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
};

// Check if we have the required environment variables
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('Missing required environment variables. Make sure you have set up .env.local correctly.');
  process.exit(1);
}

// Initialize the app
try {
  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

const db = getFirestore();

// Function to create a test habit set
async function createTestHabitSet() {
  // Get the user ID from command line arguments or use a default
  const userId = process.argv[2] || 'test_user';
  
  console.log(`Creating test habit set for user: ${userId}`);
  
  try {
    // Create a new habit set
    const habitSetRef = db.collection('users').doc(userId).collection('habitSets').doc();
    
    const now = new Date();
    
    await habitSetRef.set({
      id: habitSetRef.id,
      name: 'Test Habit Set',
      description: 'A test habit set created via script',
      isPremium: false,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
    
    console.log(`Successfully created habit set with ID: ${habitSetRef.id}`);
    
    // Create a test habit in this set
    const habitRef = habitSetRef.collection('habits').doc();
    
    await habitRef.set({
      id: habitRef.id,
      name: 'Test Habit',
      logs: [],
      xp: 0,
      streak: 0,
      category: 'Test',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days of the week
      createdAt: now,
      updatedAt: now
    });
    
    console.log(`Successfully created habit with ID: ${habitRef.id}`);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the function
createTestHabitSet(); 
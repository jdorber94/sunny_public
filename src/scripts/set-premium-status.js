// Script to manually set premium status for a user
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  // Copy your Firebase config here from src/lib/firebase.js
  // apiKey, authDomain, projectId, etc.
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to set premium status
async function setPremiumStatus(userId) {
  try {
    // Get reference to the user document
    const userDocRef = doc(db, 'users', userId);
    
    // Check if user exists
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      console.error('User not found!');
      return false;
    }
    
    // Update the user's premium status
    await updateDoc(userDocRef, {
      isPremium: true,
      updatedAt: new Date()
    });
    
    console.log(`Premium status set to true for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error setting premium status:', error);
    return false;
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID as a command line argument');
  console.log('Usage: node set-premium-status.js USER_ID');
  process.exit(1);
}

// Set premium status
setPremiumStatus(userId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 
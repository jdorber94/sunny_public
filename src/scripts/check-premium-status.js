// Script to check premium status for a user
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  // Copy your Firebase config here from src/lib/firebase.js
  // apiKey, authDomain, projectId, etc.
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to check premium status
async function checkPremiumStatus(userId) {
  try {
    // Get reference to the user document
    const userDocRef = doc(db, 'users', userId);
    
    // Check if user exists
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      console.error('User not found!');
      return null;
    }
    
    // Get user data
    const userData = userDoc.data();
    
    // Log user profile data
    console.log('User Profile:');
    console.log(JSON.stringify(userData, null, 2));
    
    // Check premium status
    if ('isPremium' in userData) {
      console.log(`Premium status: ${userData.isPremium ? 'PREMIUM' : 'NOT PREMIUM'}`);
    } else {
      console.log('Premium status field (isPremium) does not exist in user profile!');
    }
    
    return userData;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return null;
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID as a command line argument');
  console.log('Usage: node check-premium-status.js USER_ID');
  process.exit(1);
}

// Check premium status
checkPremiumStatus(userId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 
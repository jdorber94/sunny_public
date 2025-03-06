import { NextResponse } from 'next/server';
import { db } from '@/services/firestore/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId } = body;

    // Validate inputs
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the user document reference
    const userDocRef = doc(db, 'users', userId);
    
    // Check if user document exists
    const userDocSnap = await getDoc(userDocRef);
    
    let userProfile;
    let created = false;
    
    if (userDocSnap.exists()) {
      // User exists, get the data
      userProfile = userDocSnap.data();
      
      // Debug info
      console.log('Existing user profile:', userProfile);
    } else {
      // User doesn't exist, create a new profile
      created = true;
      userProfile = {
        name: 'User',
        email: '',
        avatar: '',
        level: 1,
        totalXP: 0,
        daysActive: 1,
        currentStreak: 1,
        joinDate: new Date().toISOString(),
        isPremium: true,
        preferences: {
          notifications: true,
          darkMode: false,
          weekStartsOn: 'monday'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save the new profile
      await setDoc(userDocRef, userProfile);
    }
    
    // Ensure isPremium is set to true
    if (!userProfile.isPremium) {
      userProfile.isPremium = true;
      userProfile.updatedAt = new Date();
      
      // Update the profile
      await setDoc(userDocRef, userProfile, { merge: true });
    }
    
    return NextResponse.json({
      success: true,
      message: created ? 'User profile created with premium status' : 'User profile updated with premium status',
      userId,
      profile: userProfile
    });
  } catch (error) {
    console.error('Error debugging user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to debug user profile', error: String(error) },
      { status: 500 }
    );
  }
} 
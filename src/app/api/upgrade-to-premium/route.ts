import { NextResponse } from 'next/server';
import { db } from '@/services/firestore/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get the user's profile
    const userProfileDoc = doc(db, 'users', userId);
    const userProfileSnapshot = await getDoc(userProfileDoc);
    
    // If profile doesn't exist, create a new one
    if (!userProfileSnapshot.exists()) {
      console.log(`User profile not found for ${userId}, creating a new one`);
      
      const newUserProfile = {
        name: email.split('@')[0], // Use part of email as name
        email,
        isPremium: true,
        avatar: '',
        level: 1,
        totalXP: 0,
        daysActive: 1,
        currentStreak: 1,
        joinDate: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          notifications: true,
          darkMode: false,
          weekStartsOn: 'monday'
        }
      };
      
      // Save the new profile
      await setDoc(userProfileDoc, newUserProfile);
      
      console.log(`Created new premium profile for user ${userId}`);
      
      // Return the checkout URL
      return NextResponse.json({
        success: true,
        message: 'New premium profile created successfully'
      });
    }
    
    // Get the existing profile data
    const userProfile = userProfileSnapshot.data();
    
    // Update the profile with premium status
    const updatedProfile = {
      ...userProfile,
      isPremium: true,
      updatedAt: new Date()
    };
    
    // Save the updated profile
    await setDoc(userProfileDoc, updatedProfile);
    
    console.log(`User ${userId} manually upgraded to premium`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'User upgraded to premium successfully' 
    });
  } catch (error: any) {
    console.error('Error upgrading user to premium:', error);
    
    return NextResponse.json(
      { error: `Failed to upgrade user to premium: ${error.message}` },
      { status: 500 }
    );
  }
} 
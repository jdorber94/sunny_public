import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/firestoreService';

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
    let userProfile = await getUserProfile(userId);
    
    // If profile doesn't exist, create a new one
    if (!userProfile) {
      console.log(`User profile not found for ${userId}, creating a new one`);
      
      // Create a basic profile if email is provided
      if (email) {
        userProfile = {
          name: email.split('@')[0],
          email: email,
          avatar: '',
          level: 1,
          totalXP: 0,
          daysActive: 0,
          currentStreak: 0,
          joinDate: new Date().toISOString(),
          isPremium: true, // Set to premium immediately
          preferences: {
            notifications: true,
            darkMode: false,
            weekStartsOn: 'monday'
          }
        };
      } else {
        // Create a minimal profile if no email
        userProfile = {
          name: 'User',
          email: 'unknown@example.com',
          avatar: '',
          level: 1,
          totalXP: 0,
          daysActive: 0,
          currentStreak: 0,
          joinDate: new Date().toISOString(),
          isPremium: true,
          preferences: {
            notifications: true,
            darkMode: false,
            weekStartsOn: 'monday'
          }
        };
      }
      
      // Save the new profile
      await saveUserProfile(userId, userProfile);
      
      console.log(`Created new premium profile for user ${userId}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'New premium user profile created successfully' 
      });
    }
    
    // Update the existing profile with premium status
    userProfile.isPremium = true;
    
    // Save the updated profile
    await saveUserProfile(userId, userProfile);
    
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
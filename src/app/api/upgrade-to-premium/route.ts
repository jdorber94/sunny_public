import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/firestoreService';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get the user's profile
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    // Update the profile with premium status
    userProfile.isPremium = true;
    
    // Save the updated profile
    await saveUserProfile(userId, userProfile);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error upgrading to premium:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade to premium' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/firestoreService';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, adminKey } = body;

    // Validate inputs
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Simple admin key check - in a real app, use a more secure method
    const expectedAdminKey = process.env.ADMIN_KEY || 'admin-secret-key';
    if (adminKey !== expectedAdminKey) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user profile
    let userProfile = await getUserProfile(userId);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Set premium status
    userProfile.isPremium = true;

    // Save the updated profile
    await saveUserProfile(userId, userProfile);

    return NextResponse.json({
      success: true,
      message: 'Premium status set successfully',
      userId,
      isPremium: true
    });
  } catch (error) {
    console.error('Error setting premium status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set premium status' },
      { status: 500 }
    );
  }
} 
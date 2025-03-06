import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/services/firebase/admin';

export async function POST(request: Request) {
  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();
    
    // Get the request body
    const body = await request.json();
    const { name = 'Test Habit Set', description = 'A test habit set', userId = 'test_user' } = body;
    
    console.log(`Creating test habit set for user: ${userId}`);
    
    // Create a new habit set
    const habitSetRef = db.collection('users').doc(userId).collection('habitSets').doc();
    
    const now = new Date();
    
    await habitSetRef.set({
      id: habitSetRef.id,
      name,
      description,
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
    
    return NextResponse.json({
      success: true,
      habitSetId: habitSetRef.id,
      habitId: habitRef.id
    });
  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
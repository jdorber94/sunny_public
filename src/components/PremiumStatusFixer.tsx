'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function PremiumStatusFixer() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const fixPremiumStatus = async () => {
    if (!user) {
      toast.error('You must be logged in to fix premium status');
      return;
    }

    setLoading(true);
    try {
      // Get a reference to the user document
      const userDocRef = doc(db, 'users', user.uid);
      
      // First, check if the document exists and what it contains
      const docSnap = await getDoc(userDocRef);
      const currentData = docSnap.exists() ? docSnap.data() : null;
      
      console.log('Current user document:', currentData);
      setDebugInfo(currentData);
      
      // Update the document with isPremium set to true
      if (docSnap.exists()) {
        // Document exists, update it
        await updateDoc(userDocRef, {
          isPremium: true,
          updatedAt: new Date() // Use a JavaScript Date instead of serverTimestamp
        });
        console.log('Updated existing document with isPremium: true');
      } else {
        // Document doesn't exist, create it
        await setDoc(userDocRef, {
          isPremium: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Add other required fields with default values
          name: user.displayName || 'User',
          email: user.email || '',
          avatar: user.photoURL || '',
          level: 1,
          totalXP: 0,
          daysActive: 1,
          currentStreak: 0,
          joinDate: new Date().toISOString(),
          preferences: {
            notifications: true,
            darkMode: false,
            weekStartsOn: 'monday'
          }
        });
        console.log('Created new document with isPremium: true');
      }
      
      toast.success('Premium status fixed successfully!');
    } catch (error) {
      console.error('Error fixing premium status:', error);
      toast.error('Failed to fix premium status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Premium Status Fixer</h2>
      <p className="mb-4 text-gray-600">
        If you're having issues with your premium status, use this tool to fix it.
      </p>
      
      <button
        onClick={fixPremiumStatus}
        disabled={loading || !user}
        className={`
          px-4 py-2 rounded-md text-white font-medium
          ${loading || !user ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}
          transition-colors duration-200
        `}
      >
        {loading ? 'Fixing...' : 'Fix Premium Status'}
      </button>
      
      {debugInfo && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-medium mb-2">Debug Info:</h3>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 
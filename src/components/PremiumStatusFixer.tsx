'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/services/firestore/config';
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
          daysActive: 0,
          currentStreak: 0,
          joinDate: new Date().toISOString().split('T')[0],
          preferences: {
            notifications: true,
            darkMode: false,
            weekStartsOn: 'monday'
          }
        });
        console.log('Created new document with isPremium: true');
      }
      
      // Verify the update worked
      const updatedDocSnap = await getDoc(userDocRef);
      const updatedData = updatedDocSnap.exists() ? updatedDocSnap.data() : null;
      console.log('Updated user document:', updatedData);
      setDebugInfo(updatedData);
      
      toast.success('Premium status set to TRUE! Please refresh the page or sign out and back in to see changes.');
    } catch (error) {
      console.error('Error fixing premium status:', error);
      toast.error('Failed to fix premium status. See console for details.');
      setDebugInfo({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4">
      <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Premium Status Fixer</h3>
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
        If your premium status isn't working, click the button below to fix it.
      </p>
      <button
        onClick={fixPremiumStatus}
        disabled={loading || !user}
        className={`px-4 py-2 rounded-md text-white ${
          loading || !user
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-yellow-600 hover:bg-yellow-700'
        }`}
      >
        {loading ? 'Fixing...' : 'Fix Premium Status'}
      </button>
      
      {debugInfo && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
          <p className="font-medium mb-1">Debug Info:</p>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 
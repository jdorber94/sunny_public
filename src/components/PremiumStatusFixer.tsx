'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function PremiumStatusFixer() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fixPremiumStatus = async () => {
    if (!user) {
      toast.error('You must be logged in to fix premium status');
      return;
    }

    setLoading(true);
    try {
      // Get a reference to the user document
      const userDocRef = doc(db, 'users', user.uid);
      
      // Update the document with isPremium set to true
      await updateDoc(userDocRef, {
        isPremium: true
      });
      
      toast.success('Premium status set to TRUE! Please refresh the page or sign out and back in to see changes.');
    } catch (error) {
      console.error('Error fixing premium status:', error);
      toast.error('Failed to fix premium status. See console for details.');
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
    </div>
  );
} 
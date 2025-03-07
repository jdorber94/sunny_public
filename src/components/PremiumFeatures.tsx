'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import { stripePromise } from '@/lib/stripe';
import { toast } from 'react-hot-toast';
import PremiumStatusFixer from './PremiumStatusFixer';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Set the price display here (should match what's in your Stripe dashboard)
const PRICE_DISPLAY = '$0.99/month';

export default function PremiumFeatures() {
  const { user } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for success or canceled status from Stripe redirect
  useEffect(() => {
    if (searchParams) {
      const success = searchParams.get('success');
      const canceled = searchParams.get('canceled');
      const sessionId = searchParams.get('session_id');
      
      if (success === 'true' && sessionId) {
        toast.success('Thank you for upgrading to premium!');
        // We'll rely on the webhook to update the user's status
        // But we can also verify the session here if needed
      } else if (canceled === 'true') {
        toast.error('Premium upgrade was canceled.');
      }
    }
  }, [searchParams]);

  // Manual upgrade function (replaces upgradeToPremium)
  const upgradeToPremium = async () => {
    if (!user) {
      throw new Error('User must be logged in to upgrade to premium');
    }
    
    try {
      // Update the user's profile with premium status
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        isPremium: true,
        updatedAt: new Date()
      });
      
      toast.success('Successfully upgraded to premium!');
      return true;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      throw error;
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      setError('You must be logged in to upgrade.');
      return;
    }
    
    setUpgrading(true);
    setError('');
    
    try {
      console.log('Starting checkout process with user:', user.uid);
      
      // Create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });
      
      const session = await response.json();
      
      if (!response.ok) {
        throw new Error(session.message || 'Failed to create checkout session');
      }
      
      console.log('Checkout session created:', session);
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to start checkout process');
    } finally {
      setUpgrading(false);
    }
  };
  
  const handleManualUpgrade = async () => {
    if (!user) {
      setError('You must be logged in to upgrade.');
      return;
    }
    
    setUpgrading(true);
    setError('');
    
    try {
      await upgradeToPremium();
      toast.success('Successfully upgraded to premium!');
      // Force a page refresh to update the UI
      window.location.reload();
    } catch (err) {
      console.error('Manual upgrade error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to upgrade to premium');
    } finally {
      setUpgrading(false);
    }
  };
  
  // Check if user is already premium
  const isPremium = user?.isPremium;
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <SparklesIcon className="h-6 w-6 text-yellow-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Premium Features</h2>
        </div>
        
        {isPremium ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700 dark:text-green-300 font-medium">
                You have premium access!
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
            <p className="text-yellow-700 dark:text-yellow-300">
              Upgrade to premium to unlock all features.
            </p>
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-gray-600 dark:text-gray-300">Create unlimited habit sets</p>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-gray-600 dark:text-gray-300">Advanced statistics and insights</p>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-gray-600 dark:text-gray-300">Priority support</p>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-gray-600 dark:text-gray-300">No ads</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{PRICE_DISPLAY}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cancel anytime</p>
        </div>
        
        {!isPremium && (
          <>
            <button
              onClick={handleUpgrade}
              disabled={upgrading || !user}
              className={`
                w-full py-2 px-4 rounded-md font-medium text-white
                ${upgrading || !user
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'}
                transition-colors duration-200 mb-3
              `}
            >
              {upgrading ? 'Processing...' : 'Upgrade with Stripe'}
            </button>
            
            <button
              onClick={handleManualUpgrade}
              disabled={upgrading || !user}
              className={`
                w-full py-2 px-4 rounded-md font-medium text-white
                ${upgrading || !user
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'}
                transition-colors duration-200
              `}
            >
              {upgrading ? 'Processing...' : 'Upgrade Manually (Testing)'}
            </button>
            
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            
            {!user && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Please log in to upgrade to premium.
              </p>
            )}
          </>
        )}
      </div>
      
      {/* Add the premium status fixer for debugging */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Troubleshooting
        </h3>
        <PremiumStatusFixer />
      </div>
    </div>
  );
} 
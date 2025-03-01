'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import { stripePromise } from '@/lib/stripe';
import { toast } from 'react-hot-toast';

// Set the price display here (should match what's in your Stripe dashboard)
const PRICE_DISPLAY = '$0.99/month';

export default function PremiumFeatures() {
  const { user, upgradeToPremium } = useAuth();
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

  const handleUpgrade = async () => {
    if (!user) {
      setError('You must be logged in to upgrade.');
      return;
    }
    
    setUpgrading(true);
    setError('');
    
    try {
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      setError(`Failed to start the checkout process: ${error.message || 'Unknown error'}`);
      console.error('Error starting checkout:', error);
    } finally {
      setUpgrading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p>Please log in to view premium features</p>
      </div>
    );
  }

  if (user.isPremium) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
            <SparklesIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">
          Premium Member
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Thank you for supporting Quest Master! You have access to all premium features.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300">Create unlimited habit sets</p>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300">Advanced habit analytics</p>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300">Custom habit categories</p>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300">Priority support</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center mb-4">
        <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
          <SparklesIcon className="h-8 w-8 text-yellow-500" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">
        Upgrade to Premium
      </h2>
      <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
        Unlock all features and support the development of Quest Master
      </p>
      
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Premium Features</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300">Create unlimited habit sets</p>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300">Advanced habit analytics</p>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300">Custom habit categories</p>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300">Priority support</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <button
        onClick={handleUpgrade}
        disabled={upgrading}
        className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {upgrading ? 'Processing...' : `Upgrade for ${PRICE_DISPLAY}`}
      </button>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
        Cancel anytime. Secure payment processing with Stripe.
      </p>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function PremiumFeatures() {
  const { user, upgradeToPremium } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    if (!user) return;
    
    setUpgrading(true);
    setError('');
    
    try {
      await upgradeToPremium();
      // Success message would typically be shown here
    } catch (error) {
      setError('Failed to upgrade to premium. Please try again later.');
      console.error('Error upgrading to premium:', error);
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
        {upgrading ? 'Processing...' : 'Upgrade for $4.99/month'}
      </button>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
        Cancel anytime. Secure payment processing.
      </p>
    </div>
  );
} 
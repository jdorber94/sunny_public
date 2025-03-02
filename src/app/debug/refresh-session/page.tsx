'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function RefreshSessionPage() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      toast.success('Logged out successfully. Please log back in to refresh your session.');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Refresh Session</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Refresh Your Session</h2>
        
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          If you've recently updated your premium status but don't see the changes reflected in the app,
          you may need to refresh your session by logging out and logging back in.
        </p>
        
        {user ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You are currently logged in as <strong>{user.email}</strong>
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Premium Status: <strong>{user.isPremium ? 'Premium' : 'Not Premium'}</strong>
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              disabled={loading}
              className={`w-full px-4 py-2 text-white rounded-md shadow-sm ${
                loading
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Logging out...' : 'Log Out to Refresh Session'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You are currently logged out. Please log in to continue.
              </p>
            </div>
            
            <Link
              href="/login"
              className="block w-full px-4 py-2 text-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Why Refresh Your Session?</h2>
        
        <p className="text-gray-700 dark:text-gray-300">
          When you update your premium status in the database, your current session might still be using
          the old data. Logging out and logging back in forces the app to fetch your latest user data,
          including your premium status.
        </p>
        
        <div className="mt-4 space-y-2">
          <h3 className="font-medium text-gray-800 dark:text-white">Steps to refresh your session:</h3>
          <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-1 pl-4">
            <li>Click the "Log Out to Refresh Session" button above</li>
            <li>Wait for the logout process to complete</li>
            <li>Log back in with your credentials</li>
            <li>Your session will now have the latest data</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 
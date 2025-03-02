'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function DebugPage() {
  const { user } = useAuth();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDebugProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('Please enter a user ID');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/debug-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to debug profile');
      }
    } catch (error) {
      console.error('Error debugging profile:', error);
      toast.error('An error occurred while debugging profile');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill current user ID if logged in
  const fillCurrentUser = () => {
    if (user) {
      setUserId(user.uid);
    } else {
      toast.error('You are not logged in');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Debug User Profile</h2>
        
        <form onSubmit={handleDebugProfile} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User ID
            </label>
            <div className="flex">
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Firebase User ID"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={fillCurrentUser}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Use My ID
              </button>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 text-white rounded-md shadow-sm ${
                loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Processing...' : 'Debug Profile'}
            </button>
          </div>
        </form>
        
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Note:</strong> This tool will create a user profile if it doesn't exist and ensure the isPremium field is set to true.
          </p>
        </div>
      </div>
      
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Current User Info</h2>
        
        {user ? (
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Premium Status:</strong> {user.isPremium ? 'Premium' : 'Not Premium'}</p>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">You are not logged in.</p>
        )}
      </div>
    </div>
  );
} 
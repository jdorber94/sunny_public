'use client';

import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function TestPage() {
  const [message, setMessage] = useState<string>('Testing Firebase connection...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testFirebase = async () => {
      try {
        // Test Firestore
        const testCollection = collection(db, 'test');
        await getDocs(testCollection);
        setMessage('Firebase connection successful!');
      } catch (err) {
        console.error('Firebase test error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testFirebase();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p className={`${error ? 'text-red-500' : 'text-green-500'} font-medium`}>
          {error ? `Error: ${error}` : message}
        </p>
      </div>
      
      <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Auth Status</h2>
        <p>
          {auth.currentUser 
            ? `Logged in as: ${auth.currentUser.email}` 
            : 'Not logged in'}
        </p>
      </div>
    </div>
  );
} 
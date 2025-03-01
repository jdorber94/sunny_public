'use client';

import { Suspense } from 'react';
import PremiumFeatures from '@/components/PremiumFeatures';

function PremiumLoading() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">
        Premium Features
      </h1>
      <div className="max-w-md mx-auto">
        <Suspense fallback={<PremiumLoading />}>
          <PremiumFeatures />
        </Suspense>
      </div>
    </div>
  );
} 
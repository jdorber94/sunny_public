'use client';

import dynamic from 'next/dynamic';

const HabitTracker = dynamic(() => import('@/components/HabitTracker'), {
  ssr: false
});

export default function Page() {
  return <HabitTracker />;
} 
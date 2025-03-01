import PremiumFeatures from '@/components/PremiumFeatures';

export const metadata = {
  title: 'Premium Features - Quest Master',
  description: 'Upgrade to premium to unlock all features of Quest Master',
};

export default function PremiumPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">
        Premium Features
      </h1>
      <div className="max-w-md mx-auto">
        <PremiumFeatures />
      </div>
    </div>
  );
} 
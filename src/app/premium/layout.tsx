import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Premium Features - Quest Master',
  description: 'Upgrade to premium to unlock all features of Quest Master',
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 
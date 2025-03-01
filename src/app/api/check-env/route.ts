import { NextResponse } from 'next/server';

export async function GET() {
  // Only check if variables exist, don't return their actual values for security
  const envStatus = {
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID: !!process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
  };
  
  // For debugging, show the first few characters of the secret key
  // (only in development, remove this in production)
  const secretKeyPrefix = process.env.STRIPE_SECRET_KEY 
    ? `${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...` 
    : 'not set';
  
  return NextResponse.json({
    envStatus,
    secretKeyPrefix,
    nodeEnv: process.env.NODE_ENV,
  });
} 
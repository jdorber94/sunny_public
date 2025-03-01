import { loadStripe } from '@stripe/stripe-js';

// Load the Stripe publishable key from environment variables
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

// Product price ID for the premium subscription
export const PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID as string; 
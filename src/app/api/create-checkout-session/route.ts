import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PREMIUM_PRICE_ID } from '@/lib/stripe';

// Initialize Stripe with the secret key
// Use a function to initialize Stripe only when the route is called
const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing Stripe secret key');
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16' as any, // Type assertion to avoid version mismatch
  });
};

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }
    
    // Log environment variables (be careful not to log the full secret key in production)
    console.log('App URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('Price ID available:', !!process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID);
    console.log('Price ID from import:', PREMIUM_PRICE_ID);
    
    // Get Stripe instance only when needed
    const stripe = getStripeInstance();
    
    if (!PREMIUM_PRICE_ID) {
      throw new Error('Missing Stripe premium price ID');
    }
    
    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com'}/premium?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com'}/premium?canceled=true`,
      customer_email: email,
      client_reference_id: userId, // Store the user ID for reference
      metadata: {
        userId: userId,
        product: 'Quest Master Premium',
      },
      // Add custom information about the subscription
      subscription_data: {
        metadata: {
          userId: userId,
          product: 'Quest Master Premium',
        },
        description: 'Quest Master Premium Subscription',
      },
    });
    
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    );
  }
} 
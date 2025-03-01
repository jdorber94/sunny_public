import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getUserProfile, saveUserProfile } from '@/lib/firestoreService';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

// This is your Stripe webhook secret for testing your endpoint locally
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get the user ID from the metadata
      const userId = session.metadata?.userId;
      
      if (userId) {
        try {
          // Get the user's profile
          const userProfile = await getUserProfile(userId);
          
          if (userProfile) {
            // Update the profile with premium status
            userProfile.isPremium = true;
            
            // Save the updated profile
            await saveUserProfile(userId, userProfile);
            console.log(`User ${userId} upgraded to premium successfully`);
          }
        } catch (error) {
          console.error('Error updating user profile:', error);
        }
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Handle subscription cancellation
      // You would need to look up which user this subscription belongs to
      // This would require storing the subscription ID in your database
      console.log('Subscription canceled:', subscription.id);
      break;
    }
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 
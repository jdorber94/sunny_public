This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Stripe Integration

This project uses Stripe for handling premium subscription payments. To set up Stripe:

1. Create a [Stripe account](https://stripe.com) if you don't have one
2. In the Stripe Dashboard, create a product for your premium subscription
3. Create a recurring price for the product (e.g., $4.99/month)
4. Copy the price ID and add it to your `.env.local` file as `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`
5. Get your publishable key and secret key from the Stripe Dashboard
6. Add them to your `.env.local` file as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`

### Setting up Stripe Webhooks

To handle subscription events (like successful payments or cancellations):

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run `stripe login` to authenticate
3. Run `stripe listen --forward-to localhost:3000/api/webhook` to forward events to your local webhook endpoint
4. Copy the webhook signing secret and add it to your `.env.local` file as `STRIPE_WEBHOOK_SECRET`

For production, set up a webhook endpoint in the Stripe Dashboard pointing to your deployed webhook URL.

## Environment Variables

Copy the `.env.local.example` file to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

Required environment variables:
- Firebase configuration
- Stripe API keys
- Stripe webhook secret
- Stripe premium price ID
- App URL

# Setting Up Environment Variables in Vercel

The error `Missing Stripe secret key` indicates that your Stripe environment variables are not properly set up in your Vercel deployment. Follow these steps to fix it:

## Steps to Add Environment Variables in Vercel

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on "Settings" in the top navigation
4. Select "Environment Variables" from the left sidebar
5. Add each of the following environment variables from your local `.env.local` file:

| Name | Description |
|------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL (e.g., `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (starts with `pk_`) |
| `STRIPE_SECRET_KEY` | Your Stripe secret key (starts with `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret (starts with `whsec_`) |
| `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID` | Your Stripe premium price ID (starts with `price_`) |

6. Click "Save" after adding each variable
7. After adding all variables, redeploy your application by going to the "Deployments" tab and clicking "Redeploy" on your latest deployment

## Verifying Environment Variables

After deployment, visit `/api/check-env` on your Vercel deployment to verify that all environment variables are properly set. You should see a JSON response showing which variables are available.

## Troubleshooting

If you're still having issues after setting up the environment variables:

1. Make sure there are no typos in the variable names
2. Check that the values are correctly copied from your `.env.local` file
3. Ensure you've redeployed the application after adding the variables
4. Check the Vercel deployment logs for any errors

## Note on Stripe Keys

Make sure you're using the correct keys for your Stripe account. If you're using test mode in Stripe, you should use test keys instead of live keys. You can find your API keys in the Stripe Dashboard under Developers > API keys. 
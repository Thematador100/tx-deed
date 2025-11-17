# 💳 Stripe Configuration Guide

This guide walks you through setting up Stripe payment processing for Win With Deeds.

---

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to Stripe Dashboard
- Admin access to Win With Deeds codebase

---

## Step 1: Create Products in Stripe

### 1.1 Access Stripe Dashboard

1. Log in to https://dashboard.stripe.com
2. Navigate to **Products** in the left sidebar

### 1.2 Create Pro Investor Product

1. Click **"+ Add product"**
2. Fill in the details:
   - **Name**: Pro Investor
   - **Description**: For active investors who need the core toolset. Full Access to Property Database, Basic AI Deal Analysis, Buyer-Match Graph (10 searches/mo), Standard Support
   - **Pricing**: Recurring
   - **Price**: $99.00 USD
   - **Billing period**: Monthly
   - **Currency**: USD
3. Click **"Save product"**
4. **Copy the Price ID** (it will look like `price_1P5qYgR...`)

### 1.3 Create Mentee Elite Product

1. Click **"+ Add product"** again
2. Fill in the details:
   - **Name**: Mentee Elite
   - **Description**: For dedicated mentees seeking an unfair advantage. Everything in Pro Investor, AI Dispo Copilot, Deal Rescue Engine, Exclusive Webinars, Direct Q&A with Mentors, Scout Agent Access, Priority Support
   - **Pricing**: Recurring
   - **Price**: $299.00 USD
   - **Billing period**: Monthly
   - **Currency**: USD
3. Click **"Save product"**
4. **Copy the Price ID** (it will look like `price_1P5qZgR...`)

---

## Step 2: Get Your Stripe API Keys

### 2.1 Navigate to API Keys

1. In Stripe Dashboard, click **Developers** in the left sidebar
2. Click **API keys**

### 2.2 Copy Publishable Key

1. Find the **Publishable key** section
2. Click **"Reveal test key"** (for testing) or **"Reveal live key"** (for production)
3. Copy the key (it will start with `pk_test_` or `pk_live_`)

### 2.3 Set Up Environment Variable

1. Open your `.env` file in the project root
2. Add or update:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   ```
3. For production, use your live key:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key_here
   ```

---

## Step 3: Update Price IDs in Code

### 3.1 Open Membership Page

Navigate to: `src/pages/Membership.jsx`

### 3.2 Update Pro Investor Price ID

Find line 58 and replace the placeholder:

```javascript
// OLD (line 58)
priceId: 'price_1P5qYgRxxxxxxxxxxxxxxxxx',

// NEW
priceId: 'price_YOUR_ACTUAL_PRO_INVESTOR_PRICE_ID',
```

### 3.3 Update Mentee Elite Price ID

Find line 72 and replace the placeholder:

```javascript
// OLD (line 72)
priceId: 'price_1P5qZgRxxxxxxxxxxxxxxxxx',

// NEW
priceId: 'price_YOUR_ACTUAL_MENTEE_ELITE_PRICE_ID',
```

### 3.4 Save the File

---

## Step 4: Set Up Webhook (Optional but Recommended)

Webhooks allow Stripe to notify your application about payment events.

### 4.1 Create Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **"+ Add endpoint"**
3. Enter your endpoint URL (e.g., `https://yourdomain.com/api/stripe-webhook`)
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4.2 Get Webhook Secret

1. After creating the webhook, copy the **Signing secret** (starts with `whsec_`)
2. Store it securely (you'll need it for webhook verification)

### 4.3 Create Supabase Function for Webhook

Create a new Supabase Edge Function to handle Stripe webhooks:

```javascript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret!)

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        break
      case 'customer.subscription.updated':
        // Handle subscription changes
        break
      // ... handle other events
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    })
  }
})
```

---

## Step 5: Test the Payment Flow

### 5.1 Use Test Cards

Stripe provides test card numbers for testing:

**Successful Payment:**
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

**Failed Payment:**
- Card number: `4000 0000 0000 0002`
- (Card will be declined)

### 5.2 Test the Checkout Flow

1. Start your development server: `npm run dev`
2. Navigate to http://localhost:3000/membership
3. Click **"Choose Pro"** or **"Choose Elite"**
4. Use a test card to complete payment
5. Verify the transaction appears in Stripe Dashboard > Payments

### 5.3 Verify Subscription Creation

1. Check Stripe Dashboard > Customers
2. Verify the subscription was created
3. Check that the customer email matches

---

## Step 6: Switch to Production

### 6.1 Activate Your Stripe Account

1. Complete Stripe account activation
2. Provide business information
3. Connect bank account for payouts

### 6.2 Switch to Live Keys

1. Get your **live publishable key** (starts with `pk_live_`)
2. Update `.env`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
   ```
3. Update your webhook endpoint to point to production URL
4. Get the **live webhook secret** and update your Supabase function

### 6.3 Update Price IDs if Needed

If you created new products in live mode, update the price IDs in `src/pages/Membership.jsx`

---

## Step 7: Configure Supabase for Payment Tracking

### 7.1 Create Transactions Table (if not exists)

```sql
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  product_name TEXT NOT NULL,
  price_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### 7.2 Create Function to Handle Successful Payments

```sql
CREATE OR REPLACE FUNCTION handle_successful_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's role if they purchased Mentee Elite
  IF NEW.product_name = 'Mentee Elite' AND NEW.status = 'completed' THEN
    UPDATE profiles
    SET role = 'Mentee Elite'
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payment_success
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION handle_successful_payment();
```

---

## Troubleshooting

### Issue: "Stripe is not defined"

**Solution:** Ensure you've set `VITE_STRIPE_PUBLISHABLE_KEY` in your `.env` file and restarted the dev server.

### Issue: "Invalid price ID"

**Solution:** Double-check that you copied the entire price ID from Stripe Dashboard, including the `price_` prefix.

### Issue: Checkout redirects but no session

**Solution:** Check the browser console for errors. Ensure your Supabase function for creating checkout sessions is deployed and working.

### Issue: Payment succeeds but user role not updated

**Solution:** Check that the webhook is properly configured and the Supabase function is processing events correctly.

### Issue: Test mode vs Live mode confusion

**Solution:** Always use test keys (`pk_test_`, `sk_test_`) during development and live keys (`pk_live_`, `sk_live_`) in production. Never mix them.

---

## Security Best Practices

1. **Never expose Secret Key in frontend code**
   - Only use Publishable Key in frontend
   - Keep Secret Key in Supabase Edge Functions or backend only

2. **Always verify webhook signatures**
   - Use the webhook secret to validate events came from Stripe

3. **Use HTTPS in production**
   - Stripe requires HTTPS for webhooks

4. **Implement idempotency**
   - Use Stripe's idempotency keys to prevent duplicate charges

5. **Store minimal card data**
   - Never store full card numbers
   - Use Stripe's Customer and PaymentMethod APIs

6. **Enable Stripe Radar**
   - Automatically blocks fraudulent payments
   - Available in Stripe Dashboard > Radar

7. **Set up alerts**
   - Configure email alerts for failed payments
   - Monitor subscription churn

---

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Quickstart](https://stripe.com/docs/checkout/quickstart)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Supabase + Stripe Integration](https://supabase.com/docs/guides/integrations/stripe)

---

## Support

If you encounter issues with Stripe integration:

1. Check Stripe Dashboard > Developers > Logs for API errors
2. Review browser console for frontend errors
3. Check Supabase Edge Function logs
4. Contact Stripe Support: https://support.stripe.com

---

**Last Updated:** 2025-11-17
**Version:** 1.0.0

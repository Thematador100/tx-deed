// Stripe Webhook Handler
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe not configured', { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);

    console.log('Webhook event:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update transaction status
        await supabaseClient
          .from('transactions')
          .update({ status: 'completed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await supabaseClient
          .from('transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by Stripe customer ID
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Determine membership tier from subscription
          const priceId = subscription.items.data[0]?.price.id;
          let membershipTier = 'basic';

          // Map price IDs to tiers (these should match your Stripe price IDs)
          const priceTierMap: Record<string, string> = {
            'price_basic': 'basic',
            'price_pro': 'pro',
            'price_elite': 'elite',
          };

          membershipTier = priceTierMap[priceId] || 'basic';

          // Update user profile
          await supabaseClient
            .from('profiles')
            .update({
              membership_tier: membershipTier,
              subscription_status: subscription.status,
            })
            .eq('id', profile.id);

          // Create transaction record
          await supabaseClient
            .from('transactions')
            .insert({
              user_id: profile.id,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customerId,
              amount: subscription.items.data[0]?.price.unit_amount / 100,
              status: 'completed',
              product_type: 'subscription',
              product_name: `${membershipTier} Membership`,
              description: `Subscription to ${membershipTier} tier`,
            });

          // Send notification
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: profile.id,
              title: 'Subscription Active',
              message: `Your ${membershipTier} membership is now active!`,
              type: 'success',
            });
        }

        console.log('Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabaseClient
            .from('profiles')
            .update({
              membership_tier: 'free',
              subscription_status: 'cancelled',
            })
            .eq('id', profile.id);

          await supabaseClient
            .from('notifications')
            .insert({
              user_id: profile.id,
              title: 'Subscription Cancelled',
              message: 'Your subscription has been cancelled. You now have free tier access.',
              type: 'warning',
            });
        }

        console.log('Subscription cancelled:', subscription.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        await supabaseClient
          .from('transactions')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntentId);

        console.log('Charge refunded:', charge.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

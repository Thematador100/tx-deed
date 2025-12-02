// Create Stripe Checkout Session
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.json();
    const {
      priceId,
      priceData,
      customerEmail,
      mode,
      transactionId,
    } = body;

    // Build success and cancel URLs
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const successUrl = `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout?canceled=true`;

    // Create checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: mode as 'payment' | 'subscription',
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        transactionId: transactionId || '',
      },
    };

    // Add line items based on whether we have a priceId or priceData
    if (priceId) {
      // For subscriptions with existing price IDs
      sessionParams.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    } else if (priceData) {
      // For one-time payments with custom price data
      sessionParams.line_items = [
        {
          price_data: priceData,
          quantity: 1,
        },
      ];
    } else {
      throw new Error('Either priceId or priceData must be provided');
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

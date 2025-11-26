// Marketplace Lead Purchase Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lead_id, payment_method_id } = await req.json();

    if (!lead_id || !payment_method_id) {
      return new Response(
        JSON.stringify({ error: 'lead_id and payment_method_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the lead
    const { data: lead, error: leadError } = await supabaseClient
      .from('marketplace_leads')
      .select('*, seller:seller_id(id, email, full_name)')
      .eq('id', lead_id)
      .eq('status', 'active')
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found or no longer available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lead.seller_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'You cannot purchase your own lead' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Stripe key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get or create Stripe customer
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Calculate platform fee (10%)
    const platformFee = Math.round(lead.price * 0.10 * 100); // Convert to cents
    const sellerAmount = Math.round(lead.price * 0.90 * 100);
    const totalAmount = Math.round(lead.price * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      customer: customerId,
      payment_method: payment_method_id,
      confirm: true,
      metadata: {
        lead_id: lead.id,
        buyer_id: user.id,
        seller_id: lead.seller_id,
        platform_fee: platformFee.toString(),
      },
      description: `Purchase of lead: ${lead.title}`,
    });

    if (paymentIntent.status === 'succeeded') {
      // Update lead status
      await supabaseClient
        .from('marketplace_leads')
        .update({
          status: 'sold',
          sold_to_user_id: user.id,
          sold_at: new Date().toISOString(),
        })
        .eq('id', lead_id);

      // Create transaction record
      await supabaseClient
        .from('transactions')
        .insert({
          user_id: user.id,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_customer_id: customerId,
          amount: lead.price,
          status: 'completed',
          product_type: 'lead_purchase',
          product_name: lead.title,
          product_id: lead.id,
          description: `Purchased marketplace lead: ${lead.title}`,
          metadata: {
            seller_id: lead.seller_id,
            platform_fee: platformFee / 100,
            seller_amount: sellerAmount / 100,
          },
        });

      // Create notification for seller
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: lead.seller_id,
          title: 'Lead Sold!',
          message: `Your lead "${lead.title}" has been sold for $${lead.price}`,
          type: 'success',
          action_url: '/lead-marketplace',
          action_label: 'View Marketplace',
        });

      // Create notification for buyer
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Lead Purchased',
          message: `You successfully purchased "${lead.title}"`,
          type: 'success',
          action_url: `/property/${lead.property_id}`,
          action_label: 'View Property',
        });

      return new Response(
        JSON.stringify({
          success: true,
          payment_intent_id: paymentIntent.id,
          lead_id: lead.id,
          amount: lead.price,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: 'Payment failed',
          status: paymentIntent.status,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing purchase:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

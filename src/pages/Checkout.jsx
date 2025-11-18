import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Lock } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { tier, invoice } = location.state || {};

  useEffect(() => {
    if (!tier && !invoice) {
      toast({
        title: "No item selected",
        description: "Please select a plan or item to purchase.",
        variant: "destructive",
      });
      navigate('/membership');
    }
  }, [tier, invoice, navigate]);

  const handleCheckout = async () => {
    setLoading(true);
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to complete a purchase.",
        variant: "destructive",
      });
      setLoading(false);
      navigate('/login', { state: { from: location } });
      return;
    }

    let checkoutPayload;
    if (tier) {
      checkoutPayload = {
        priceId: tier.priceId,
        customerEmail: user.email,
        mode: 'subscription',
        productName: tier.name,
        amount: parseFloat(tier.price.replace('$', '')),
      };
    } else if (invoice) {
      checkoutPayload = {
        priceData: {
          currency: 'usd',
          product_data: {
            name: invoice.description,
          },
          unit_amount: Math.round(invoice.amount * 100), // Stripe expects cents
        },
        customerEmail: user.email,
        mode: 'payment',
        productName: invoice.description,
        amount: invoice.amount,
        invoiceId: invoice.id,
      };
    }

    // Create a transaction/invoice record in your database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        product_name: checkoutPayload.productName,
        amount: checkoutPayload.amount,
        status: 'pending',
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      toast({ title: "Checkout Error", description: "Could not initiate the transaction.", variant: "destructive" });
      setLoading(false);
      return;
    }
    
    checkoutPayload.transactionId = transaction.id;

    // Create a Stripe Checkout session via a Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: JSON.stringify(checkoutPayload),
    });

    if (error || !data.id) {
      console.error('Stripe function error:', error);
      toast({ title: "Checkout Error", description: "Could not connect to our payment processor.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.id });

    if (stripeError) {
      console.error('Stripe redirect error:', stripeError);
      toast({ title: "Payment Error", description: stripeError.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const item = tier || invoice;
  const itemName = tier ? `${tier.name} Plan` : invoice?.description;
  const itemPrice = tier ? tier.price : `$${Number(invoice?.amount).toFixed(2)}`;
  const priceSuffix = tier ? '/mo' : '';

  if (!item) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Checkout - Win With Deeds</title>
        <meta name="description" content="Complete your purchase for Win With Deeds." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg border border-slate-200"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-4 text-center">Complete Your Purchase</h1>
          <p className="text-slate-600 mb-8 text-center">You're one step away from unlocking your new toolkit.</p>

          <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Order Summary</h2>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 text-lg">{itemName}</span>
              <span className="text-2xl font-extrabold text-slate-900">{itemPrice}<span className="text-base font-medium text-slate-500">{priceSuffix}</span></span>
            </div>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            size="lg"
            className="w-full text-lg py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
            {loading ? 'Processing...' : 'Proceed to Secure Payment'}
          </Button>
          <p className="text-xs text-slate-500 mt-4 text-center">
            You will be redirected to Stripe, our secure payment partner, to complete your purchase.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
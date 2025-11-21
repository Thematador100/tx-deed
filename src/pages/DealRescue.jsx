import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Upload, RefreshCw, DollarSign, MessageSquare, FileWarning } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const DealRescue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (error) {
        console.error("Error fetching invoices:", error);
      } else {
        setInvoices(data);
      }
    };
    fetchInvoices();
  }, [user]);

  const handleAction = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const handlePayInvoice = (invoice) => {
    navigate('/checkout', { state: { invoice } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Deal Rescue Engine - TaxDeeds Pro</title>
        <meta name="description" content="Upload your stalled deals and get a new buyer set, revised pricing, and objection-handling scripts to revive them." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center">
            <RefreshCw className="w-10 h-10 mr-3 text-red-600" /> Deal Rescue Engine
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl">
            Don't let a stalled deal cost you time and money. Our AI-powered Deal Rescue Engine provides a fresh perspective, new buyer connections, and strategic insights to get your properties back on track.
          </p>

          {invoices.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl mb-8">
              <h3 className="font-bold text-lg flex items-center mb-2"><FileWarning className="w-5 h-5 mr-2" /> Outstanding Invoices</h3>
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center mt-2">
                  <p>{invoice.description} - <strong>${Number(invoice.amount).toFixed(2)}</strong></p>
                  <Button onClick={() => handlePayInvoice(invoice)} size="sm">Pay Now</Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-purple-600" /> Upload Stalled Deal
              </h2>
              <p className="text-slate-700">
                Simply upload the details of your underperforming or stalled property deal. Our system quickly processes the information.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-600" /> New Strategy & Pricing
              </h2>
              <p className="text-slate-700">
                Receive a revised pricing recommendation, a new set of potential buyers, and tailored objection-handling scripts to address common buyer concerns.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-blue-600" /> Actionable Insights
              </h2>
              <p className="text-slate-700">
                Get clear, actionable steps to re-engage buyers and successfully close your deal, turning potential losses into profits.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={handleAction} size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-lg px-8 py-6 shadow-lg">
              Rescue Your Deal
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default DealRescue;
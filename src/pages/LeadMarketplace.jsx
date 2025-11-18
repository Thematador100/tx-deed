import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { BadgeCheck, DollarSign, MapPin, Loader2 } from 'lucide-react';

const LeadMarketplace = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketplaceLeads = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Error fetching leads',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setLeads(data);
      }
      setLoading(false);
    };

    fetchMarketplaceLeads();
  }, []);

  const handleAction = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Lead Marketplace - Win With Deeds</title>
        <meta name="description" content="Buy and sell high-quality, vetted tax deed leads from a community of investors." />
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">Lead Marketplace</h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            A peer-to-peer marketplace for buying and selling high-quality, vetted tax deed leads.
          </p>
          <Button onClick={handleAction} size="lg" className="mt-6 bg-purple-600 hover:bg-purple-700 text-white">
            Sell a Lead
          </Button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          </div>
        ) : leads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-slate-800 flex-grow pr-4">{lead.title}</h2>
                  {lead.is_certified && (
                    <div className="flex-shrink-0 flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-semibold">
                      <BadgeCheck className="w-4 h-4 mr-1" />
                      Certified
                    </div>
                  )}
                </div>
                <p className="text-slate-600 mb-4 flex-grow">{lead.description}</p>
                <div className="flex items-center text-sm text-slate-500 mb-4">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  <span>{lead.location}</span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-baseline">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-slate-900">{Number(lead.price).toLocaleString()}</span>
                  </div>
                  <Button onClick={handleAction} variant="outline">View Details</Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">Marketplace is Empty</h2>
            <p className="text-slate-500 mt-2">Be the first to list a lead or check back soon for new opportunities.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LeadMarketplace;
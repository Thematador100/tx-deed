import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, List, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Leads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingSales = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('upcoming_sales')
        .select('*')
        .order('sale_date', { ascending: true });

      if (error) {
        toast({
          title: 'Error fetching sales',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSales(data);
      }
      setLoading(false);
    };

    fetchUpcomingSales();
  }, []);

  const handleViewDetails = (sale) => {
    // Navigate to properties page with county filter
    navigate(`/properties?county=${encodeURIComponent(sale.county)}&saleDate=${sale.sale_date}`);
  };

  const handleTrackAuction = async (sale) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to track auctions.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    // Add auction tracking to user's notifications
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'auction_reminder',
        title: `Auction Reminder: ${sale.county}`,
        message: `Tax deed auction scheduled for ${new Date(sale.sale_date).toLocaleDateString()}`,
        metadata: { sale_id: sale.id, county: sale.county, sale_date: sale.sale_date },
        is_read: false
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to track auction. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: `Now tracking ${sale.county} auction. You'll receive a reminder before the sale date.`,
        className: "bg-green-100 text-green-800"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Upcoming Auctions & Leads - Win With Deeds</title>
        <meta name="description" content="Discover upcoming tax deed auctions and lead lists from various counties." />
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">Upcoming Auctions & Leads</h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Your central hub for discovering upcoming tax deed sales and curated lead lists from counties across the nation.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          </div>
        ) : sales.length > 0 ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {sales.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-grow">
                  <h2 className="text-xl font-bold text-slate-800">{sale.county}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      <span>Sale Date: {new Date(sale.sale_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <List className="w-4 h-4 mr-1.5" />
                      <span>{sale.properties_count} Properties</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                  <Button onClick={() => handleViewDetails(sale)} variant="outline" className="w-full md:w-auto">View Details</Button>
                  <Button onClick={() => handleTrackAuction(sale)} className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto">Track Auction</Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">No Upcoming Auctions Found</h2>
            <p className="text-slate-500 mt-2">Our scout agents are always looking. Check back soon for new auction dates.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Leads;
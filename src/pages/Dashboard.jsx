import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Building2, TrendingUp, DollarSign, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Navbar from '@/components/Navbar';
import StatsCard from '@/components/StatsCard';
import PropertyCard from '@/components/PropertyCard';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { mockProperties } from '@/lib/mockData';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvestments: 0,
    successfulBids: 0,
    portfolioValue: 0,
    activeWatchlist: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Use mock data as a fallback
      setProperties(mockProperties.slice(0, 2));
      setSavedProperties(mockProperties.slice(2, 5));

      if (user) {
        // Fetch featured properties
        const { data: featuredData, error: featuredError } = await supabase
          .from('properties')
          .select('*')
          .limit(2);

        if (!featuredError && featuredData.length > 0) {
          setProperties(featuredData);
        }

        // Fetch saved properties for pipeline preview
        const { data: savedData, error: savedError } = await supabase
          .from('saved_properties')
          .select('*, properties(*)')
          .eq('user_id', user.id)
          .limit(3);

        if (!savedError && savedData.length > 0) {
          setSavedProperties(savedData.map(sp => sp.properties));
        }

        // Fetch user stats
        // Total properties in pipeline
        const { count: pipelineCount } = await supabase
          .from('saved_properties')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Count acquired properties (stage 4)
        const { data: acquiredStage } = await supabase
          .from('pipeline_stages')
          .select('id')
          .eq('name', 'Acquired')
          .single();

        let acquiredCount = 0;
        if (acquiredStage) {
          const { count } = await supabase
            .from('saved_properties')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('pipeline_stage_id', acquiredStage.id);
          acquiredCount = count || 0;
        }

        // Calculate portfolio value from acquired properties
        let totalValue = 0;
        if (acquiredStage) {
          const { data: acquiredProps } = await supabase
            .from('saved_properties')
            .select('properties(estimated_value)')
            .eq('user_id', user.id)
            .eq('pipeline_stage_id', acquiredStage.id);

          if (acquiredProps) {
            totalValue = acquiredProps.reduce((sum, item) => {
              return sum + (item.properties?.estimated_value || 0);
            }, 0);
          }
        }

        setStats({
          totalInvestments: acquiredCount,
          successfulBids: acquiredCount,
          portfolioValue: totalValue,
          activeWatchlist: pipelineCount || 0
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleViewProperty = (id) => {
    navigate(`/property/${id}`);
  };

  const userName = user?.user_metadata?.full_name || user?.email || "Guest";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>Dashboard - Win With Deeds</title>
        <meta name="description" content="Your personalized tax deed investment dashboard with property listings, market insights, and portfolio tracking." />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-slate-600">
            Here's your command center for AI-powered real estate investing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatsCard title="Total Investments" value={stats.totalInvestments.toString()} icon={Building2} color="purple" />
          <StatsCard title="Successful Bids" value={stats.successfulBids.toString()} icon={TrendingUp} color="green" />
          <StatsCard title="Portfolio Value" value={`$${stats.portfolioValue.toLocaleString()}`} icon={DollarSign} color="blue" />
          <StatsCard title="Active Watchlist" value={stats.activeWatchlist.toString()} icon={MapPin} color="orange" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Featured Properties</h2>
                <Button variant="ghost" onClick={() => navigate('/properties')} className="text-purple-600 hover:text-purple-700 font-semibold">
                  View All →
                </Button>
              </div>
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.map((property, index) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    >
                      <PropertyCard
                        property={property}
                        onViewDetails={() => handleViewProperty(property.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">My Pipeline</h2>
                <Button variant="ghost" onClick={() => navigate('/my-pipeline')} className="text-purple-600 hover:text-purple-700 font-semibold">
                  View Full Pipeline →
                </Button>
              </div>
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {savedProperties.length > 0 ? savedProperties.map((property, index) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                      className="bg-white p-4 rounded-xl shadow-md border border-slate-200 cursor-pointer hover:shadow-lg"
                      onClick={() => handleViewProperty(property.id)}
                    >
                      <p className="font-bold text-sm truncate">{property.address}</p>
                      <p className="text-xs text-slate-500">{property.deal_stage || 'Researching'}</p>
                    </motion.div>
                  )) : (
                    <p className="text-slate-500 col-span-3">You have no properties in your pipeline yet.</p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
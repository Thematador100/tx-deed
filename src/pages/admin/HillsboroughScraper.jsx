import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import AdminLayout from '@/pages/admin/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Building2, Play, RefreshCw, CheckCircle, AlertCircle, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import PropertyMap from '@/components/PropertyMap';

const HillsboroughScraper = () => {
  const [scraping, setScraping] = useState(false);
  const [scraperStatus, setScraperStatus] = useState(null);
  const [recentProperties, setRecentProperties] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    lastRun: null,
    propertiesThisWeek: 0,
    averageROI: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScraperData();
  }, []);

  const fetchScraperData = async () => {
    setLoading(true);
    try {
      // Fetch scraper agent status
      const { data: agentData } = await supabase
        .from('scout_agents')
        .select('*')
        .eq('name', 'Hillsborough County Scraper')
        .single();

      setScraperStatus(agentData);

      // Fetch recent properties from Hillsborough County
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('county', 'Hillsborough')
        .order('created_at', { ascending: false })
        .limit(20);

      setRecentProperties(properties || []);

      // Calculate stats
      if (properties) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const propertiesThisWeek = properties.filter(
          p => new Date(p.created_at) > oneWeekAgo
        ).length;

        const validROI = properties.filter(p => p.roi !== null && p.roi !== undefined);
        const averageROI = validROI.length > 0
          ? validROI.reduce((sum, p) => sum + p.roi, 0) / validROI.length
          : 0;

        setStats({
          totalProperties: properties.length,
          lastRun: agentData?.last_run_at,
          propertiesThisWeek,
          averageROI: Math.round(averageROI)
        });
      }
    } catch (error) {
      console.error('Error fetching scraper data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scraper data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runScraper = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('hillsborough-scraper', {
        method: 'POST'
      });

      if (error) throw error;

      toast({
        title: 'Scraper Completed!',
        description: `Found ${data.properties_found || 0} properties, inserted ${data.properties_inserted || 0} into database.`
      });

      // Refresh data
      await fetchScraperData();
    } catch (error) {
      console.error('Scraper error:', error);
      toast({
        title: 'Scraper Failed',
        description: error.message || 'Failed to run scraper. Please check your API keys and try again.',
        variant: 'destructive'
      });
    } finally {
      setScraping(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-md p-6 border-l-4"
      style={{ borderColor: `var(--${color}-500, #3b82f6)` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <AdminLayout>
      <Helmet>
        <title>Hillsborough County Scraper - Admin</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                Hillsborough County Scraper
              </h1>
              <p className="text-gray-600 mt-2">
                Automated property discovery for Tampa, FL tax deed auctions
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchScraperData}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={runScraper}
                disabled={scraping}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {scraping ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Scraper
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Building2}
            label="Total Properties"
            value={stats.totalProperties}
            color="blue"
          />
          <StatCard
            icon={Clock}
            label="Properties This Week"
            value={stats.propertiesThisWeek}
            color="green"
          />
          <StatCard
            icon={CheckCircle}
            label="Average ROI"
            value={`${stats.averageROI}%`}
            color="purple"
          />
          <StatCard
            icon={MapPin}
            label="Last Run"
            value={
              stats.lastRun
                ? formatDistanceToNow(new Date(stats.lastRun), { addSuffix: true })
                : 'Never'
            }
            color="orange"
          />
        </div>

        {/* Scraper Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Scraper Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Status</span>
              <span className="flex items-center gap-2">
                {scraperStatus?.status === 'completed' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-semibold">Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-600 font-semibold">Awaiting First Run</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Last Execution</span>
              <span className="font-semibold">
                {scraperStatus?.last_run_at
                  ? new Date(scraperStatus.last_run_at).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Properties Found (Last Run)</span>
              <span className="font-semibold">{scraperStatus?.properties_found || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Properties Inserted (Last Run)</span>
              <span className="font-semibold">{scraperStatus?.properties_inserted || 0}</span>
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Property Map</h2>
          <PropertyMap
            properties={recentProperties}
            height="500px"
            zoom={11}
          />
        </div>

        {/* Recent Properties Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Properties</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opening Bid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentProperties.length > 0 ? (
                  recentProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.opening_bid
                          ? `$${property.opening_bid.toLocaleString()}`
                          : property.price
                          ? `$${property.price.toLocaleString()}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.estimated_value
                          ? `$${property.estimated_value.toLocaleString()}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-semibold ${
                            property.roi > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {property.roi ? `${property.roi}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.auction_date || 'TBA'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(property.created_at), {
                          addSuffix: true
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-semibold mb-2">No Properties Found</p>
                      <p className="text-sm">Run the scraper to discover properties</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default HillsboroughScraper;

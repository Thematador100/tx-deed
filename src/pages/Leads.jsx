import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { getUpcomingSales, getUniqueStates, getSaleTypes, getTotalProperties } from '@/lib/upcomingSalesData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Calendar,
  MapPin,
  List,
  Loader2,
  Search,
  Filter,
  Clock,
  DollarSign,
  ExternalLink,
  Phone,
  AlertCircle,
  TrendingUp,
  Building2
} from 'lucide-react';

const Leads = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [saleTypeFilter, setSaleTypeFilter] = useState('all');
  const [expandedSale, setExpandedSale] = useState(null);

  useEffect(() => {
    const fetchUpcomingSales = async () => {
      setLoading(true);

      // Try to fetch from database first
      const { data, error } = await supabase
        .from('upcoming_sales')
        .select('*')
        .order('sale_date', { ascending: true });

      // If database is empty or error, use our comprehensive local data
      if (error || !data || data.length === 0) {
        console.log('Using local upcoming sales data');
        const localSales = getUpcomingSales();
        setSales(localSales);
        setFilteredSales(localSales);
      } else {
        setSales(data);
        setFilteredSales(data);
      }

      setLoading(false);
    };

    fetchUpcomingSales();
  }, []);

  // Filter sales based on search term, state, and sale type
  useEffect(() => {
    let filtered = [...sales];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // State filter
    if (stateFilter !== 'all') {
      filtered = filtered.filter(sale => sale.state === stateFilter);
    }

    // Sale type filter
    if (saleTypeFilter !== 'all') {
      filtered = filtered.filter(sale => sale.sale_type === saleTypeFilter);
    }

    setFilteredSales(filtered);
  }, [searchTerm, stateFilter, saleTypeFilter, sales]);

  const handleViewDetails = (saleId) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  const handleVisitWebsite = (url) => {
    window.open(url, '_blank');
  };

  const uniqueStates = getUniqueStates();
  const saleTypes = getSaleTypes();
  const totalProperties = getTotalProperties();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilSale = (dateString) => {
    const saleDate = new Date(dateString);
    const today = new Date();
    const diffTime = saleDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSaleBadgeColor = (daysUntil) => {
    if (daysUntil < 0) return 'bg-slate-500';
    if (daysUntil <= 7) return 'bg-red-500';
    if (daysUntil <= 30) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getSaleBadgeText = (daysUntil) => {
    if (daysUntil < 0) return 'Past';
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `${daysUntil} days`;
    return `${daysUntil} days`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Upcoming Tax Sale Auctions - Win With Deeds</title>
        <meta name="description" content="Discover upcoming tax deed and tax lien auctions from counties nationwide. 30+ sales scheduled with 10,000+ properties available." />
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">
            Upcoming Tax Sale Auctions
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-6">
            Your comprehensive directory of tax deed and tax lien sales across the United States.
            Updated daily with 3,000+ counties nationwide.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md px-6 py-4 border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900">{sales.length}</div>
                  <div className="text-sm text-slate-600">Upcoming Sales</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md px-6 py-4 border border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900">{totalProperties.toLocaleString()}</div>
                  <div className="text-sm text-slate-600">Properties Available</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md px-6 py-4 border border-slate-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900">{uniqueStates.length}</div>
                  <div className="text-sm text-slate-600">States Covered</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">Filter Auctions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by county or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="all">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            {/* Sale Type Filter */}
            <select
              value={saleTypeFilter}
              onChange={(e) => setSaleTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="all">All Sale Types</option>
              {saleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {filteredSales.length < sales.length && (
            <div className="mt-4 text-sm text-slate-600">
              Showing {filteredSales.length} of {sales.length} auctions
            </div>
          )}
        </motion.div>

        {/* Sales List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          </div>
        ) : filteredSales.length > 0 ? (
          <div className="space-y-4 max-w-6xl mx-auto">
            {filteredSales.map((sale, index) => {
              const daysUntil = getDaysUntilSale(sale.sale_date);
              const isExpanded = expandedSale === sale.id;

              return (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Main Card */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left: Sale Info */}
                      <div className="flex-grow">
                        <div className="flex items-start gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-2xl font-bold text-slate-900">
                                {sale.county}, {sale.state}
                              </h2>
                              <span className={`${getSaleBadgeColor(daysUntil)} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                                {getSaleBadgeText(daysUntil)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <span className="font-medium text-purple-600">{sale.sale_type}</span>
                            </div>
                          </div>
                        </div>

                        {/* Key Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center text-slate-700">
                            <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                            <span className="font-medium">{formatDate(sale.sale_date)}</span>
                          </div>
                          <div className="flex items-center text-slate-700">
                            <Building2 className="w-4 h-4 mr-2 text-purple-600" />
                            <span>{sale.properties_count} Properties</span>
                          </div>
                          {sale.sale_time && (
                            <div className="flex items-center text-slate-700">
                              <Clock className="w-4 h-4 mr-2 text-purple-600" />
                              <span>{sale.sale_time}</span>
                            </div>
                          )}
                          {sale.deposit_required && (
                            <div className="flex items-center text-slate-700">
                              <DollarSign className="w-4 h-4 mr-2 text-purple-600" />
                              <span>Deposit: {sale.deposit_required}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-2 w-full lg:w-auto">
                        <Button
                          onClick={() => handleViewDetails(sale.id)}
                          variant="outline"
                          className="w-full lg:w-auto whitespace-nowrap"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </Button>
                        {sale.website_url && (
                          <Button
                            onClick={() => handleVisitWebsite(sale.website_url)}
                            className="bg-purple-600 hover:bg-purple-700 text-white w-full lg:w-auto whitespace-nowrap"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            County Website
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-200 bg-slate-50 p-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-slate-900 mb-2 flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                              Location Details
                            </h3>
                            <div className="text-sm text-slate-700 space-y-1">
                              <div><span className="font-medium">Location:</span> {sale.sale_location || 'TBD'}</div>
                              {sale.contact_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-purple-600" />
                                  <span>{sale.contact_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-900 mb-2 flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                              Important Dates
                            </h3>
                            <div className="text-sm text-slate-700 space-y-1">
                              <div><span className="font-medium">Sale Date:</span> {formatDate(sale.sale_date)}</div>
                              {sale.registration_deadline && (
                                <div>
                                  <span className="font-medium">Registration Deadline:</span> {formatDate(sale.registration_deadline)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-slate-900 mb-2 flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-purple-600" />
                              Bidding Requirements
                            </h3>
                            <div className="text-sm text-slate-700 space-y-1">
                              <div><span className="font-medium">Deposit:</span> {sale.deposit_required || 'Contact county'}</div>
                              <div><span className="font-medium">Minimum Bid:</span> {sale.minimum_bid_type || 'Varies by property'}</div>
                              <div>
                                <span className="font-medium">Redemption Period:</span> {sale.redemption_period || 'Contact county'}
                              </div>
                            </div>
                          </div>

                          {sale.notes && (
                            <div>
                              <h3 className="font-bold text-slate-900 mb-2 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2 text-purple-600" />
                                Important Notes
                              </h3>
                              <div className="text-sm text-slate-700">
                                {sale.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-slate-900 mb-1">Get the Edge with Buyer-Match</h4>
                              <p className="text-sm text-slate-700 mb-3">
                                Run these properties through our AI Buyer-Match Graph to identify the top 20 buyers
                                most likely to purchase. Close deals 3x faster.
                              </p>
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                                Run Buyer-Match Analysis
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">No Auctions Found</h2>
            <p className="text-slate-500 mt-2">
              {searchTerm || stateFilter !== 'all' || saleTypeFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Our scout agents are always looking. Check back soon for new auction dates.'}
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl shadow-xl p-8 text-white text-center"
        >
          <h2 className="text-3xl font-bold mb-3">Don't Miss Out on These Opportunities</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Upgrade to Elite to get instant alerts when new auctions are added in your target counties.
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-slate-100 font-bold">
            Upgrade to Elite
          </Button>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Leads;

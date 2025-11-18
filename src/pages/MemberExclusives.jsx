import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DollarSign,
  Home,
  MapPin,
  TrendingUp,
  Heart,
  Search,
  Filter,
  Star,
  Lock,
  Sparkles,
  BadgeCheck,
  Eye,
  MessageSquare,
  Calendar
} from 'lucide-react';

const MemberExclusives = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [dealTypeFilter, setDealTypeFilter] = useState('all');
  const [favorites, setFavorites] = useState(new Set());

  const isElite = profile?.role === 'Mentee Elite' || profile?.role === 'admin';

  useEffect(() => {
    fetchListings();
    fetchFavorites();
  }, []);

  useEffect(() => {
    filterListings();
  }, [searchTerm, stateFilter, dealTypeFilter, listings]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('private_listings')
        .select('*')
        .eq('status', 'Available')
        .order('featured', { ascending: false })
        .order('listed_date', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: 'Error loading listings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('listing_favorites')
        .select('listing_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(new Set(data.map(f => f.listing_id)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const filterListings = () => {
    let filtered = [...listings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // State filter
    if (stateFilter !== 'all') {
      filtered = filtered.filter(listing => listing.state === stateFilter);
    }

    // Deal type filter
    if (dealTypeFilter !== 'all') {
      filtered = filtered.filter(listing => listing.deal_type === dealTypeFilter);
    }

    setFilteredListings(filtered);
  };

  const toggleFavorite = async (listingId) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to save favorites',
      });
      return;
    }

    const isFavorited = favorites.has(listingId);

    try {
      if (isFavorited) {
        // Remove favorite
        await supabase
          .from('listing_favorites')
          .delete()
          .eq('listing_id', listingId)
          .eq('user_id', user.id);

        setFavorites(prev => {
          const newFavs = new Set(prev);
          newFavs.delete(listingId);
          return newFavs;
        });
      } else {
        // Add favorite
        await supabase
          .from('listing_favorites')
          .insert({ listing_id: listingId, user_id: user.id });

        setFavorites(prev => new Set([...prev, listingId]));
      }

      toast({
        title: isFavorited ? 'Removed from favorites' : 'Added to favorites',
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const viewListing = async (listingId) => {
    // Track view
    try {
      await supabase.rpc('track_listing_view', {
        p_listing_id: listingId,
        p_user_id: user?.id
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }

    navigate(`/member-exclusives/${listingId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getProfit = (listing) => {
    if (listing.potential_profit) return listing.potential_profit;
    if (listing.arv && listing.asking_price && listing.rehab_estimate) {
      return listing.arv - listing.asking_price - listing.rehab_estimate;
    }
    return null;
  };

  const uniqueStates = [...new Set(listings.map(l => l.state))].sort();
  const uniqueDealTypes = [...new Set(listings.map(l => l.deal_type))].sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Helmet>
        <title>Member Exclusives - Premium Deals - Win With Deeds</title>
        <meta name="description" content="Exclusive tax deed properties available only to Win With Deeds members" />
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/50 rounded-full px-4 py-2 mb-4">
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="text-purple-200 font-medium">Members Only</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
            <Sparkles className="inline w-10 h-10 text-yellow-400 mb-2" />
            {' '}Member Exclusives{' '}
            <Sparkles className="inline w-10 h-10 text-yellow-400 mb-2" />
          </h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-6">
            Premium tax deed properties hand-picked for our members. These deals aren't available anywhere else.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4">
              <div className="text-3xl font-bold text-white">{listings.length}</div>
              <div className="text-sm text-purple-200">Exclusive Deals</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4">
              <div className="text-3xl font-bold text-green-400">
                {formatPrice(listings.reduce((sum, l) => sum + (getProfit(l) || 0), 0) / listings.length)}
              </div>
              <div className="text-sm text-purple-200">Avg Potential Profit</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4">
              <div className="text-3xl font-bold text-yellow-400">{listings.filter(l => l.featured).length}</div>
              <div className="text-sm text-purple-200">Featured Deals</div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Filter Deals</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <Input
                type="text"
                placeholder="Search city, state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-purple-300"
              />
            </div>

            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            {/* Deal Type Filter */}
            <select
              value={dealTypeFilter}
              onChange={(e) => setDealTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Deal Types</option>
              {uniqueDealTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {filteredListings.length < listings.length && (
            <div className="mt-4 text-sm text-purple-200">
              Showing {filteredListings.length} of {listings.length} properties
            </div>
          )}
        </motion.div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-purple-200 mt-4">Loading exclusive deals...</p>
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing, index) => {
              const profit = getProfit(listing);
              const isFavorited = favorites.has(listing.id);
              const isExclusive = listing.exclusive && !isElite;

              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all ${
                    isExclusive ? 'opacity-60' : ''
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-slate-700 overflow-hidden group">
                    {listing.primary_image_url ? (
                      <img
                        src={listing.primary_image_url}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-16 h-16 text-white/20" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      {listing.featured && (
                        <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                      {listing.exclusive && (
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />
                          Elite Only
                        </span>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(listing.id);
                      }}
                      className="absolute top-3 right-3 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFavorited ? 'fill-red-500 text-red-500' : 'text-white'
                        }`}
                      />
                    </button>

                    {isExclusive && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-12 h-12 text-white mx-auto mb-2" />
                          <div className="text-white font-bold">Elite Members Only</div>
                          <Button
                            size="sm"
                            className="mt-3 bg-purple-600 hover:bg-purple-700"
                            onClick={() => navigate('/membership')}
                          >
                            Upgrade to Elite
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {listing.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-purple-200 text-sm mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.city}, {listing.state}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {listing.bedrooms && listing.bedrooms > 0 && (
                        <div className="text-sm">
                          <div className="text-purple-300 text-xs">Beds/Baths</div>
                          <div className="text-white font-semibold">
                            {listing.bedrooms} / {listing.bathrooms}
                          </div>
                        </div>
                      )}
                      {listing.sqft && (
                        <div className="text-sm">
                          <div className="text-purple-300 text-xs">Square Feet</div>
                          <div className="text-white font-semibold">
                            {listing.sqft.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="bg-white/5 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-200 text-sm">Asking Price</span>
                        <span className="text-2xl font-bold text-white">
                          {formatPrice(listing.asking_price)}
                        </span>
                      </div>
                      {profit && profit > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-purple-200 text-sm">Potential Profit</span>
                          <span className="text-lg font-bold text-green-400 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {formatPrice(profit)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Deal Type */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-purple-200 text-sm">Deal Type</span>
                      <span className="bg-purple-500/20 border border-purple-400/50 text-purple-200 text-xs font-medium px-3 py-1 rounded-full">
                        {listing.deal_type}
                      </span>
                    </div>

                    {/* CTA */}
                    <Button
                      onClick={() => viewListing(listing.id)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      disabled={isExclusive}
                    >
                      View Full Details
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
            <h3 className="text-2xl font-bold text-white mb-2">No Properties Found</h3>
            <p className="text-purple-200">
              {searchTerm || stateFilter !== 'all' || dealTypeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Check back soon for new exclusive deals'}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MemberExclusives;

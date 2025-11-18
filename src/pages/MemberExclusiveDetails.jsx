import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  MapPin,
  Home,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Heart,
  Share2,
  MessageSquare,
  Phone,
  Mail,
  Bed,
  Bath,
  Maximize,
  Clock,
  Award,
  FileText,
  Send,
  Loader2
} from 'lucide-react';

const MemberExclusiveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [inquiryData, setInquiryData] = useState({
    inquiry_type: 'General Question',
    message: '',
    offer_amount: '',
    preferred_contact: 'Platform Message',
    phone_number: ''
  });

  useEffect(() => {
    fetchListing();
    checkFavorite();
    trackView();
  }, [id]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('private_listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setListing(data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast({
        title: 'Error',
        description: 'Could not load listing',
        variant: 'destructive',
      });
      navigate('/member-exclusives');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('listing_favorites')
        .select('id')
        .eq('listing_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsFavorited(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const trackView = async () => {
    try {
      await supabase.rpc('track_listing_view', {
        p_listing_id: id,
        p_user_id: user?.id
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to save favorites',
      });
      return;
    }

    try {
      if (isFavorited) {
        await supabase
          .from('listing_favorites')
          .delete()
          .eq('listing_id', id)
          .eq('user_id', user.id);

        setIsFavorited(false);
        toast({ title: 'Removed from favorites' });
      } else {
        await supabase
          .from('listing_favorites')
          .insert({ listing_id: id, user_id: user.id });

        setIsFavorited(true);
        toast({ title: 'Added to favorites' });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const submitInquiry = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to submit inquiries',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.rpc('create_listing_inquiry', {
        p_listing_id: id,
        p_inquiry_type: inquiryData.inquiry_type,
        p_message: inquiryData.message,
        p_offer_amount: inquiryData.offer_amount ? parseFloat(inquiryData.offer_amount) : null,
        p_preferred_contact: inquiryData.preferred_contact,
        p_phone_number: inquiryData.phone_number || null
      });

      if (error) throw error;

      toast({
        title: 'Inquiry Sent!',
        description: 'We\'ll get back to you within 24 hours',
      });

      setShowInquiryForm(false);
      setInquiryData({
        inquiry_type: 'General Question',
        message: '',
        offer_amount: '',
        preferred_contact: 'Platform Message',
        phone_number: ''
      });
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const shareProperty = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Check out this exclusive deal: ${listing.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied to clipboard!' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const profit = listing.potential_profit ||
    (listing.arv && listing.asking_price && listing.rehab_estimate
      ? listing.arv - listing.asking_price - listing.rehab_estimate
      : null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Helmet>
        <title>{listing.title} - Member Exclusives - Win With Deeds</title>
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/member-exclusives')}
          variant="outline"
          className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden">
              <div className="relative h-96">
                {listing.primary_image_url ? (
                  <img
                    src={listing.primary_image_url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-700">
                    <Home className="w-24 h-24 text-white/20" />
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={toggleFavorite}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        isFavorited ? 'fill-red-500 text-red-500' : 'text-white'
                      }`}
                    />
                  </button>
                  <button
                    onClick={shareProperty}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <Share2 className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Title & Location */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {listing.title}
              </h1>
              <div className="flex items-center gap-2 text-purple-200 text-lg">
                <MapPin className="w-5 h-5" />
                <span>{listing.address}, {listing.city}, {listing.state} {listing.zip_code}</span>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Property Details</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {listing.bedrooms > 0 && (
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Bed className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{listing.bedrooms}</div>
                    <div className="text-sm text-purple-200">Bedrooms</div>
                  </div>
                )}
                {listing.bathrooms > 0 && (
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Bath className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{listing.bathrooms}</div>
                    <div className="text-sm text-purple-200">Bathrooms</div>
                  </div>
                )}
                {listing.sqft > 0 && (
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Maximize className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{listing.sqft.toLocaleString()}</div>
                    <div className="text-sm text-purple-200">Sq Ft</div>
                  </div>
                )}
                {listing.year_built && (
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{listing.year_built}</div>
                    <div className="text-sm text-purple-200">Year Built</div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-purple-200">Property Type</span>
                  <span className="text-white font-semibold">{listing.property_type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-purple-200">Lot Size</span>
                  <span className="text-white font-semibold">{listing.lot_size}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-purple-200">Condition</span>
                  <span className="text-white font-semibold">{listing.property_condition}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-purple-200">Title Status</span>
                  <span className="text-white font-semibold flex items-center gap-2">
                    {listing.title_status === 'Clear' && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {listing.title_status}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-purple-200">Occupancy</span>
                  <span className="text-white font-semibold">{listing.occupancy_status}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Description</h2>
              <p className="text-purple-100 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Highlights */}
            {listing.highlights && listing.highlights.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Key Highlights</h2>
                <ul className="space-y-2">
                  {listing.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3 text-purple-100">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Deal Summary</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-sm opacity-90 mb-1">Asking Price</div>
                  <div className="text-3xl font-bold">{formatPrice(listing.asking_price)}</div>
                </div>

                {listing.arv && (
                  <div className="flex justify-between py-2 border-t border-white/20">
                    <span className="text-sm">ARV</span>
                    <span className="font-semibold">{formatPrice(listing.arv)}</span>
                  </div>
                )}

                {listing.rehab_estimate && (
                  <div className="flex justify-between py-2 border-t border-white/20">
                    <span className="text-sm">Est. Rehab</span>
                    <span className="font-semibold">{formatPrice(listing.rehab_estimate)}</span>
                  </div>
                )}

                {profit && profit > 0 && (
                  <div className="flex justify-between py-2 border-t border-white/20">
                    <span className="text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Potential Profit
                    </span>
                    <span className="font-bold text-yellow-300 text-xl">
                      {formatPrice(profit)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-t border-white/20">
                  <span className="text-sm">Deal Type</span>
                  <span className="font-semibold">{listing.deal_type}</span>
                </div>

                {listing.assignment_fee && (
                  <div className="flex justify-between py-2 border-t border-white/20">
                    <span className="text-sm">Assignment Fee</span>
                    <span className="font-semibold">{formatPrice(listing.assignment_fee)}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setShowInquiryForm(!showInquiryForm)}
                className="w-full bg-white text-purple-600 hover:bg-slate-100 font-bold"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {showInquiryForm ? 'Hide Form' : 'Inquire Now'}
              </Button>
            </div>

            {/* Inquiry Form */}
            {showInquiryForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Send Inquiry</h3>

                <form onSubmit={submitInquiry} className="space-y-4">
                  <div>
                    <label className="text-purple-200 text-sm mb-2 block">Inquiry Type</label>
                    <select
                      value={inquiryData.inquiry_type}
                      onChange={(e) => setInquiryData({ ...inquiryData, inquiry_type: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white"
                      required
                    >
                      <option value="General Question">General Question</option>
                      <option value="Schedule Showing">Schedule Showing</option>
                      <option value="Make Offer">Make Offer</option>
                      <option value="Request Info">Request Info</option>
                      <option value="Partner Opportunity">Partner Opportunity</option>
                    </select>
                  </div>

                  {inquiryData.inquiry_type === 'Make Offer' && (
                    <div>
                      <label className="text-purple-200 text-sm mb-2 block">Offer Amount</label>
                      <Input
                        type="number"
                        placeholder="Enter your offer"
                        value={inquiryData.offer_amount}
                        onChange={(e) => setInquiryData({ ...inquiryData, offer_amount: e.target.value })}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-purple-200 text-sm mb-2 block">Message</label>
                    <Textarea
                      placeholder="Tell us about your interest..."
                      value={inquiryData.message}
                      onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                      className="bg-white/5 border-white/20 text-white min-h-[100px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-purple-200 text-sm mb-2 block">Preferred Contact</label>
                    <select
                      value={inquiryData.preferred_contact}
                      onChange={(e) => setInquiryData({ ...inquiryData, preferred_contact: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white"
                    >
                      <option value="Platform Message">Platform Message</option>
                      <option value="Email">Email</option>
                      <option value="Phone">Phone</option>
                    </select>
                  </div>

                  {inquiryData.preferred_contact === 'Phone' && (
                    <div>
                      <label className="text-purple-200 text-sm mb-2 block">Phone Number</label>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={inquiryData.phone_number}
                        onChange={(e) => setInquiryData({ ...inquiryData, phone_number: e.target.value })}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Inquiry
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MemberExclusiveDetails;

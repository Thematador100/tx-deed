import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  DollarSign,
  Home,
  X,
  Check,
  Star,
  Lock,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AdminPrivateListings = () => {
  const [listings, setListings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showInquiries, setShowInquiries] = useState(false);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalInquiries: 0,
    totalViews: 0,
    avgPrice: 0
  });

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    city: '',
    state: '',
    county: '',
    property_type: 'Single Family',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    year_built: '',
    lot_size: '',
    asking_price: '',
    acquisition_cost: '',
    arv: '',
    rehab_estimate: '',
    potential_profit: '',
    deal_type: 'Wholesale',
    status: 'Available',
    featured: false,
    exclusive: false,
    primary_image_url: '',
    image_urls: '',
    description: '',
    highlights: '',
    property_condition: '',
    title_status: '',
    utilities_status: '',
    occupancy_status: '',
    zoning: ''
  });

  useEffect(() => {
    fetchListings();
    fetchInquiries();
    fetchStats();
  }, []);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('private_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: 'Error Loading Listings',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    setListings(data || []);
  };

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from('listing_inquiries')
      .select(`
        *,
        listing:private_listings(title, address),
        user:profiles(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inquiries:', error);
      return;
    }

    setInquiries(data || []);
  };

  const fetchStats = async () => {
    // Get listing stats
    const { data: listingData } = await supabase
      .from('private_listings')
      .select('*');

    // Get inquiry count
    const { count: inquiryCount } = await supabase
      .from('listing_inquiries')
      .select('*', { count: 'exact', head: true });

    // Get view count
    const { count: viewCount } = await supabase
      .from('listing_views')
      .select('*', { count: 'exact', head: true });

    const totalListings = listingData?.length || 0;
    const activeListings = listingData?.filter(l => l.status === 'Available').length || 0;
    const avgPrice = totalListings > 0
      ? listingData.reduce((sum, l) => sum + (parseFloat(l.asking_price) || 0), 0) / totalListings
      : 0;

    setStats({
      totalListings,
      activeListings,
      totalInquiries: inquiryCount || 0,
      totalViews: viewCount || 0,
      avgPrice
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Calculate potential profit if not manually set
    const askingPrice = parseFloat(formData.asking_price) || 0;
    const arv = parseFloat(formData.arv) || 0;
    const rehabEstimate = parseFloat(formData.rehab_estimate) || 0;
    const calculatedProfit = arv - askingPrice - rehabEstimate;

    const listingData = {
      ...formData,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
      sqft: formData.sqft ? parseInt(formData.sqft) : null,
      year_built: formData.year_built ? parseInt(formData.year_built) : null,
      lot_size: formData.lot_size || null,
      asking_price: askingPrice,
      acquisition_cost: formData.acquisition_cost ? parseFloat(formData.acquisition_cost) : null,
      arv: arv || null,
      rehab_estimate: rehabEstimate || null,
      potential_profit: formData.potential_profit ? parseFloat(formData.potential_profit) : calculatedProfit,
      image_urls: formData.image_urls ? formData.image_urls.split(',').map(url => url.trim()) : [],
      highlights: formData.highlights ? formData.highlights.split('\n').filter(h => h.trim()) : []
    };

    try {
      if (editingListing) {
        // Update existing listing
        const { error } = await supabase
          .from('private_listings')
          .update(listingData)
          .eq('id', editingListing.id);

        if (error) throw error;

        toast({
          title: 'Listing Updated',
          description: 'Your listing has been updated successfully.'
        });
      } else {
        // Create new listing
        const { error } = await supabase
          .from('private_listings')
          .insert([listingData]);

        if (error) throw error;

        toast({
          title: 'Listing Created',
          description: 'Your new listing has been created successfully.'
        });
      }

      // Reset form and refresh
      setShowForm(false);
      setEditingListing(null);
      setFormData({
        title: '',
        address: '',
        city: '',
        state: '',
        county: '',
        property_type: 'Single Family',
        bedrooms: '',
        bathrooms: '',
        sqft: '',
        year_built: '',
        lot_size: '',
        asking_price: '',
        acquisition_cost: '',
        arv: '',
        rehab_estimate: '',
        potential_profit: '',
        deal_type: 'Wholesale',
        status: 'Available',
        featured: false,
        exclusive: false,
        primary_image_url: '',
        image_urls: '',
        description: '',
        highlights: '',
        property_condition: '',
        title_status: '',
        utilities_status: '',
        occupancy_status: '',
        zoning: ''
      });
      fetchListings();
      fetchStats();
    } catch (error) {
      console.error('Error saving listing:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setFormData({
      title: listing.title || '',
      address: listing.address || '',
      city: listing.city || '',
      state: listing.state || '',
      county: listing.county || '',
      property_type: listing.property_type || 'Single Family',
      bedrooms: listing.bedrooms || '',
      bathrooms: listing.bathrooms || '',
      sqft: listing.sqft || '',
      year_built: listing.year_built || '',
      lot_size: listing.lot_size || '',
      asking_price: listing.asking_price || '',
      acquisition_cost: listing.acquisition_cost || '',
      arv: listing.arv || '',
      rehab_estimate: listing.rehab_estimate || '',
      potential_profit: listing.potential_profit || '',
      deal_type: listing.deal_type || 'Wholesale',
      status: listing.status || 'Available',
      featured: listing.featured || false,
      exclusive: listing.exclusive || false,
      primary_image_url: listing.primary_image_url || '',
      image_urls: Array.isArray(listing.image_urls) ? listing.image_urls.join(', ') : '',
      description: listing.description || '',
      highlights: Array.isArray(listing.highlights) ? listing.highlights.join('\n') : '',
      property_condition: listing.property_condition || '',
      title_status: listing.title_status || '',
      utilities_status: listing.utilities_status || '',
      occupancy_status: listing.occupancy_status || '',
      zoning: listing.zoning || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const { error } = await supabase
      .from('private_listings')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Listing Deleted',
      description: 'The listing has been removed.'
    });

    fetchListings();
    fetchStats();
  };

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase
      .from('private_listings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Status Updated',
      description: `Listing marked as ${newStatus}`
    });

    fetchListings();
    fetchStats();
  };

  const viewInquiries = (listing) => {
    setSelectedListing(listing);
    setShowInquiries(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Under Contract':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Removed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const listingInquiries = selectedListing
    ? inquiries.filter(inq => inq.listing_id === selectedListing.id)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Helmet>
        <title>Private Listings - Admin - Win With Deeds</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Private Listings Management
            </h1>
            <p className="text-slate-600">
              Manage your exclusive property listings for members
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingListing(null);
              setShowForm(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Listing
          </Button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Home className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalListings}</div>
            <div className="text-sm text-slate-600">Total Listings</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.activeListings}</div>
            <div className="text-sm text-slate-600">Active Listings</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalInquiries}</div>
            <div className="text-sm text-slate-600">Total Inquiries</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalViews}</div>
            <div className="text-sm text-slate-600">Total Views</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ${stats.avgPrice.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">Avg Price</div>
          </div>
        </div>

        {/* Listings Table */}
        {!showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {listing.primary_image_url && (
                            <img
                              src={listing.primary_image_url}
                              alt={listing.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-slate-900">{listing.title}</div>
                            <div className="text-sm text-slate-500">{listing.property_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{listing.city}, {listing.state}</div>
                        <div className="text-xs text-slate-500">{listing.county}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          ${listing.asking_price?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-green-600">
                          ${listing.potential_profit?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={listing.status}
                          onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border ${getStatusColor(listing.status)}`}
                        >
                          <option value="Available">Available</option>
                          <option value="Under Contract">Under Contract</option>
                          <option value="Sold">Sold</option>
                          <option value="Removed">Removed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {listing.featured && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <Star className="w-3 h-3" />
                              Featured
                            </span>
                          )}
                          {listing.exclusive && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 border border-purple-200">
                              <Lock className="w-3 h-3" />
                              Elite
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 border border-blue-200">
                            {listing.deal_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewInquiries(listing)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                            title="View Inquiries"
                          >
                            <MessageSquare className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleEdit(listing)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {listings.length === 0 && (
                <div className="text-center py-12">
                  <Home className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No listings yet</h3>
                  <p className="text-slate-600 mb-4">Create your first listing to get started</p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Listing
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listing Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-lg border border-slate-200 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingListing ? 'Edit Listing' : 'Create New Listing'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingListing(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Property Title *
                      </label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Stunning Oceanfront Condo - Wholesale Deal"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Address *
                      </label>
                      <Input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="123 Main St"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        City *
                      </label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        State *
                      </label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        County *
                      </label>
                      <Input
                        name="county"
                        value={formData.county}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Property Type *
                      </label>
                      <select
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="Single Family">Single Family</option>
                        <option value="Multi-Family">Multi-Family</option>
                        <option value="Condo">Condo</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Land">Land</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bedrooms
                      </label>
                      <Input
                        type="number"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bathrooms
                      </label>
                      <Input
                        type="number"
                        step="0.5"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Square Feet
                      </label>
                      <Input
                        type="number"
                        name="sqft"
                        value={formData.sqft}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Year Built
                      </label>
                      <Input
                        type="number"
                        name="year_built"
                        value={formData.year_built}
                        onChange={handleInputChange}
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Lot Size
                      </label>
                      <Input
                        name="lot_size"
                        value={formData.lot_size}
                        onChange={handleInputChange}
                        placeholder="e.g., 0.25 acres"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Zoning
                      </label>
                      <Input
                        name="zoning"
                        value={formData.zoning}
                        onChange={handleInputChange}
                        placeholder="e.g., Residential R-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Pricing & Financials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Asking Price *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        name="asking_price"
                        value={formData.asking_price}
                        onChange={handleInputChange}
                        placeholder="150000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Acquisition Cost
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        name="acquisition_cost"
                        value={formData.acquisition_cost}
                        onChange={handleInputChange}
                        placeholder="100000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        ARV (After Repair Value)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        name="arv"
                        value={formData.arv}
                        onChange={handleInputChange}
                        placeholder="300000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Rehab Estimate
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        name="rehab_estimate"
                        value={formData.rehab_estimate}
                        onChange={handleInputChange}
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Potential Profit (auto-calculated if left empty)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        name="potential_profit"
                        value={formData.potential_profit}
                        onChange={handleInputChange}
                        placeholder="Auto-calculated"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Deal Type *
                      </label>
                      <select
                        name="deal_type"
                        value={formData.deal_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="Wholesale">Wholesale</option>
                        <option value="Assignment">Assignment</option>
                        <option value="Owned">Owned</option>
                        <option value="JV Opportunity">JV Opportunity</option>
                        <option value="Fix & Flip">Fix & Flip</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status & Conditions */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Status & Conditions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Property Condition
                      </label>
                      <Input
                        name="property_condition"
                        value={formData.property_condition}
                        onChange={handleInputChange}
                        placeholder="e.g., Needs full renovation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Title Status
                      </label>
                      <Input
                        name="title_status"
                        value={formData.title_status}
                        onChange={handleInputChange}
                        placeholder="e.g., Clear title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Utilities Status
                      </label>
                      <Input
                        name="utilities_status"
                        value={formData.utilities_status}
                        onChange={handleInputChange}
                        placeholder="e.g., All connected"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Occupancy Status
                      </label>
                      <Input
                        name="occupancy_status"
                        value={formData.occupancy_status}
                        onChange={handleInputChange}
                        placeholder="e.g., Vacant"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Listing Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Available">Available</option>
                        <option value="Under Contract">Under Contract</option>
                        <option value="Sold">Sold</option>
                        <option value="Removed">Removed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Media</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Primary Image URL
                      </label>
                      <Input
                        name="primary_image_url"
                        value={formData.primary_image_url}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Additional Images (comma-separated URLs)
                      </label>
                      <Textarea
                        name="image_urls"
                        value={formData.image_urls}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Description & Highlights</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description
                      </label>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Detailed property description..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Highlights (one per line)
                      </label>
                      <Textarea
                        name="highlights"
                        value={formData.highlights}
                        onChange={handleInputChange}
                        placeholder="Ocean views&#10;Gated community&#10;Recently renovated kitchen"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Flags */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Listing Flags</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                      />
                      <div>
                        <div className="font-medium text-slate-900">Featured Listing</div>
                        <div className="text-sm text-slate-600">Display prominently in marketplace</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="exclusive"
                        checked={formData.exclusive}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                      />
                      <div>
                        <div className="font-medium text-slate-900">Elite Members Only</div>
                        <div className="text-sm text-slate-600">Only visible to Elite tier members</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {editingListing ? 'Update Listing' : 'Create Listing'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingListing(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inquiries Modal */}
        <AnimatePresence>
          {showInquiries && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowInquiries(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Inquiries</h2>
                      <p className="text-slate-600 mt-1">{selectedListing?.title}</p>
                    </div>
                    <button
                      onClick={() => setShowInquiries(false)}
                      className="p-2 hover:bg-slate-100 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                  {listingInquiries.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No inquiries yet</h3>
                      <p className="text-slate-600">Inquiries will appear here when members express interest</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {listingInquiries.map((inquiry) => (
                        <div
                          key={inquiry.id}
                          className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-medium text-slate-900">
                                {inquiry.user?.first_name} {inquiry.user?.last_name}
                              </div>
                              <div className="text-sm text-slate-600">{inquiry.user?.email}</div>
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(inquiry.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 border border-purple-200">
                              {inquiry.inquiry_type}
                            </span>
                          </div>

                          <p className="text-slate-700 mb-3">{inquiry.message}</p>

                          {inquiry.offer_amount && (
                            <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                              <div className="text-sm text-green-900">
                                <strong>Offer Amount:</strong> ${parseFloat(inquiry.offer_amount).toLocaleString()}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div>
                              <strong>Contact via:</strong> {inquiry.preferred_contact}
                            </div>
                            {inquiry.phone_number && (
                              <div>
                                <strong>Phone:</strong> {inquiry.phone_number}
                              </div>
                            )}
                          </div>

                          {!inquiry.responded_at && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('listing_inquiries')
                                    .update({ responded_at: new Date().toISOString() })
                                    .eq('id', inquiry.id);

                                  if (!error) {
                                    toast({
                                      title: 'Marked as Responded',
                                      description: 'Follow up with the member via their preferred contact method'
                                    });
                                    fetchInquiries();
                                  }
                                }}
                              >
                                Mark as Responded
                              </Button>
                            </div>
                          )}

                          {inquiry.responded_at && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                Responded on {new Date(inquiry.responded_at).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPrivateListings;

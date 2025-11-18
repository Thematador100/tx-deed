import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Home, Edit, Trash2, Eye, EyeOff, DollarSign, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchListings();
  }, [user, navigate]);

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error",
        description: "Failed to load your listings.",
        variant: "destructive",
      });
    } else {
      setListings(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('user_listings')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Listing deleted successfully.",
      });
      fetchListings();
    }
    setDeleteId(null);
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'withdrawn' : 'active';
    const { error } = await supabase
      .from('user_listings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `Listing ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      });
      fetchListings();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500">Sold</Badge>;
      case 'withdrawn':
        return <Badge className="bg-slate-500">Withdrawn</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Helmet>
        <title>My Listings - Win With Deeds</title>
        <meta name="description" content="Manage your property listings." />
      </Helmet>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 flex items-center mb-3">
                <Home className="w-10 h-10 mr-3 text-purple-600" />
                My Listings
              </h1>
              <p className="text-lg text-slate-600">
                Manage your property listings and track performance.
              </p>
            </div>
            <Button
              onClick={() => navigate('/add-listing')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Listing
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            </div>
          ) : listings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Home className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Listings Yet</h3>
                <p className="text-slate-500 mb-6">Start by creating your first property listing.</p>
                <Button onClick={() => navigate('/add-listing')} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Listing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl flex-1 line-clamp-2">{listing.title}</CardTitle>
                        {getStatusBadge(listing.status)}
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {listing.address}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-baseline">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="text-2xl font-bold text-slate-900">
                            {Number(listing.price).toLocaleString()}
                          </span>
                        </div>
                        {listing.property_type && (
                          <p className="text-sm text-slate-600">Type: {listing.property_type}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          {listing.bedrooms && <span>{listing.bedrooms} bd</span>}
                          {listing.bathrooms && <span>{listing.bathrooms} ba</span>}
                          {listing.square_feet && <span>{listing.square_feet.toLocaleString()} sqft</span>}
                        </div>
                        <div className="text-xs text-slate-400 pt-2">
                          <Eye className="w-3 h-3 inline mr-1" />
                          {listing.views || 0} views
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusToggle(listing.id, listing.status)}
                          className="w-full"
                        >
                          {listing.status === 'active' ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(listing.id)}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your listing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default MyListings;

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Users, TrendingUp, Target, HelpCircle, Loader2, Mail, Phone, TrendingDown, Award, MapPin, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const BuyerMatch = () => {
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProps, setLoadingProps] = useState(true);
  const [propertyData, setPropertyData] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSavedProperties = async () => {
      if (!user) {
        setLoadingProps(false);
        return;
      }
      setLoadingProps(true);
      const { data, error } = await supabase
        .from('saved_properties')
        .select('id, properties(id, address, city, state, county, property_type, price)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setSavedProperties(data?.map(p => p.properties).filter(Boolean) || []);
      }
      setLoadingProps(false);
    };

    fetchSavedProperties();
  }, [user]);

  const handleFindBuyers = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast({ title: 'Please select a property', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setBuyers([]);

    try {
      const { data, error } = await supabase.functions.invoke('buyer-match', {
        body: { property_id: selectedPropertyId, limit: 20 }
      });

      if (error) throw error;

      if (data.success) {
        setBuyers(data.buyers || []);
        setPropertyData(data.property);
        toast({
          title: 'Buyer Match Complete!',
          description: data.message || `Found ${data.buyers?.length || 0} potential buyers`
        });
      } else {
        throw new Error(data.error || 'Failed to find buyers');
      }
    } catch (error) {
      console.error('Buyer match error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to match buyers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Buyer-Match Graph - TaxDeeds Pro</title>
        <meta name="description" content="Leverage AI to match your deals with the top 20 buyers in any micro-market, complete with personalized reasons." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center">
              <Users className="w-10 h-10 mr-3 text-purple-600" /> Buyer-Match Graph
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl">
              Our AI-powered Buyer-Match Graph analyzes transaction history and property features to rank the most likely buyers for your specific deal. Get personalized insights to close faster.
            </p>

            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-xl mb-8">
              <h3 className="font-bold text-lg flex items-center mb-2"><HelpCircle className="w-5 h-5 mr-2" />How to Use This Tool</h3>
              <p className="text-sm">
                <strong>1. Select Property:</strong> Choose a property from your saved deals.
                <br />
                <strong>2. Run Analysis:</strong> Our AI analyzes transaction history to find active buyers in your area.
                <br />
                <strong>3. Get Your List:</strong> Receive a ranked list of the top 20 potential buyers with match scores and contact info.
              </p>
            </div>

            <form onSubmit={handleFindBuyers} className="space-y-6">
              <div>
                <Label htmlFor="property">Select a Property from Your Pipeline</Label>
                <select
                  id="property"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="mt-2 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-lg border"
                  required
                  disabled={loadingProps}
                >
                  <option value="">
                    {loadingProps ? 'Loading properties...' : 'Choose a property...'}
                  </option>
                  {savedProperties.map(prop => (
                    <option key={prop.id} value={prop.id}>
                      {prop.address} - ${prop.price?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white"
                disabled={loading || !selectedPropertyId}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Finding Buyers...</>
                ) : (
                  <><Users className="w-5 h-5 mr-2" /> Find Top 20 Buyers</>
                )}
              </Button>
            </form>
          </div>

          {/* Results Section */}
          {buyers.length > 0 && propertyData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200"
            >
              <div className="mb-6 pb-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Top {buyers.length} Buyers for {propertyData.address}
                </h2>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center"><Home className="w-4 h-4 mr-1" /> {propertyData.property_type}</span>
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {propertyData.county}, {propertyData.state}</span>
                  <span className="font-semibold text-green-600">${propertyData.price?.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {buyers.map((buyer, index) => (
                  <motion.div
                    key={buyer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-50 p-6 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{buyer.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                            #{index + 1}
                          </span>
                          <span className="text-xs text-slate-600">
                            {buyer.purchase_count} purchases
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className={`w-5 h-5 ${
                          buyer.match_score >= 80 ? 'text-yellow-500' :
                          buyer.match_score >= 60 ? 'text-slate-400' :
                          'text-amber-700'
                        }`} />
                        <span className="text-2xl font-bold text-purple-600">{buyer.match_score}</span>
                      </div>
                    </div>

                    {buyer.ai_pitch && (
                      <div className="bg-white p-3 rounded-lg mb-4 border border-purple-100">
                        <p className="text-sm text-slate-700 italic">"{buyer.ai_pitch}"</p>
                      </div>
                    )}

                    <div className="space-y-2 text-sm mb-4">
                      {buyer.match_reasons.map((reason, i) => (
                        <div key={i} className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span className="text-slate-700">{reason}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Avg Price:</span>
                        <span className="font-semibold">${buyer.avg_purchase_price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Total Invested:</span>
                        <span className="font-semibold">${buyer.total_invested.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {buyer.email && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                          window.location.href = `mailto:${buyer.email}`;
                        }}>
                          <Mail className="w-4 h-4 mr-1" /> Email
                        </Button>
                      )}
                      {buyer.phone && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                          window.location.href = `tel:${buyer.phone}`;
                        }}>
                          <Phone className="w-4 h-4 mr-1" /> Call
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {!loading && buyers.length === 0 && selectedPropertyId && (
            <div className="bg-white p-12 rounded-2xl shadow-lg border border-slate-200 text-center">
              <TrendingDown className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Buyers Found</h3>
              <p className="text-slate-600">
                We couldn't find any strong buyer matches for this property. Try selecting a different property or build your buyer network through the marketplace.
              </p>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default BuyerMatch;
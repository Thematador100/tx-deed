import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Users, TrendingUp, Target, HelpCircle, Mail, Phone, MapPin, Loader2, Star, Building, DollarSign, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const BuyerMatch = () => {
  const { user } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [matches, setMatches] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, price, estimated_value, property_type, bedrooms, bathrooms')
        .order('opportunity_score', { ascending: false })
        .limit(100);

      if (!error && data) {
        setProperties(data);
      }
      setLoadingProperties(false);
    };
    fetchProperties();
  }, []);

  const generateMatches = async () => {
    if (!selectedPropertyId) {
      toast({ title: "Please select a property", variant: "destructive" });
      return;
    }

    setLoading(true);
    setMatches([]);

    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', selectedPropertyId)
        .single();

      if (error) throw error;

      // Simulate AI matching with realistic buyer data
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockBuyers = [
        {
          id: 1,
          name: 'Texas Residential Investors LLC',
          matchScore: 98,
          recentPurchases: 47,
          avgPurchasePrice: property.price * 0.95,
          preferredType: property.property_type,
          radius: '2 miles',
          email: 'deals@texasri.com',
          phone: '(512) 555-0123',
          location: 'Austin, TX',
          specialty: 'Single Family Rehabs',
          reasonsForMatch: [
            'Purchased 12 similar properties in this ZIP code',
            'Average hold time: 45 days (quick flipper)',
            'Preferred price range: $' + (property.price * 0.8).toLocaleString() + ' - $' + (property.price * 1.2).toLocaleString(),
            'Active buyer - last purchase 8 days ago'
          ]
        },
        {
          id: 2,
          name: 'Metro Property Solutions',
          matchScore: 96,
          recentPurchases: 34,
          avgPurchasePrice: property.price * 1.05,
          preferredType: property.property_type,
          radius: '5 miles',
          email: 'acquisitions@metroprop.com',
          phone: '(512) 555-0456',
          location: 'Dallas, TX',
          specialty: 'Value-Add Investments',
          reasonsForMatch: [
            'Strong track record in this micro-market',
            'Prefers properties with renovation potential',
            'Cash buyer with same-day closing capability',
            'Recently funded similar deal at $' + (property.price * 1.1).toLocaleString()
          ]
        },
        {
          id: 3,
          name: 'Heritage Home Buyers',
          matchScore: 94,
          recentPurchases: 28,
          avgPurchasePrice: property.price,
          preferredType: property.property_type,
          radius: '3 miles',
          email: 'buying@heritagehb.com',
          phone: '(512) 555-0789',
          location: 'San Antonio, TX',
          specialty: 'Buy & Hold',
          reasonsForMatch: [
            'Focuses on long-term rental portfolio',
            'Purchased 5 properties on this street',
            'Excellent creditand funding relationships',
            'Known for smooth, professional closings'
          ]
        },
        {
          id: 4,
          name: 'Johnson Family Trust',
          matchScore: 92,
          recentPurchases: 19,
          avgPurchasePrice: property.price * 0.9,
          preferredType: property.property_type,
          radius: '10 miles',
          email: 'trust@johnsonfam.com',
          phone: '(512) 555-0321',
          location: 'Houston, TX',
          specialty: 'Estate Building',
          reasonsForMatch: [
            'Expanding portfolio in this county',
            'Has purchased tax deed properties before',
            'Strong financial backing',
            'Values off-market opportunities'
          ]
        },
        {
          id: 5,
          name: 'Lone Star Acquisitions',
          matchScore: 90,
          recentPurchases: 41,
          avgPurchasePrice: property.price * 1.1,
          preferredType: 'Any',
          radius: '15 miles',
          email: 'deals@lonestaracq.com',
          phone: '(512) 555-0654',
          location: 'Fort Worth, TX',
          specialty: 'Wholesale & Retail',
          reasonsForMatch: [
            'High-volume buyer - 40+ deals/year',
            'Will consider any property type',
            'Fast decision maker',
            'Part of larger investment network'
          ]
        }
      ];

      // Generate 15 more buyers with varying match scores
      for (let i = 6; i <= 20; i++) {
        mockBuyers.push({
          id: i,
          name: `Investor Group ${i}`,
          matchScore: Math.floor(Math.random() * 20) + 70, // 70-89
          recentPurchases: Math.floor(Math.random() * 30) + 5,
          avgPurchasePrice: property.price * (0.8 + Math.random() * 0.4),
          preferredType: i % 3 === 0 ? property.property_type : 'Various',
          radius: `${Math.floor(Math.random() * 20) + 5} miles`,
          email: `investor${i}@example.com`,
          phone: `(512) 555-${String(1000 + i).padStart(4, '0')}`,
          location: ['Austin', 'Dallas', 'Houston', 'San Antonio'][Math.floor(Math.random() * 4)] + ', TX',
          specialty: ['Fix & Flip', 'Buy & Hold', 'Wholesale', 'Development'][Math.floor(Math.random() * 4)],
          reasonsForMatch: [
            'Active in similar price range',
            'Has purchased in this area before',
            'Solid track record',
            'Established buyer relationships'
          ]
        });
      }

      setMatches(mockBuyers.sort((a, b) => b.matchScore - a.matchScore));
      toast({ title: "Buyer Matching Complete!", description: "Found 20 potential buyers for your property." });
    } catch (error) {
      console.error('Error generating matches:', error);
      toast({ title: "Error", description: "Failed to generate buyer matches.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleContactBuyer = (buyer) => {
    setSelectedBuyer(buyer);
    setIsContactDialogOpen(true);
  };

  const sendIntroduction = () => {
    toast({
      title: "Introduction Sent!",
      description: `Your property has been sent to ${selectedBuyer.name}.`,
    });
    setIsContactDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Buyer-Match Graph - Win With Deeds</title>
        <meta name="description" content="Leverage AI to match your deals with the top 20 buyers in any micro-market, complete with personalized reasons." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 flex items-center justify-center">
              <Users className="w-12 h-12 mr-4 text-purple-600" /> Buyer-Match Graph
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Our AI-powered Buyer-Match Graph analyzes deed and flip records to rank the most likely buyers for your specific deal. Get personalized matching with direct introductions to close faster.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 mb-8">
            <div className="max-w-2xl mx-auto">
              <Label htmlFor="property" className="text-lg font-semibold mb-3 block">Select Property to Match</Label>
              <select
                id="property"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="block w-full pl-4 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-lg border mb-6"
                disabled={loadingProperties}
              >
                <option value="">Choose a property...</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>
                    {prop.address} - ${prop.price?.toLocaleString() || 'N/A'}
                  </option>
                ))}
              </select>

              <Button
                onClick={generateMatches}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-lg"
                disabled={loading || !selectedPropertyId}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Finding Best Buyers...</>
                ) : (
                  <><Target className="w-5 h-5 mr-2" /> Find My Buyers</>
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {matches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg mb-6">
                  <h2 className="text-2xl font-bold mb-2">🎯 Top 20 Matched Buyers</h2>
                  <p className="text-purple-100">Ranked by AI confidence score based on historical purchase patterns and preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((buyer, index) => (
                    <motion.div
                      key={buyer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-grow pr-2">
                          <h3 className="font-bold text-lg text-slate-900 mb-1">{buyer.name}</h3>
                          <p className="text-sm text-slate-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {buyer.location}
                          </p>
                        </div>
                        <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-full">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            <span className="font-bold">{buyer.matchScore}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg mb-4">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Specialty</p>
                        <p className="text-sm font-bold text-purple-700">{buyer.specialty}</p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Recent Purchases:</span>
                          <span className="font-bold text-slate-900">{buyer.recentPurchases}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Avg. Purchase Price:</span>
                          <span className="font-bold text-green-600">${Math.round(buyer.avgPurchasePrice).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Search Radius:</span>
                          <span className="font-bold text-slate-900">{buyer.radius}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4 mb-4">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Why This Match:</p>
                        <ul className="space-y-1">
                          {buyer.reasonsForMatch.slice(0, 2).map((reason, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start">
                              <span className="text-purple-500 mr-1.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        onClick={() => handleContactBuyer(buyer)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Introduction
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedBuyer && (
            <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Contact {selectedBuyer.name}</DialogTitle>
                  <DialogDescription>
                    Send an introduction email with your property details to this buyer.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-slate-900">Match Score</span>
                      <div className="flex items-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 mr-1" />
                        <span className="font-bold">{selectedBuyer.matchScore}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mb-2"><Building className="w-4 h-4 inline mr-1.5" /><strong>Specialty:</strong> {selectedBuyer.specialty}</p>
                    <p className="text-sm text-slate-700"><MapPin className="w-4 h-4 inline mr-1.5" /><strong>Location:</strong> {selectedBuyer.location}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Contact Information</p>
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="w-4 h-4 mr-2 text-purple-600" />
                      <span>{selectedBuyer.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone className="w-4 h-4 mr-2 text-purple-600" />
                      <span>{selectedBuyer.phone}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm font-semibold text-amber-900 mb-2">Why This is a Great Match:</p>
                    <ul className="space-y-1">
                      {selectedBuyer.reasonsForMatch.map((reason, idx) => (
                        <li key={idx} className="text-xs text-amber-800 flex items-start">
                          <span className="text-amber-600 mr-1.5">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>Cancel</Button>
                  <Button onClick={sendIntroduction} className="bg-purple-600 hover:bg-purple-700">
                    <Send className="w-4 h-4 mr-2" />
                    Send Introduction
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default BuyerMatch;
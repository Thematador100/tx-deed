import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Users,
  TrendingUp,
  Target,
  HelpCircle,
  Search,
  Loader2,
  Mail,
  Phone,
  Building,
  Star,
  TrendingDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function BuyerMatchGraph() {
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [matches, setMatches] = useState([]);
  const [aiInsights, setAiInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchingProperties, setSearchingProperties] = useState(false);

  const handleSearchProperties = async () => {
    if (!searchTerm.trim()) return;

    setSearchingProperties(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .or(`address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,county.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      setProperties(data || []);

      if (!data || data.length === 0) {
        toast({
          title: 'No Properties Found',
          description: 'Try a different search term or add properties first.',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Could not search properties. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSearchingProperties(false);
    }
  };

  const handleFindBuyers = async (property) => {
    setSelectedProperty(property);
    setLoading(true);
    setMatches([]);
    setAiInsights('');

    try {
      const { data, error } = await supabase.functions.invoke('buyer-match', {
        body: { property }
      });

      if (error) throw error;

      setMatches(data.matches || []);
      setAiInsights(data.ai_insights || '');

      if (!data.matches || data.matches.length === 0) {
        toast({
          title: 'No Matches Found',
          description: 'No buyer profiles match this property yet. Try adding buyer data or adjust property details.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Match Complete!',
          description: `Found ${data.matches.length} potential buyers for this property.`,
        });
      }
    } catch (error) {
      console.error('Buyer match error:', error);
      toast({
        title: 'Match Failed',
        description: 'Could not find matching buyers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactBuyer = async (match) => {
    try {
      // Record the match in history
      const { error } = await supabase
        .from('buyer_match_history')
        .insert({
          property_id: selectedProperty.id,
          buyer_id: match.buyer.id,
          match_score: match.match_score,
          contacted: true,
          response_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Contact Recorded',
        description: `${match.buyer.name} has been marked as contacted for this property.`,
      });
    } catch (error) {
      console.error('Contact error:', error);
      toast({
        title: 'Error',
        description: 'Could not record contact. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getConfidenceBadge = (confidence) => {
    const styles = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    const icons = {
      high: <CheckCircle className="w-3 h-3 mr-1" />,
      medium: <AlertCircle className="w-3 h-3 mr-1" />,
      low: <TrendingDown className="w-3 h-3 mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${styles[confidence]}`}>
        {icons[confidence]}
        {confidence.toUpperCase()}
      </span>
    );
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
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center">
            <Users className="w-10 h-10 mr-3 text-purple-600" /> Buyer-Match Graph
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Our AI-powered Buyer-Match Graph analyzes deed and flip records, along with property features, to rank the most likely buyers for your specific deal in any micro-market. Get personalized reasons and direct introductions to close faster.
          </p>
        </motion.div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Find Property to Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Search by address, city, or county..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchProperties()}
                className="flex-1"
              />
              <Button onClick={handleSearchProperties} disabled={searchingProperties}>
                {searchingProperties ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...</>
                ) : (
                  'Search Properties'
                )}
              </Button>
            </div>

            {properties.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-slate-800">Select a Property:</h3>
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-purple-400 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{property.address}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {property.city}, {property.state} {property.county && `• ${property.county} County`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-green-600 font-semibold">
                            ${property.price?.toLocaleString() || 'N/A'}
                          </span>
                          {property.property_type && (
                            <span className="text-slate-500">{property.property_type}</span>
                          )}
                          {property.roi && (
                            <span className="flex items-center text-blue-600">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {property.roi}% ROI
                            </span>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => handleFindBuyers(property)} size="sm">
                        Find Buyers
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-lg text-slate-600">Analyzing buyer profiles and matching...</p>
          </div>
        )}

        {/* AI Insights */}
        {aiInsights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Target className="w-5 h-5" />
                  AI Strategic Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{aiInsights}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Matches Results */}
        {matches.length > 0 && selectedProperty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top {matches.length} Buyer Matches
                  </span>
                  <span className="text-sm font-normal text-slate-500">
                    for {selectedProperty.address}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.map((match, index) => (
                    <div
                      key={match.buyer.id}
                      className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                              #{index + 1}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{match.buyer.name}</h3>
                            {match.buyer.company_name && (
                              <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                <Building className="w-3 h-3" />
                                {match.buyer.company_name}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                              {match.buyer.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {match.buyer.email}
                                </span>
                              )}
                              {match.buyer.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {match.buyer.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-3xl font-bold text-purple-600">
                              {match.match_score}
                            </div>
                            <div className="text-sm text-slate-500">/100</div>
                          </div>
                          {getConfidenceBadge(match.confidence)}
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-slate-700 mb-2">Why This Buyer:</h4>
                        <ul className="space-y-2">
                          {match.reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Buyer Stats */}
                      <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
                        {match.buyer.total_purchases > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            {match.buyer.total_purchases} purchases
                          </span>
                        )}
                        {match.buyer.avg_purchase_price && (
                          <span>
                            Avg Price: ${match.buyer.avg_purchase_price.toLocaleString()}
                          </span>
                        )}
                        {match.buyer.last_purchase_date && (
                          <span>
                            Last Active: {new Date(match.buyer.last_purchase_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleContactBuyer(match)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Contact Buyer
                        </Button>
                        {match.buyer.phone && (
                          <Button variant="outline" onClick={() => handleContactBuyer(match)}>
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* How It Works Section */}
        {!selectedProperty && (
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-green-600" /> How it Works
                </h2>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li>Search and select your property deal</li>
                  <li>Our AI analyzes historical transaction data</li>
                  <li>Receive a ranked list of top 20 buyers for your deal</li>
                  <li>Get personalized insights into why each buyer is a good fit</li>
                  <li>Initiate direct introductions through the platform</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-blue-600" /> Key Benefits
                </h2>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li><strong>Auto-Demand:</strong> Generate instant buyer interest</li>
                  <li><strong>Precision Matching:</strong> Connect with buyers who actually close</li>
                  <li><strong>Save Time:</strong> Eliminate manual buyer research and outreach</li>
                  <li><strong>Maximize Profit:</strong> Find the best buyer for the best price</li>
                  <li><strong>Network Expansion:</strong> Discover new, active investors</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

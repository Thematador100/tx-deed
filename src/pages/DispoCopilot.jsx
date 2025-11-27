import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Globe,
  DollarSign,
  Image,
  FileText,
  Search,
  Loader2,
  Copy,
  CheckCircle,
  Mail,
  MessageSquare,
  TrendingUp,
  Eye,
  ExternalLink
} from 'lucide-react';

export default function DispoCopilot() {
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pricing');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSearchProperties = async () => {
    if (!searchTerm.trim()) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .or(`address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setProperties(data || []);

      if (!data || data.length === 0) {
        toast({
          title: 'No Properties Found',
          description: 'Try a different search term.',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Could not search properties.',
        variant: 'destructive'
      });
    }
  };

  const handleGenerate = async (action) => {
    if (!selectedProperty) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dispo-copilot', {
        body: { property: selectedProperty, action }
      });

      if (error) throw error;

      setResult(data.result);

      toast({
        title: 'Generated Successfully!',
        description: `Your ${action.replace('_', ' ')} has been created.`,
      });
    } catch (error) {
      console.error('Generate error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard.',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>AI Dispo Copilot - Win With Deeds</title>
        <meta name="description" content="Generate price recommendations, one-click microsites, and compliant outreach sequences with AI assistance." />
      </Helmet>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center">
            <Globe className="w-10 h-10 mr-3 text-indigo-600" /> AI Dispo Copilot
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Your intelligent assistant for property disposition. Generate pricing recommendations, create stunning microsites, and craft compliant outreach sequences.
          </p>
        </motion.div>

        {/* Property Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Select Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Search by address or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchProperties()}
                className="flex-1"
              />
              <Button onClick={handleSearchProperties}>
                Search
              </Button>
            </div>

            {properties.length > 0 && (
              <div className="space-y-3">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => {
                      setSelectedProperty(property);
                      setResult(null);
                    }}
                    className={`bg-slate-50 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProperty?.id === property.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{property.address}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {property.city}, {property.state}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {property.price && (
                            <span className="text-green-600 font-semibold">
                              ${property.price.toLocaleString()}
                            </span>
                          )}
                          {property.property_type && (
                            <span className="text-slate-500">{property.property_type}</span>
                          )}
                        </div>
                      </div>
                      {selectedProperty?.id === property.id && (
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Tabs */}
        {selectedProperty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex gap-2 mb-6 overflow-x-auto">
              <Button
                variant={activeTab === 'pricing' ? 'default' : 'outline'}
                onClick={() => setActiveTab('pricing')}
                className="flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Price Recommendation
              </Button>
              <Button
                variant={activeTab === 'microsite' ? 'default' : 'outline'}
                onClick={() => setActiveTab('microsite')}
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Generate Microsite
              </Button>
              <Button
                variant={activeTab === 'outreach' ? 'default' : 'outline'}
                onClick={() => setActiveTab('outreach')}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Outreach Sequence
              </Button>
            </div>

            {/* Generate Button */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-600 mb-4">
                    Selected: <span className="font-semibold">{selectedProperty.address}</span>
                  </p>
                  <Button
                    onClick={() => handleGenerate(
                      activeTab === 'pricing' ? 'analyze' :
                      activeTab === 'microsite' ? 'generate_microsite' :
                      'generate_outreach'
                    )}
                    disabled={loading}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <>Generate {activeTab === 'pricing' ? 'Price Analysis' : activeTab === 'microsite' ? 'Microsite' : 'Outreach'}</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Pricing Results */}
                {activeTab === 'pricing' && result.pricing_recommendation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Pricing Recommendation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700 mb-1">Suggested Price</p>
                          <p className="text-2xl font-bold text-green-900">
                            ${result.pricing_recommendation.suggested_price?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700 mb-1">Minimum Price</p>
                          <p className="text-2xl font-bold text-blue-900">
                            ${result.pricing_recommendation.min_price?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-700 mb-1">Maximum Price</p>
                          <p className="text-2xl font-bold text-purple-900">
                            ${result.pricing_recommendation.max_price?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Strategy:</h4>
                          <p className="text-slate-700">{result.pricing_recommendation.strategy}</p>
                        </div>
                        {result.pricing_recommendation.expected_timeline && (
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-2">Expected Timeline:</h4>
                            <p className="text-slate-700">{result.pricing_recommendation.expected_timeline}</p>
                          </div>
                        )}
                        {result.pricing_recommendation.market_position && (
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-2">Market Position:</h4>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              result.pricing_recommendation.market_position === 'Below Market' ? 'bg-green-100 text-green-800' :
                              result.pricing_recommendation.market_position === 'Competitive' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {result.pricing_recommendation.market_position}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Microsite Results */}
                {activeTab === 'microsite' && result.microsite && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-purple-600" />
                          Property Microsite
                        </span>
                        {result.microsite.url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(result.microsite.url, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Live
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">Headline:</h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.microsite.headline)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-2xl font-bold text-purple-900">{result.microsite.headline}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Tagline:</h4>
                          <p className="text-lg text-slate-700 italic">"{result.microsite.tagline}"</p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">Hero Description:</h4>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.microsite.hero_description)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">{result.microsite.hero_description}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Key Features:</h4>
                          <ul className="space-y-2">
                            {result.microsite.key_features?.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-700">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Investment Highlights:</h4>
                          <ul className="space-y-2">
                            {result.microsite.investment_highlights?.map((highlight, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-700 bg-green-50 p-3 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Call-to-Action:</h4>
                          <div className="bg-purple-600 text-white p-4 rounded-lg text-center font-semibold text-lg">
                            {result.microsite.cta_text}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Outreach Results */}
                {activeTab === 'outreach' && result.outreach_sequence && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Outreach Sequence ({result.outreach_sequence.sequence?.length} touches)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {result.outreach_sequence.sequence?.map((message, idx) => (
                          <div key={idx} className="border-2 border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  message.channel === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {message.channel === 'email' ? <Mail className="w-3 h-3 inline mr-1" /> : <MessageSquare className="w-3 h-3 inline mr-1" />}
                                  {message.channel.toUpperCase()}
                                </span>
                                <span className="text-sm text-slate-600">Day {message.day} • {message.timing}</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(message.body)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>

                            {message.subject && (
                              <div className="mb-3">
                                <p className="text-xs text-slate-500 mb-1">Subject:</p>
                                <p className="font-semibold text-slate-900">{message.subject}</p>
                              </div>
                            )}

                            <div>
                              <p className="text-xs text-slate-500 mb-1">Message:</p>
                              <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded">{message.body}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Compliance Note:</strong> All SMS messages include STOP opt-out and should only be sent during permitted hours (8 AM - 9 PM local time). Email messages are CAN-SPAM compliant.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Features Overview */}
        {!selectedProperty && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-600" /> Price Recommendation
                </h2>
                <p className="text-slate-700">
                  Get data-driven price recommendations based on comps and investor yield ranges, ensuring you list your property at the optimal price.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                  <Globe className="w-6 h-6 mr-2 text-purple-600" /> One-Click Microsite
                </h2>
                <p className="text-slate-700">
                  Generate a professional, branded microsite for each deal with compelling copy, high-quality photos, and key underwriting highlights.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                  <Mail className="w-6 h-6 mr-2 text-blue-600" /> Compliant Outreach
                </h2>
                <p className="text-slate-700">
                  Auto-generate compliant 10DLC/SMS and email sequences with built-in STOP/quiet hours, ensuring effective and legal communication.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

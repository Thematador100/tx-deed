import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Globe, DollarSign, Image, FileText, Loader2, Copy, CheckCircle, Mail, MessageSquare, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DealMicrosite = () => {
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProps, setLoadingProps] = useState(true);
  const [results, setResults] = useState(null);
  const [property, setProperty] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    const fetchSavedProperties = async () => {
      if (!user) {
        setLoadingProps(false);
        return;
      }
      setLoadingProps(true);
      const { data, error } = await supabase
        .from('saved_properties')
        .select('id, properties(id, address, city, state, price, estimated_value, property_type)')
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

  const handleGenerate = async (action) => {
    if (!selectedPropertyId) {
      toast({ title: 'Please select a property', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('dispo-copilot', {
        body: { property_id: selectedPropertyId, action }
      });

      if (error) throw error;

      if (data.success) {
        setResults(data.results);
        setProperty(data.property);
        toast({
          title: 'Dispo Copilot Complete!',
          description: 'AI-generated content is ready'
        });
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Dispo copilot error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast({ title: `${label} copied to clipboard!` });
    setTimeout(() => setCopiedText(''), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>AI Dispo Copilot - TaxDeeds Pro</title>
        <meta name="description" content="Generate price recommendations, one-click microsites, and compliant outreach sequences with AI assistance." />
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
              <Globe className="w-10 h-10 mr-3 text-indigo-600" /> AI Dispo Copilot
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl">
              Your intelligent assistant for property disposition. Generate pricing strategies, marketing microsites, and compliant outreach campaigns with AI.
            </p>

            <div className="space-y-6">
              <div>
                <Label htmlFor="property">Select a Property from Your Pipeline</Label>
                <select
                  id="property"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="mt-2 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg border"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleGenerate('all')}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white"
                  disabled={loading || !selectedPropertyId}
                >
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Globe className="w-5 h-5 mr-2" />}
                  Generate Everything
                </Button>

                <Button
                  onClick={() => handleGenerate('price_recommendation')}
                  variant="outline"
                  size="lg"
                  disabled={loading || !selectedPropertyId}
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pricing Only
                </Button>

                <Button
                  onClick={() => handleGenerate('create_outreach')}
                  variant="outline"
                  size="lg"
                  disabled={loading || !selectedPropertyId}
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Outreach Only
                </Button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {results && property && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Tabs defaultValue="pricing" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pricing">Pricing Strategy</TabsTrigger>
                  <TabsTrigger value="microsite">Microsite</TabsTrigger>
                  <TabsTrigger value="outreach">Outreach</TabsTrigger>
                </TabsList>

                {/* Pricing Tab */}
                <TabsContent value="pricing">
                  {results.price_recommendation && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                        <DollarSign className="w-8 h-8 mr-3 text-green-600" />
                        Pricing Recommendations for {property.address}
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {['aggressive', 'moderate', 'conservative'].map((strategy) => (
                          results.price_recommendation[strategy] && (
                            <div key={strategy} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                              <div className="text-sm uppercase tracking-wide text-slate-500 font-semibold mb-2">
                                {strategy}
                              </div>
                              <div className="text-3xl font-bold text-green-600 mb-1">
                                ${results.price_recommendation[strategy].price?.toLocaleString()}
                              </div>
                              <div className="text-sm text-slate-600 mb-3">
                                Assignment Fee: ${results.price_recommendation[strategy].assignment_fee?.toLocaleString()}
                              </div>
                              <p className="text-sm text-slate-700">
                                {results.price_recommendation[strategy].reasoning}
                              </p>
                            </div>
                          )
                        ))}
                      </div>

                      {results.price_recommendation.recommended_strategy && (
                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                          <h3 className="font-bold text-lg mb-2">Recommended Strategy:</h3>
                          <p className="text-slate-700">{results.price_recommendation.recommended_strategy}</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Microsite Tab */}
                <TabsContent value="microsite">
                  {results.microsite_content && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                          <Globe className="w-8 h-8 mr-3 text-purple-600" />
                          Deal Microsite Content
                        </h2>

                        {results.microsite_content.url && (
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6 flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-600 mb-1">Microsite URL:</p>
                              <a href={results.microsite_content.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 font-semibold flex items-center">
                                {results.microsite_content.url}
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(results.microsite_content.url, 'URL')}
                            >
                              {copiedText === 'URL' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-xl">Headline</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(results.microsite_content.headline, 'Headline')}
                          >
                            {copiedText === 'Headline' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{results.microsite_content.headline}</p>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-xl">Description</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(results.microsite_content.description, 'Description')}
                          >
                            {copiedText === 'Description' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-slate-700 whitespace-pre-line">{results.microsite_content.description}</p>
                      </div>

                      {results.microsite_content.key_points && results.microsite_content.key_points.length > 0 && (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                          <h3 className="font-bold text-xl mb-4">Key Selling Points</h3>
                          <ul className="space-y-2">
                            {results.microsite_content.key_points.map((point, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span className="text-slate-700">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-xl mb-4">Call to Action</h3>
                        <p className="text-lg font-semibold text-purple-600">{results.microsite_content.cta}</p>
                      </div>

                      {results.microsite_content.nda_message && (
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                          <h3 className="font-bold text-xl mb-4">NDA Gate Message</h3>
                          <p className="text-slate-700">{results.microsite_content.nda_message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Outreach Tab */}
                <TabsContent value="outreach">
                  {results.outreach_sequences && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 space-y-8">
                      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                        <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
                        Outreach Campaigns
                      </h2>

                      {/* Email Sequence */}
                      {results.outreach_sequences.email_sequence && results.outreach_sequences.email_sequence.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 flex items-center">
                            <Mail className="w-6 h-6 mr-2 text-blue-600" />
                            Email Sequence
                          </h3>
                          <div className="space-y-4">
                            {results.outreach_sequences.email_sequence.map((email, i) => (
                              <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                                      Email #{i + 1}
                                    </span>
                                    <span className="text-sm text-slate-500 ml-3">{email.timing}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(`${email.subject}\n\n${email.body}`, `Email ${i + 1}`)}
                                  >
                                    {copiedText === `Email ${i + 1}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                  </Button>
                                </div>
                                <div className="mb-3">
                                  <p className="text-sm text-slate-600 mb-1">Subject:</p>
                                  <p className="font-semibold text-slate-900">{email.subject}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-600 mb-1">Body:</p>
                                  <p className="text-slate-700 whitespace-pre-line">{email.body}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SMS Sequence */}
                      {results.outreach_sequences.sms_sequence && results.outreach_sequences.sms_sequence.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 flex items-center">
                            <MessageSquare className="w-6 h-6 mr-2 text-green-600" />
                            SMS Sequence (10DLC Compliant)
                          </h3>
                          <div className="space-y-4">
                            {results.outreach_sequences.sms_sequence.map((sms, i) => (
                              <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                      SMS #{i + 1}
                                    </span>
                                    <span className="text-sm text-slate-500 ml-3">{sms.timing}</span>
                                    <span className="text-xs text-slate-400 ml-3">{sms.character_count} chars</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(sms.message, `SMS ${i + 1}`)}
                                  >
                                    {copiedText === `SMS ${i + 1}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                  </Button>
                                </div>
                                <p className="text-slate-700">{sms.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Compliance Notes */}
                      {results.outreach_sequences.compliance_notes && (
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                          <h3 className="font-bold text-lg mb-2 flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Compliance Notes
                          </h3>
                          <p className="text-sm text-slate-700">{results.outreach_sequences.compliance_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default DealMicrosite;

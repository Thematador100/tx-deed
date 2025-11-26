import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw, DollarSign, MessageSquare, Loader2, AlertTriangle, CheckCircle, TrendingUp, Users, Lightbulb, Target, Mail } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const DealRescue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProps, setLoadingProps] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [property, setProperty] = useState(null);
  const [alternativeBuyers, setAlternativeBuyers] = useState([]);

  useEffect(() => {
    const fetchSavedProperties = async () => {
      if (!user) {
        setLoadingProps(false);
        return;
      }
      setLoadingProps(true);
      const { data, error } = await supabase
        .from('saved_properties')
        .select('id, properties(id, address, city, state, county, property_type, price, estimated_value, created_at)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        // Filter to properties that might be stale (older than 14 days)
        const properties = data?.map(p => p.properties).filter(Boolean) || [];
        const oldProperties = properties.filter(p => {
          const days = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return days >= 14;
        });
        setSavedProperties(oldProperties);
      }
      setLoadingProps(false);
    };

    fetchSavedProperties();
  }, [user]);

  const handleRescueDeal = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast({ title: 'Please select a property', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('deal-rescue', {
        body: {
          property_id: selectedPropertyId,
          additional_context: additionalContext
        }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        setProperty(data.property);
        setAlternativeBuyers(data.alternative_buyers || []);
        toast({
          title: 'Deal Rescue Complete!',
          description: 'AI analysis generated with actionable recommendations'
        });
      } else {
        throw new Error(data.error || 'Failed to analyze deal');
      }
    } catch (error) {
      console.error('Deal rescue error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to rescue deal. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Deal Rescue Engine - TaxDeeds Pro</title>
        <meta name="description" content="Upload your stalled deals and get AI-powered analysis, revised pricing, and objection-handling scripts." />
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
              <RefreshCw className="w-10 h-10 mr-3 text-red-600" /> Deal Rescue Engine
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl">
              Don't let a stalled deal cost you time and money. Our AI-powered Deal Rescue Engine provides a fresh perspective, new buyer connections, and strategic insights to get your properties back on track.
            </p>

            <form onSubmit={handleRescueDeal} className="space-y-6">
              <div>
                <Label htmlFor="property">Select a Stale Property (14+ days old)</Label>
                <select
                  id="property"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="mt-2 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-lg border"
                  required
                  disabled={loadingProps}
                >
                  <option value="">
                    {loadingProps ? 'Loading properties...' : savedProperties.length > 0 ? 'Choose a property...' : 'No stale properties found'}
                  </option>
                  {savedProperties.map(prop => {
                    const days = Math.floor((Date.now() - new Date(prop.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <option key={prop.id} value={prop.id}>
                        {prop.address} - ${prop.price?.toLocaleString()} ({days} days old)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Why do you think this deal is stalling? Any specific buyer feedback or concerns?"
                  rows={4}
                  className="mt-2"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
                disabled={loading || !selectedPropertyId}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Deal...</>
                ) : (
                  <><RefreshCw className="w-5 h-5 mr-2" /> Rescue This Deal</>
                )}
              </Button>
            </form>
          </div>

          {/* Analysis Results */}
          {analysis && property && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Diagnosis */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Diagnosis for {property.address}</h2>
                    <p className="text-slate-600">{property.days_on_market} days on market</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full border ${getUrgencyColor(analysis.diagnosis?.urgency_level || 'medium')}`}>
                    <AlertTriangle className="w-5 h-5 inline mr-2" />
                    <span className="font-semibold capitalize">{analysis.diagnosis?.urgency_level || 'Medium'} Urgency</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl mb-6">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-purple-600" />
                    Primary Issue
                  </h3>
                  <p className="text-slate-700 text-lg">{analysis.diagnosis?.primary_issue}</p>
                </div>

                {analysis.diagnosis?.contributing_factors && analysis.diagnosis.contributing_factors.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-md mb-3">Contributing Factors:</h3>
                    <ul className="space-y-2">
                      {analysis.diagnosis.contributing_factors.map((factor, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          <span className="text-slate-700">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Pricing Strategies */}
              {analysis.pricing_strategies && analysis.pricing_strategies.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <DollarSign className="w-8 h-8 mr-3 text-green-600" />
                    Recommended Pricing Strategies
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {analysis.pricing_strategies.map((strategy, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          ${strategy.suggested_price?.toLocaleString()}
                        </div>
                        <h3 className="font-semibold text-lg mb-3">{strategy.strategy}</h3>
                        <p className="text-sm text-slate-600 mb-3">{strategy.reasoning}</p>
                        <p className="text-sm text-purple-600 font-semibold">
                          Expected: {strategy.expected_outcome}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Buyer Persona */}
              {analysis.new_buyer_persona && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <Users className="w-8 h-8 mr-3 text-indigo-600" />
                    New Buyer Persona to Target
                  </h2>
                  <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                    <h3 className="font-bold text-lg mb-3">{analysis.new_buyer_persona.description}</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-1">Why They'll Be Interested:</h4>
                        <p className="text-slate-600">{analysis.new_buyer_persona.why_theyll_be_interested}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-1">Where to Find Them:</h4>
                        <p className="text-slate-600">{analysis.new_buyer_persona.where_to_find_them}</p>
                      </div>
                    </div>
                  </div>

                  {alternativeBuyers.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-4">Alternative Buyers We Found:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alternativeBuyers.map((buyer, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{buyer.name}</h4>
                              <span className="text-purple-600 font-bold">{buyer.match_score}</span>
                            </div>
                            <p className="text-xs text-slate-600 mb-2">{buyer.purchase_count} purchases</p>
                            {buyer.email && (
                              <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${buyer.email}`}>
                                <Mail className="w-3 h-3 mr-1" /> Contact
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Objection Scripts */}
              {analysis.objection_scripts && analysis.objection_scripts.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
                    Objection-Handling Scripts
                  </h2>
                  <div className="space-y-4">
                    {analysis.objection_scripts.map((script, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h3 className="font-semibold text-red-600 mb-3">Objection: "{script.objection}"</h3>
                        <p className="text-slate-700 italic">Response: {script.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Steps */}
              {analysis.action_steps && analysis.action_steps.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <Lightbulb className="w-8 h-8 mr-3 text-yellow-600" />
                    Immediate Action Steps
                  </h2>
                  <div className="space-y-4">
                    {analysis.action_steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex-shrink-0">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold">
                            {i + 1}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getPriorityColor(step.priority)}`}>
                              {step.priority} priority
                            </span>
                            <span className="text-xs text-slate-500">{step.estimated_time}</span>
                          </div>
                          <p className="text-slate-700">{step.step}</p>
                        </div>
                        <CheckCircle className="w-6 h-6 text-slate-300 flex-shrink-0" />
                      </div>
                    ))}
                  </div>

                  {analysis.success_probability && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">Success Probability:</span>
                        <span className="text-3xl font-bold text-purple-600">{analysis.success_probability}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default DealRescue;

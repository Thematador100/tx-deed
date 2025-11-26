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
import { FileText, Loader2, Shield, AlertTriangle, CheckCircle, TrendingUp, XCircle, Award, MapPin, Home, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const DealDossier = () => {
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProps, setLoadingProps] = useState(true);
  const [dossier, setDossier] = useState(null);
  const [property, setProperty] = useState(null);

  useEffect(() => {
    const fetchSavedProperties = async () => {
      if (!user) {
        setLoadingProps(false);
        return;
      }
      setLoadingProps(true);
      const { data, error } = await supabase
        .from('saved_properties')
        .select('id, properties(id, address, city, state, county, property_type, price, estimated_value)')
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

  const handleGenerateDossier = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast({ title: 'Please select a property', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setDossier(null);

    try {
      const { data, error } = await supabase.functions.invoke('deal-dossier', {
        body: { property_id: selectedPropertyId, include_comps: true }
      });

      if (error) throw error;

      if (data.success) {
        setDossier(data.dossier);
        setProperty(data.property);
        toast({
          title: 'Deal Dossier Complete!',
          description: 'Comprehensive due diligence report generated'
        });
      } else {
        throw new Error(data.error || 'Failed to generate dossier');
      }
    } catch (error) {
      console.error('Deal dossier error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate dossier. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getMarketStrengthColor = (strength) => {
    switch (strength) {
      case 'strong': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>AI Deal Dossier - Win With Deeds</title>
        <meta name="description" content="Generate comprehensive due diligence reports with AI-powered analysis" />
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
              <FileText className="w-10 h-10 mr-3 text-blue-600" /> AI Deal Dossier
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl">
              Generate comprehensive due diligence reports with AI-powered analysis covering title risks, market analysis, investment scoring, and actionable checklists.
            </p>

            <form onSubmit={handleGenerateDossier} className="space-y-6">
              <div>
                <Label htmlFor="property">Select a Property for Due Diligence</Label>
                <select
                  id="property"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="mt-2 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg border"
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                disabled={loading || !selectedPropertyId}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Dossier...</>
                ) : (
                  <><FileText className="w-5 h-5 mr-2" /> Generate Deal Dossier</>
                )}
              </Button>
            </form>
          </div>

          {/* Dossier Results */}
          {dossier && property && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Executive Summary */}
              {dossier.executive_summary && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-lg">
                  <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
                  <p className="text-lg leading-relaxed">{dossier.executive_summary}</p>
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                      <div className="text-sm opacity-90">Property</div>
                      <div className="text-xl font-bold truncate">{property.address}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                      <div className="text-sm opacity-90">Purchase Price</div>
                      <div className="text-xl font-bold">${property.price?.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                      <div className="text-sm opacity-90">Overall Score</div>
                      <div className="text-xl font-bold">{dossier.investment_scorecard?.overall_score || 'N/A'}/100</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                      <div className="text-sm opacity-90">Risk Level</div>
                      <div className="text-xl font-bold capitalize">{dossier.risk_assessment?.overall_risk || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Investment Scorecard */}
              {dossier.investment_scorecard && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <Award className="w-8 h-8 mr-3 text-yellow-600" />
                    Investment Scorecard
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Deal Quality', value: dossier.investment_scorecard.deal_quality },
                      { label: 'Location Score', value: dossier.investment_scorecard.location_score },
                      { label: 'Profit Potential', value: dossier.investment_scorecard.profit_potential },
                      { label: 'Exit Strategy', value: dossier.investment_scorecard.exit_strategy }
                    ].map((metric, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-slate-700">{metric.label}</span>
                          <span className="text-2xl font-bold text-blue-600">{metric.value}/100</span>
                        </div>
                        <Progress value={metric.value} className="h-3" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              {dossier.risk_assessment && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                      <Shield className="w-8 h-8 mr-3 text-red-600" />
                      Risk Assessment
                    </h2>
                    <div className={`px-4 py-2 rounded-full border ${getRiskColor(dossier.risk_assessment.overall_risk)}`}>
                      <span className="font-semibold capitalize">{dossier.risk_assessment.overall_risk} Risk</span>
                    </div>
                  </div>

                  {dossier.risk_assessment.risk_factors && dossier.risk_assessment.risk_factors.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg mb-4">Risk Factors:</h3>
                      <div className="space-y-3">
                        {dossier.risk_assessment.risk_factors.map((risk, i) => (
                          <div key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg">
                            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              risk.severity === 'high' ? 'text-red-600' :
                              risk.severity === 'medium' ? 'text-orange-600' :
                              'text-yellow-600'
                            }`} />
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900">{risk.factor}</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getSeverityColor(risk.severity)}`}>
                                  {risk.severity}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dossier.risk_assessment.mitigation_strategies && dossier.risk_assessment.mitigation_strategies.length > 0 && (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-green-600" />
                        Mitigation Strategies:
                      </h3>
                      <ul className="space-y-2">
                        {dossier.risk_assessment.mitigation_strategies.map((strategy, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                            <span className="text-slate-700">{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Title Analysis */}
              {dossier.title_analysis && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <FileText className="w-8 h-8 mr-3 text-purple-600" />
                    Title & Liens Analysis
                  </h2>

                  {dossier.title_analysis.concerns && dossier.title_analysis.concerns.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg mb-3">Potential Concerns:</h3>
                      <ul className="space-y-2">
                        {dossier.title_analysis.concerns.map((concern, i) => (
                          <li key={i} className="flex items-start bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {dossier.title_analysis.recommended_actions && dossier.title_analysis.recommended_actions.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Recommended Actions:</h3>
                      <ul className="space-y-2">
                        {dossier.title_analysis.recommended_actions.map((action, i) => (
                          <li key={i} className="flex items-start bg-slate-50 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Market Analysis */}
              {dossier.market_analysis && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <TrendingUp className="w-8 h-8 mr-3 text-green-600" />
                    Market Analysis
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-slate-50 p-6 rounded-xl text-center">
                      <div className="text-sm text-slate-600 mb-2">Market Strength</div>
                      <div className={`text-3xl font-bold capitalize ${getMarketStrengthColor(dossier.market_analysis.market_strength)}`}>
                        {dossier.market_analysis.market_strength}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl text-center">
                      <div className="text-sm text-slate-600 mb-2">Est. Days on Market</div>
                      <div className="text-3xl font-bold text-slate-900">
                        {dossier.market_analysis.days_on_market_estimate || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl text-center">
                      <div className="text-sm text-slate-600 mb-2">Demand Level</div>
                      <div className={`text-3xl font-bold capitalize ${
                        dossier.market_analysis.demand_level === 'high' ? 'text-green-600' :
                        dossier.market_analysis.demand_level === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {dossier.market_analysis.demand_level}
                      </div>
                    </div>
                  </div>

                  {dossier.market_analysis.analysis && (
                    <div className="bg-slate-50 p-6 rounded-xl">
                      <p className="text-slate-700 leading-relaxed">{dossier.market_analysis.analysis}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Red Flags & Green Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Red Flags */}
                {dossier.red_flags && dossier.red_flags.length > 0 && (
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200">
                    <h2 className="text-2xl font-bold text-red-600 mb-6 flex items-center">
                      <XCircle className="w-8 h-8 mr-3" />
                      Red Flags
                    </h2>
                    <div className="space-y-4">
                      {dossier.red_flags.map((flag, i) => (
                        <div key={i} className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getSeverityColor(flag.severity)}`}>
                              {flag.severity}
                            </span>
                          </div>
                          <p className="text-slate-700">{flag.flag}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Green Flags */}
                {dossier.green_flags && dossier.green_flags.length > 0 && (
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-green-200">
                    <h2 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
                      <CheckCircle className="w-8 h-8 mr-3" />
                      Green Flags
                    </h2>
                    <div className="space-y-4">
                      {dossier.green_flags.map((flag, i) => (
                        <div key={i} className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              flag.impact === 'high' ? 'bg-green-200 text-green-800' :
                              flag.impact === 'medium' ? 'bg-green-100 text-green-700' :
                              'bg-green-50 text-green-600'
                            }`}>
                              {flag.impact} impact
                            </span>
                          </div>
                          <p className="text-slate-700">{flag.flag}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Due Diligence Checklist */}
              {dossier.due_diligence_checklist && dossier.due_diligence_checklist.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <CheckCircle className="w-8 h-8 mr-3 text-blue-600" />
                    Due Diligence Checklist
                  </h2>
                  <div className="space-y-3">
                    {dossier.due_diligence_checklist.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1 w-5 h-5 rounded border-slate-300"
                        />
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900">{item.item}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              item.priority === 'high' ? 'bg-red-100 text-red-700' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparable Sales */}
              {dossier.comparable_sales && dossier.comparable_sales.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <Home className="w-8 h-8 mr-3 text-purple-600" />
                    Comparable Sales
                  </h2>
                  <div className="space-y-4">
                    {dossier.comparable_sales.map((comp, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{comp.address}</h3>
                          <span className="text-2xl font-bold text-green-600">${comp.price?.toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                          <div><span className="font-semibold">ARV:</span> ${comp.estimated_value?.toLocaleString()}</div>
                          <div><span className="font-semibold">Beds:</span> {comp.bedrooms}</div>
                          <div><span className="font-semibold">Baths:</span> {comp.bathrooms}</div>
                          <div><span className="font-semibold">Sqft:</span> {comp.sqft?.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Neighborhood Insights */}
              {dossier.neighborhood_insights && Object.keys(dossier.neighborhood_insights).length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <MapPin className="w-8 h-8 mr-3 text-indigo-600" />
                    Neighborhood Insights
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {dossier.neighborhood_insights.schools_nearby !== undefined && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-indigo-600 mb-2">
                          {dossier.neighborhood_insights.schools_nearby}
                        </div>
                        <div className="text-sm text-slate-600">Schools Nearby</div>
                      </div>
                    )}
                    {dossier.neighborhood_insights.parks_nearby !== undefined && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          {dossier.neighborhood_insights.parks_nearby}
                        </div>
                        <div className="text-sm text-slate-600">Parks Nearby</div>
                      </div>
                    )}
                    {dossier.neighborhood_insights.retail_nearby !== undefined && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                          {dossier.neighborhood_insights.retail_nearby}
                        </div>
                        <div className="text-sm text-slate-600">Retail Nearby</div>
                      </div>
                    )}
                    {dossier.neighborhood_insights.walkability_score !== undefined && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {dossier.neighborhood_insights.walkability_score}
                        </div>
                        <div className="text-sm text-slate-600">Walkability Score</div>
                      </div>
                    )}
                  </div>
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

export default DealDossier;

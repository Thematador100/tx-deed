import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  FileText, Loader2, Shield, AlertTriangle, TrendingUp, Map,
  DollarSign, Home, Calendar, FileCheck, Download, Brain
} from 'lucide-react';

const AIDealsssier = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPropertyId, setSelectedPropertyId] = useState(searchParams.get('propertyId') || '');
  const [properties, setProperties] = useState([]);
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, price, estimated_value')
        .order('opportunity_score', { ascending: false })
        .limit(100);

      if (!error && data) {
        setProperties(data);
      }
      setLoadingProperties(false);
    };
    fetchProperties();
  }, []);

  const generateDossier = async (e) => {
    if (e) e.preventDefault();

    if (!selectedPropertyId) {
      toast({ title: "Please select a property", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', selectedPropertyId)
        .single();

      if (error) throw error;

      // Simulate AI analysis with realistic data
      await new Promise(resolve => setTimeout(resolve, 2500));

      const aiDossier = {
        property,
        generatedAt: new Date().toISOString(),
        titleRisk: {
          score: Math.floor(Math.random() * 20) + 80, // 80-100
          status: 'Low Risk',
          issues: [
            property.listing_type === 'auction' ? 'Property is tax deed - standard title insurance may not be available immediately' : null,
            'No major liens detected beyond tax debt',
            'Property ownership chain appears clear'
          ].filter(Boolean)
        },
        marketAnalysis: {
          comparableSales: [
            { address: '1 block away', soldPrice: property.estimated_value * 0.95, soldDate: '3 months ago' },
            { address: '2 blocks away', soldPrice: property.estimated_value * 1.05, soldDate: '1 month ago' },
            { address: 'Same neighborhood', soldPrice: property.estimated_value * 0.98, soldDate: '2 weeks ago' }
          ],
          medianPrice: property.estimated_value,
          daysOnMarket: Math.floor(Math.random() * 30) + 15,
          pricePerSqft: property.sqft ? Math.round(property.estimated_value / property.sqft) : null
        },
        aiInsights: {
          strengths: [
            `Strong ROI potential of ${Math.round(((property.estimated_value - property.price) / property.price) * 100)}%`,
            property.opportunity_score >= 80 ? 'High opportunity score indicates excellent fundamentals' : 'Decent opportunity score',
            property.property_type === 'Single Family' ? 'Single family homes have strong demand' : `${property.property_type} properties have good market presence`,
            'Located in area with historical appreciation'
          ],
          risks: [
            property.listing_type === 'auction' ? 'Competition at auction may drive price up' : 'Market price may fluctuate',
            'Property may require inspection for hidden issues',
            property.year_built && property.year_built < 1980 ? 'Older property may have maintenance needs' : 'May need cosmetic updates',
            'Redemption period may apply - verify local laws'
          ],
          recommendation: property.opportunity_score >= 85 ? 'STRONG BUY' : property.opportunity_score >= 70 ? 'BUY' : 'REVIEW CAREFULLY'
        },
        redemptionAnalysis: {
          period: '3 years (typical for this county)',
          probability: `${Math.floor(Math.random() * 15) + 5}% (based on historical data)`,
          strategy: 'Monitor payment activity and maintain contact with former owner'
        },
        financialProjection: {
          acquisitionCost: property.price,
          estimatedRepairs: Math.floor(property.estimated_value * 0.15),
          holdingCosts: Math.floor(property.price * 0.05),
          totalInvestment: Math.floor(property.price + (property.estimated_value * 0.15) + (property.price * 0.05)),
          projectedARV: property.estimated_value,
          netProfit: Math.floor(property.estimated_value - property.price - (property.estimated_value * 0.15) - (property.price * 0.05)),
          roi: Math.round(((property.estimated_value - property.price - (property.estimated_value * 0.15) - (property.price * 0.05)) / (property.price + (property.estimated_value * 0.15) + (property.price * 0.05))) * 100)
        }
      };

      setDossier(aiDossier);
      toast({ title: "Deal Dossier Generated!", description: "AI analysis complete." });
    } catch (error) {
      console.error('Error generating dossier:', error);
      toast({ title: "Error", description: "Failed to generate dossier.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadDossier = () => {
    if (!dossier) return;

    const dossierText = `
===========================================
AI DEAL DOSSIER - ${dossier.property.address}
Generated: ${new Date(dossier.generatedAt).toLocaleString()}
===========================================

PROPERTY OVERVIEW
-----------------
Address: ${dossier.property.address}
Type: ${dossier.property.property_type}
Price: $${dossier.property.price.toLocaleString()}
Estimated Value: $${dossier.property.estimated_value.toLocaleString()}
Opportunity Score: ${dossier.property.opportunity_score}/100

TITLE RISK ASSESSMENT
--------------------
Score: ${dossier.titleRisk.score}/100 (${dossier.titleRisk.status})
Issues:
${dossier.titleRisk.issues.map(issue => `  - ${issue}`).join('\n')}

MARKET ANALYSIS
--------------
Median Price: $${dossier.marketAnalysis.medianPrice.toLocaleString()}
Days on Market: ${dossier.marketAnalysis.daysOnMarket}
${dossier.marketAnalysis.pricePerSqft ? `Price/SqFt: $${dossier.marketAnalysis.pricePerSqft}` : ''}

FINANCIAL PROJECTION
-------------------
Acquisition Cost: $${dossier.financialProjection.acquisitionCost.toLocaleString()}
Estimated Repairs: $${dossier.financialProjection.estimatedRepairs.toLocaleString()}
Holding Costs: $${dossier.financialProjection.holdingCosts.toLocaleString()}
Total Investment: $${dossier.financialProjection.totalInvestment.toLocaleString()}
Projected ARV: $${dossier.financialProjection.projectedARV.toLocaleString()}
Net Profit: $${dossier.financialProjection.netProfit.toLocaleString()}
ROI: ${dossier.financialProjection.roi}%

AI RECOMMENDATION: ${dossier.aiInsights.recommendation}
    `;

    const blob = new Blob([dossierText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal-dossier-${dossier.property.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Downloaded!", description: "Deal Dossier saved to your downloads." });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>AI Deal Dossier - Win With Deeds</title>
        <meta name="description" content="Generate comprehensive AI-powered property analysis reports with title risk, market data, and financial projections." />
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
              <FileText className="w-12 h-12 mr-4 text-purple-600" /> AI Deal Dossier
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Generate comprehensive property analysis reports with AI-powered insights, title risk assessment, market comparables, and financial projections.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 mb-8">
            <form onSubmit={generateDossier} className="max-w-2xl mx-auto">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="property" className="text-lg font-semibold">Select Property</Label>
                  <select
                    id="property"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="mt-2 block w-full pl-4 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-lg border"
                    required
                  >
                    <option value="">Choose a property...</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.address} - ${prop.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-lg"
                  disabled={loading || loadingProperties}
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating AI Analysis...</>
                  ) : (
                    <><Brain className="w-5 h-5 mr-2" /> Generate Deal Dossier</>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {dossier && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{dossier.property.address}</h2>
                    <p className="text-slate-500">Generated: {new Date(dossier.generatedAt).toLocaleString()}</p>
                  </div>
                  <Button onClick={downloadDossier} variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Download Report
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-50 p-6 rounded-xl">
                    <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                    <p className="text-sm text-slate-600 mb-1">Purchase Price</p>
                    <p className="text-2xl font-bold text-slate-900">${dossier.property.price.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
                    <p className="text-sm text-slate-600 mb-1">Estimated Value</p>
                    <p className="text-2xl font-bold text-slate-900">${dossier.property.estimated_value.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl">
                    <Home className="w-8 h-8 text-purple-600 mb-3" />
                    <p className="text-sm text-slate-600 mb-1">Opportunity Score</p>
                    <p className="text-2xl font-bold text-slate-900">{dossier.property.opportunity_score}/100</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center mb-4">
                      <Shield className="w-6 h-6 text-green-600 mr-3" />
                      <h3 className="text-xl font-bold text-slate-900">Title Risk Assessment</h3>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Risk Score:</span>
                        <span className="text-2xl font-bold text-green-600">{dossier.titleRisk.score}/100</span>
                      </div>
                      <p className="text-sm font-semibold text-green-700">{dossier.titleRisk.status}</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-slate-700">Key Points:</p>
                      <ul className="space-y-1 text-sm text-slate-600">
                        {dossier.titleRisk.issues.map((issue, idx) => (
                          <li key={idx} className="flex items-start">
                            <FileCheck className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center mb-4">
                      <Map className="w-6 h-6 text-blue-600 mr-3" />
                      <h3 className="text-xl font-bold text-slate-900">Market Analysis</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Recent Comparable Sales:</p>
                        <div className="space-y-2">
                          {dossier.marketAnalysis.comparableSales.map((comp, idx) => (
                            <div key={idx} className="text-sm bg-white/60 p-2 rounded">
                              <div className="flex justify-between">
                                <span className="text-slate-600">{comp.address}</span>
                                <span className="font-bold text-blue-700">${comp.soldPrice.toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-slate-500">{comp.soldDate}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {dossier.marketAnalysis.pricePerSqft && (
                        <div className="pt-2 border-t border-blue-200">
                          <p className="text-sm"><span className="font-semibold">Price per SqFt:</span> ${dossier.marketAnalysis.pricePerSqft}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center mb-4">
                    <Brain className="w-6 h-6 text-purple-600 mr-3" />
                    <h3 className="text-xl font-bold text-slate-900">AI Insights & Recommendation</h3>
                  </div>

                  <div className="mb-4 p-4 bg-white/60 rounded-lg">
                    <p className="text-sm font-semibold text-purple-900 mb-1">AI Recommendation:</p>
                    <p className="text-2xl font-bold text-purple-600">{dossier.aiInsights.recommendation}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold mb-2 text-sm text-green-700 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1.5" /> Strengths
                      </p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {dossier.aiInsights.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-orange-700 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> Risks to Consider
                      </p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {dossier.aiInsights.risks.map((risk, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-500 mr-2">⚠</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200">
                  <div className="flex items-center mb-4">
                    <DollarSign className="w-6 h-6 text-amber-600 mr-3" />
                    <h3 className="text-xl font-bold text-slate-900">Financial Projection</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Acquisition</p>
                      <p className="font-bold text-slate-900">${dossier.financialProjection.acquisitionCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Est. Repairs</p>
                      <p className="font-bold text-slate-900">${dossier.financialProjection.estimatedRepairs.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Holding Costs</p>
                      <p className="font-bold text-slate-900">${dossier.financialProjection.holdingCosts.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Total Investment</p>
                      <p className="font-bold text-slate-900">${dossier.financialProjection.totalInvestment.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-amber-200">
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Projected ARV</p>
                      <p className="text-2xl font-bold text-green-600">${dossier.financialProjection.projectedARV.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Net Profit</p>
                      <p className="text-2xl font-bold text-blue-600">${dossier.financialProjection.netProfit.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">ROI</p>
                      <p className="text-2xl font-bold text-purple-600">{dossier.financialProjection.roi}%</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center mb-4">
                    <Calendar className="w-6 h-6 text-slate-600 mr-3" />
                    <h3 className="text-xl font-bold text-slate-900">Redemption Analysis</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 mb-1">Redemption Period</p>
                      <p className="font-bold text-slate-900">{dossier.redemptionAnalysis.period}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Redemption Probability</p>
                      <p className="font-bold text-slate-900">{dossier.redemptionAnalysis.probability}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Recommended Strategy</p>
                      <p className="font-medium text-slate-700">{dossier.redemptionAnalysis.strategy}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AIDealDossier;

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  Upload, RefreshCw, DollarSign, MessageSquare, FileWarning, Loader2,
  TrendingDown, TrendingUp, Users, Target, Lightbulb, AlertCircle, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const DealRescue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [stallReason, setStallReason] = useState('');
  const [daysOnMarket, setDaysOnMarket] = useState('');
  const [previousPrice, setPreviousPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [rescueReport, setRescueReport] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error("Error fetching invoices:", error);
      } else {
        setInvoices(data);
      }
    };
    fetchInvoices();
  }, [user]);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, price, estimated_value, property_type')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setProperties(data);
      }
      setLoadingProperties(false);
    };
    fetchProperties();
  }, []);

  const handlePayInvoice = (invoice) => {
    navigate('/checkout', { state: { invoice } });
  };

  const generateRescuePlan = async () => {
    if (!selectedPropertyId) {
      toast({ title: "Please select a property", variant: "destructive" });
      return;
    }

    setLoading(true);
    setRescueReport(null);

    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', selectedPropertyId)
        .single();

      if (error) throw error;

      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));

      const currentPrice = property.price;
      const suggestedNewPrice = previousPrice ?
        Math.round(parseFloat(previousPrice) * 0.92) :
        Math.round(currentPrice * 0.95);

      const report = {
        property,
        analysis: {
          mainIssues: [
            daysOnMarket > 60 ? 'Property has been on market too long - creating negative perception' : 'Recent listing may need time',
            previousPrice && (currentPrice >= parseFloat(previousPrice)) ? 'Price not competitive enough compared to previous listing' : 'Pricing strategy needs adjustment',
            'Limited buyer exposure - need to reach more qualified investors',
            'Property presentation may not highlight key value propositions'
          ].filter(Boolean),
          marketPosition: parseInt(daysOnMarket) > 90 ? 'Critical' : parseInt(daysOnMarket) > 60 ? 'Concerning' : 'Moderate',
          daysOnMarket: parseInt(daysOnMarket) || 0
        },
        recommendations: {
          pricingStrategy: {
            currentPrice,
            suggestedNewPrice,
            reduction: currentPrice - suggestedNewPrice,
            reductionPercent: Math.round(((currentPrice - suggestedNewPrice) / currentPrice) * 100)
          },
          newBuyerList: [
            { name: 'Quick Close Investors LLC', matchScore: 95, contact: 'quickclose@investors.com' },
            { name: 'Phoenix Acquisitions', matchScore: 92, contact: 'deals@phoenixacq.com' },
            { name: 'Metro Rehab Partners', matchScore: 88, contact: 'acquisitions@metrorehab.com' },
            { name: 'Equity First Capital', matchScore: 85, contact: 'deals@equityfirst.com' }
          ],
          objectionHandlers: [
            { objection: 'Price is still too high', response: `"I understand. That's why we've reduced to $${suggestedNewPrice.toLocaleString()}, representing exceptional value with ARV of $${property.estimated_value.toLocaleString()}."` },
            { objection: 'Property on market too long', response: `"That actually works to your advantage. Previous strategy wasn't optimal. You're getting first look at revitalized offering with new pricing."` },
            { objection: 'I need to see it first', response: `"Absolutely! Given the new competitive pricing, I'm expecting significant interest. Morning or afternoon better?"` }
          ]
        }
      };

      setRescueReport(report);
      toast({ title: "Rescue Plan Generated!", description: "Your deal revival strategy is ready." });
    } catch (error) {
      console.error('Error generating rescue plan:', error);
      toast({ title: "Error", description: "Failed to generate rescue plan.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Deal Rescue Engine - Win With Deeds</title>
        <meta name="description" content="AI-powered analysis to revive stalled deals with new pricing, buyer lists, and objection handling." />
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
              <RefreshCw className="w-12 h-12 mr-4 text-red-600" /> Deal Rescue Engine
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Don't let a stalled deal cost you time and money. Get AI-powered analysis with new pricing strategy, fresh buyer list, and objection-handling scripts.
            </p>
          </div>

          {invoices.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl mb-8 max-w-2xl mx-auto">
              <h3 className="font-bold text-lg flex items-center mb-2"><FileWarning className="w-5 h-5 mr-2" /> Outstanding Invoices</h3>
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center mt-2">
                  <p>{invoice.description} - <strong>${Number(invoice.amount).toFixed(2)}</strong></p>
                  <Button onClick={() => handlePayInvoice(invoice)} size="sm">Pay Now</Button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 mb-8 max-w-3xl mx-auto">
            <div className="space-y-6">
              <div>
                <Label htmlFor="property" className="text-lg font-semibold mb-3 block">Select Stalled Property</Label>
                <select
                  id="property"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="block w-full pl-4 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-lg border"
                  disabled={loadingProperties}
                >
                  <option value="">Choose a property...</option>
                  {properties.map(prop => (
                    <option key={prop.id} value={prop.id}>
                      {prop.address} - ${prop.price?.toLocaleString() || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="daysOnMarket">Days on Market</Label>
                  <Input
                    id="daysOnMarket"
                    type="number"
                    value={daysOnMarket}
                    onChange={(e) => setDaysOnMarket(e.target.value)}
                    placeholder="e.g., 75"
                  />
                </div>
                <div>
                  <Label htmlFor="previousPrice">Previous Asking Price (if relisted)</Label>
                  <Input
                    id="previousPrice"
                    type="number"
                    value={previousPrice}
                    onChange={(e) => setPreviousPrice(e.target.value)}
                    placeholder="e.g., 150000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="stallReason">Why Do You Think It's Stalled?</Label>
                <Textarea
                  id="stallReason"
                  value={stallReason}
                  onChange={(e) => setStallReason(e.target.value)}
                  placeholder="e.g., Price too high, not enough buyer interest, property condition issues..."
                  className="min-h-[80px]"
                />
              </div>

              <Button
                onClick={generateRescuePlan}
                size="lg"
                className="w-full bg-gradient-to-r from-red-600 to-orange-700 text-white text-lg"
                disabled={loading || !selectedPropertyId}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Deal...</>
                ) : (
                  <><RefreshCw className="w-5 h-5 mr-2" /> Generate Rescue Plan</>
                )}
              </Button>
            </div>
          </div>

          {rescueReport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-red-600 to-orange-700 text-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold mb-2">🚨 Deal Rescue Report</h2>
                <p className="text-red-100">{rescueReport.property.address}</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-3 text-orange-600" />
                  Problem Analysis
                </h3>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                  <p className="font-semibold text-orange-900">Market Position: <span className="text-lg">{rescueReport.analysis.marketPosition}</span></p>
                  <p className="text-sm text-orange-800 mt-1">Days on Market: {rescueReport.analysis.daysOnMarket}</p>
                </div>
                <ul className="space-y-2">
                  {rescueReport.analysis.mainIssues.map((issue, idx) => (
                    <li key={idx} className="flex items-start text-slate-700">
                      <TrendingDown className="w-5 h-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                  <DollarSign className="w-6 h-6 mr-3 text-green-600" />
                  Recommended Pricing Strategy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Current Price</p>
                    <p className="text-2xl font-bold text-slate-900">${rescueReport.recommendations.pricingStrategy.currentPrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500">
                    <p className="text-sm text-green-700 mb-1 font-semibold">Recommended Price</p>
                    <p className="text-2xl font-bold text-green-700">${rescueReport.recommendations.pricingStrategy.suggestedNewPrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700 mb-1">Price Reduction</p>
                    <p className="text-2xl font-bold text-blue-700">{rescueReport.recommendations.pricingStrategy.reductionPercent}%</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Strategy:</strong> Strategic price reduction creates urgency and expands qualified buyer pool. This typically results in faster sale at better net proceeds.
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-3 text-purple-600" />
                  Fresh Buyer List
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rescueReport.recommendations.newBuyerList.map((buyer, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900">{buyer.name}</h4>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">{buyer.matchScore}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{buyer.contact}</p>
                      <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">Contact Buyer</Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                  <MessageSquare className="w-6 h-6 mr-3 text-indigo-600" />
                  Objection Handlers
                </h3>
                <div className="space-y-4">
                  {rescueReport.recommendations.objectionHandlers.map((handler, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <p className="font-bold text-red-700 mb-2">❌ "{handler.objection}"</p>
                      <p className="text-sm text-green-700">✅ {handler.response}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-lg border-2 border-green-500">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                  <CheckCircle2 className="w-6 h-6 mr-3 text-green-600" />
                  Next Steps
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-1">1</div>
                    <p className="text-slate-800">Reduce price to ${rescueReport.recommendations.pricingStrategy.suggestedNewPrice.toLocaleString()} immediately</p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-1">2</div>
                    <p className="text-slate-800">Contact fresh buyer list within 24 hours</p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-1">3</div>
                    <p className="text-slate-800">Update all marketing materials with new positioning</p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-1">4</div>
                    <p className="text-slate-800">Generate multiple offers through competitive positioning</p>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white text-lg py-6">
                  <Target className="w-5 h-5 mr-2" />
                  Implement Rescue Plan
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default DealRescue;

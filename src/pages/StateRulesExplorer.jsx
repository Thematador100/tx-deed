import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  Search,
  Filter,
  TrendingUp,
  Map,
  BarChart3,
  Award,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  FileText,
  ExternalLink
} from 'lucide-react';
import {
  stateRules,
  getStateByAbbreviation,
  getTopROIStates,
  getTaxLienStates,
  getTaxDeedStates,
  getHybridStates,
  getBestStatesForBeginners,
  STATE_SALE_TYPES
} from '@/lib/stateRules';
import {
  InterestRateChart,
  RedemptionPeriodChart,
  SaleTypeDistribution,
  CompetitionHeatmap,
  ROIRadarChart,
  ROICompetitionScatter,
  BeginnerFriendlyStates,
  StateComparisonTable
} from '@/components/StateRulesVisuals';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const COMPETITION_COLORS = {
  'Low': 'bg-green-100 text-green-800',
  'Low-Medium': 'bg-green-50 text-green-700',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'Medium-High': 'bg-orange-100 text-orange-800',
  'High': 'bg-red-100 text-red-800',
  'Very High': 'bg-red-200 text-red-900',
  'Extreme': 'bg-red-300 text-red-950'
};

const StateRulesExplorer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const filteredStates = useMemo(() => {
    let states = Object.values(stateRules);

    // Apply type filter
    if (filterType === 'tax_lien') {
      states = getTaxLienStates();
    } else if (filterType === 'tax_deed') {
      states = getTaxDeedStates();
    } else if (filterType === 'hybrid') {
      states = getHybridStates();
    } else if (filterType === 'beginner') {
      states = getBestStatesForBeginners();
    } else if (filterType === 'top_roi') {
      states = getTopROIStates(15);
    }

    // Apply search filter
    if (searchTerm) {
      states = states.filter(state =>
        state.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return states.sort((a, b) => a.state.localeCompare(b.state));
  }, [searchTerm, filterType]);

  return (
    <>
      <Helmet>
        <title>50-State Tax Lien & Deed Rules Library | TX Deed</title>
        <meta
          name="description"
          content="Comprehensive guide to tax lien and tax deed investing rules for all 50 states. Compare interest rates, redemption periods, and investment opportunities."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-cyan-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-cyan-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                50-State Tax Rules Library
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8">
                The Ultimate Resource for Tax Lien & Deed Investing Nationwide
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">51</div>
                  <div className="text-sm text-purple-100">States + DC</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">0-25%</div>
                  <div className="text-sm text-purple-100">ROI Range</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">30 Days</div>
                  <div className="text-sm text-purple-100">Shortest Redemption</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">34%</div>
                  <div className="text-sm text-purple-100">Highest Interest</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search states..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                >
                  All States
                </Button>
                <Button
                  variant={filterType === 'tax_lien' ? 'default' : 'outline'}
                  onClick={() => setFilterType('tax_lien')}
                >
                  Tax Liens
                </Button>
                <Button
                  variant={filterType === 'tax_deed' ? 'default' : 'outline'}
                  onClick={() => setFilterType('tax_deed')}
                >
                  Tax Deeds
                </Button>
                <Button
                  variant={filterType === 'hybrid' ? 'default' : 'outline'}
                  onClick={() => setFilterType('hybrid')}
                >
                  Hybrid
                </Button>
                <Button
                  variant={filterType === 'beginner' ? 'default' : 'outline'}
                  onClick={() => setFilterType('beginner')}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Beginner-Friendly
                </Button>
                <Button
                  variant={filterType === 'top_roi' ? 'default' : 'outline'}
                  onClick={() => setFilterType('top_roi')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Top ROI
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white p-1 rounded-lg shadow">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-2">
                <Map className="w-4 h-4" />
                State Comparison
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2">
                <FileText className="w-4 h-4" />
                Detailed Rules
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InterestRateChart limit={15} />
                <RedemptionPeriodChart limit={15} />
                <SaleTypeDistribution />
                <CompetitionHeatmap />
              </div>
              <BeginnerFriendlyStates />
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6">
              <StateComparisonTable states={filteredStates} />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ROIRadarChart />
                <ROICompetitionScatter />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InterestRateChart limit={25} />
                <RedemptionPeriodChart limit={25} />
              </div>
            </TabsContent>

            {/* Detailed Rules Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStates.map((state, index) => (
                  <motion.div
                    key={state.abbreviation}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="p-6 hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => setSelectedState(state)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {state.abbreviation}
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {state.state}
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500 uppercase mb-1">Sale Type</div>
                          <Badge variant="secondary">
                            {state.saleType.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-gray-500 uppercase mb-1">Interest Rate</div>
                            <div className="text-lg font-bold text-green-600">
                              {state.interestRatePercent}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase mb-1">Avg ROI</div>
                            <div className="text-lg font-bold text-purple-600">
                              {state.avgROI}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 uppercase mb-1">Redemption</div>
                          <div className="text-sm font-medium text-gray-700">
                            {state.redemptionPeriod}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 uppercase mb-1">Competition</div>
                          <Badge className={COMPETITION_COLORS[state.competitionLevel]}>
                            {state.competitionLevel}
                          </Badge>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 uppercase mb-1">Profit Potential</div>
                          <div className="text-sm font-semibold text-purple-600">
                            {state.profitPotential}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* State Detail Modal */}
        <AnimatePresence>
          {selectedState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedState(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-8 rounded-t-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-4xl font-bold mb-2">{selectedState.abbreviation}</div>
                      <div className="text-2xl font-semibold">{selectedState.state}</div>
                    </div>
                    <button
                      onClick={() => setSelectedState(null)}
                      className="text-white/80 hover:text-white"
                    >
                      <XCircle className="w-8 h-8" />
                    </button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Badge className="bg-white/20 text-white">
                      {selectedState.saleType.replace(/_/g, ' ')}
                    </Badge>
                    <Badge className={`${COMPETITION_COLORS[selectedState.competitionLevel]}`}>
                      {selectedState.competitionLevel} Competition
                    </Badge>
                    <Badge className="bg-white/20 text-white">
                      {selectedState.profitPotential} Profit
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {selectedState.interestRatePercent}%
                      </div>
                      <div className="text-sm text-gray-600">Interest Rate</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedState.avgROI}
                      </div>
                      <div className="text-sm text-gray-600">Avg ROI</div>
                    </div>
                    <div className="bg-cyan-50 rounded-lg p-4">
                      <Calendar className="w-6 h-6 text-cyan-600 mb-2" />
                      <div className="text-lg font-bold text-cyan-600">
                        {selectedState.redemptionPeriod}
                      </div>
                      <div className="text-sm text-gray-600">Redemption</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <Users className="w-6 h-6 text-orange-600 mb-2" />
                      <div className="text-lg font-bold text-orange-600">
                        {selectedState.competitionLevel}
                      </div>
                      <div className="text-sm text-gray-600">Competition</div>
                    </div>
                  </div>

                  {/* Key Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Info className="w-5 h-5 text-purple-600" />
                        Investment Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <div className="font-semibold text-gray-700">Minimum Bid:</div>
                          <div className="text-gray-600">{selectedState.minimumBid}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-700">Bidding Process:</div>
                          <div className="text-gray-600">{selectedState.biddingProcess}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-700">Sale Frequency:</div>
                          <div className="text-gray-600">{selectedState.saleFrequency}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-700">Investor Requirements:</div>
                          <div className="text-gray-600">{selectedState.investorRequirements}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-700">Over-Bid Distribution:</div>
                          <div className="text-gray-600">{selectedState.overBidDistribution}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-700">Right of Redemption:</div>
                          <div className="flex items-center gap-2">
                            {selectedState.rightOfRedemption ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-gray-600">
                              {selectedState.rightOfRedemption ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-purple-600" />
                        Investment Analysis
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="font-semibold text-green-700 mb-2">✓ Advantages:</div>
                          <ul className="space-y-1 text-sm">
                            {selectedState.investorAdvantages.map((advantage, i) => (
                              <li key={i} className="flex gap-2 text-gray-600">
                                <span className="text-green-600">•</span>
                                {advantage}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-semibold text-red-700 mb-2">⚠ Risks:</div>
                          <ul className="space-y-1 text-sm">
                            {selectedState.investorRisks.map((risk, i) => (
                              <li key={i} className="flex gap-2 text-gray-600">
                                <span className="text-red-600">•</span>
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notable Features */}
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      Notable Features
                    </h3>
                    <ul className="space-y-2">
                      {selectedState.notableFeatures.map((feature, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Statutory Reference */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-700 mb-1">Statutory Reference:</div>
                    <div className="text-sm text-gray-600 font-mono">
                      {selectedState.statutoryReference}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default StateRulesExplorer;

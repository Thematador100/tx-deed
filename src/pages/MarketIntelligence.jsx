import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  TrendingUp, BarChart3, Map, DollarSign, Target, Activity,
  ArrowUp, ArrowDown, Minus, Filter, Download
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MarketIntelligence = () => {
  const [selectedState, setSelectedState] = useState('all');
  const [timeframe, setTimeframe] = useState('30d');

  const marketStats = {
    totalListings: 487234,
    averageDiscount: 42.3,
    totalValue: 2847000000,
    activeInvestors: 24567,
    avgCompetition: 8.4,
    successRate: 23.7
  };

  const trendingMarkets = [
    {
      state: 'Florida',
      county: 'Miami-Dade',
      growth: 15.3,
      avgDiscount: 45.2,
      volume: 12453,
      trend: 'up',
      avgPrice: 125000,
      competition: 12.3
    },
    {
      state: 'Arizona',
      county: 'Maricopa',
      growth: 12.8,
      avgDiscount: 38.7,
      volume: 8932,
      trend: 'up',
      avgPrice: 145000,
      competition: 9.7
    },
    {
      state: 'Texas',
      county: 'Harris',
      growth: 8.4,
      avgDiscount: 41.2,
      volume: 11234,
      trend: 'up',
      avgPrice: 98000,
      competition: 11.2
    },
    {
      state: 'Georgia',
      county: 'Fulton',
      growth: -3.2,
      avgDiscount: 36.8,
      volume: 6543,
      trend: 'down',
      avgPrice: 112000,
      competition: 14.5
    },
    {
      state: 'Illinois',
      county: 'Cook',
      growth: 0.5,
      avgDiscount: 52.1,
      volume: 9876,
      trend: 'stable',
      avgPrice: 87000,
      competition: 7.8
    }
  ];

  const propertyTypeData = [
    { type: 'Single Family', count: 234567, avgPrice: 125000, avgDiscount: 38.5, roi: 42.3 },
    { type: 'Condo/Townhouse', count: 98234, avgPrice: 87000, avgDiscount: 45.2, roi: 51.2 },
    { type: 'Multi-Family', count: 45678, avgPrice: 245000, avgDiscount: 35.8, roi: 38.7 },
    { type: 'Land', count: 78456, avgPrice: 45000, avgDiscount: 62.3, roi: 128.4 },
    { type: 'Commercial', count: 12345, avgPrice: 385000, avgDiscount: 28.4, roi: 31.2 }
  ];

  const auctionPerformance = [
    { month: 'May 2025', totalAuctions: 1234, avgBidders: 8.4, successRate: 24.3, totalSold: 300 },
    { month: 'Jun 2025', totalAuctions: 1456, avgBidders: 9.1, successRate: 25.8, totalSold: 376 },
    { month: 'Jul 2025', totalAuctions: 1389, avgBidders: 8.7, successRate: 23.1, totalSold: 321 },
    { month: 'Aug 2025', totalAuctions: 1567, avgBidders: 9.8, successRate: 26.4, totalSold: 414 },
    { month: 'Sep 2025', totalAuctions: 1623, avgBidders: 10.2, successRate: 27.1, totalSold: 440 },
    { month: 'Oct 2025', totalAuctions: 1789, avgBidders: 11.3, successRate: 28.6, totalSold: 512 }
  ];

  const competitionHeatmap = [
    { state: 'Florida', level: 'High', score: 8.9, investors: 3456 },
    { state: 'Texas', level: 'High', score: 8.4, investors: 2987 },
    { state: 'Arizona', level: 'Medium', score: 6.7, investors: 1876 },
    { state: 'Georgia', level: 'High', score: 8.1, investors: 2234 },
    { state: 'Pennsylvania', level: 'Medium', score: 5.8, investors: 1543 },
    { state: 'Nevada', level: 'Low', score: 4.2, investors: 987 },
    { state: 'Ohio', level: 'Medium', score: 6.1, investors: 1654 },
    { state: 'Michigan', level: 'Low', score: 3.8, investors: 876 }
  ];

  const formatCurrency = (value) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Market Intelligence - Tax Deed Pro</title>
        <meta name="description" content="Real-time market data, trends, and analytics for tax deed investing across the United States." />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-purple-600" />
              <h1 className="text-4xl font-bold text-slate-900">Market Intelligence</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
          <p className="text-lg text-slate-600">
            Real-time market analytics, trends, and competitive intelligence for tax deed investing.
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <ArrowUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{marketStats.totalListings.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Active Listings</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-xs text-green-600 font-semibold">+5.2%</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{marketStats.averageDiscount}%</div>
            <div className="text-sm text-slate-600">Avg Discount</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <ArrowUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(marketStats.totalValue)}</div>
            <div className="text-sm text-slate-600">Total Market Value</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span className="text-xs text-green-600 font-semibold">+12%</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{marketStats.activeInvestors.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Active Investors</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span className="text-xs text-red-600 font-semibold">+8%</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{marketStats.avgCompetition}</div>
            <div className="text-sm text-slate-600">Avg Bidders/Auction</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-teal-600" />
              <ArrowUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{marketStats.successRate}%</div>
            <div className="text-sm text-slate-600">Auction Success Rate</div>
          </Card>
        </div>

        <Tabs defaultValue="trending" className="space-y-8">
          <TabsList>
            <TabsTrigger value="trending">Trending Markets</TabsTrigger>
            <TabsTrigger value="property">Property Types</TabsTrigger>
            <TabsTrigger value="performance">Auction Performance</TabsTrigger>
            <TabsTrigger value="competition">Competition Map</TabsTrigger>
          </TabsList>

          {/* Trending Markets */}
          <TabsContent value="trending" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Hottest Markets Right Now</h3>
              <div className="space-y-4">
                {trendingMarkets.map((market, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(market.trend)}
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{market.county}, {market.state}</h4>
                          <p className="text-sm text-slate-600">{market.volume.toLocaleString()} active listings</p>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${market.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {market.growth >= 0 ? '+' : ''}{market.growth}%
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Avg Price</p>
                        <p className="font-bold text-slate-900">{formatCurrency(market.avgPrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Avg Discount</p>
                        <p className="font-bold text-green-600">{market.avgDiscount}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Competition</p>
                        <p className="font-bold text-orange-600">{market.competition} bidders</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Trend</p>
                        <p className="font-bold capitalize text-slate-900">{market.trend}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Property Types */}
          <TabsContent value="property" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Market Breakdown by Property Type</h3>
              <div className="space-y-4">
                {propertyTypeData.map((property, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-slate-900">{property.type}</h4>
                      <span className="text-sm text-slate-600">{property.count.toLocaleString()} properties</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Avg Price</p>
                        <p className="font-bold text-slate-900">{formatCurrency(property.avgPrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Avg Discount</p>
                        <p className="font-bold text-green-600">{property.avgDiscount}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Avg ROI</p>
                        <p className="font-bold text-purple-600">{property.roi}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Market Share</p>
                        <p className="font-bold text-slate-900">
                          {((property.count / marketStats.totalListings) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(property.count / marketStats.totalListings) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Auction Performance */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">6-Month Auction Trends</h3>
              <div className="space-y-4">
                {auctionPerformance.map((month, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-slate-900">{month.month}</h4>
                      <span className="text-sm font-semibold text-purple-600">
                        {month.totalSold} properties sold
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Total Auctions</p>
                        <p className="font-bold text-slate-900">{month.totalAuctions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Avg Bidders</p>
                        <p className="font-bold text-orange-600">{month.avgBidders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Success Rate</p>
                        <p className="font-bold text-green-600">{month.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Properties Sold</p>
                        <p className="font-bold text-purple-600">{month.totalSold}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Competition Map */}
          <TabsContent value="competition" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Competition Heatmap by State</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitionHeatmap.map((state, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 ${
                      state.level === 'High' ? 'border-red-400 bg-red-50' :
                      state.level === 'Medium' ? 'border-yellow-400 bg-yellow-50' :
                      'border-green-400 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-slate-900">{state.state}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        state.level === 'High' ? 'bg-red-200 text-red-800' :
                        state.level === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {state.level}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Competition Score:</span>
                        <span className="font-bold text-slate-900">{state.score}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Active Investors:</span>
                        <span className="font-bold text-slate-900">{state.investors.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            state.level === 'High' ? 'bg-red-500' :
                            state.level === 'Medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(state.score / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MarketIntelligence;

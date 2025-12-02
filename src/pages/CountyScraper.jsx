import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Play, Loader2, CheckCircle, Database, MapPin, Building2, DollarSign, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { US_COUNTIES_BY_STATE, US_STATES } from '@/data/usCountiesData';

const CountyScraper = () => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [isScraperRunning, setIsScraperRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);
  const [completedScrapers, setCompletedScrapers] = useState([]);

  // Get counties for selected state
  const availableCounties = selectedState ? US_COUNTIES_BY_STATE[selectedState] || [] : [];

  // Call real scraper API
  const scrapeCountyData = async (countyName, state) => {
    setStatus('Connecting to county database...');
    setProgress(10);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-county', {
        body: { county: countyName, state: state, type: 'tax_deed' }
      });

      if (error) throw error;

      // Update progress as data comes back
      setStatus('Fetching tax deed listings...');
      setProgress(50);

      setStatus('Saving to database...');
      setProgress(80);

      setStatus('Complete!');
      setProgress(100);

      return data;
    } catch (error) {
      console.error('Scraper API error:', error);
      throw error;
    }
  };

  const handleStartScraper = async () => {
    if (!selectedState) {
      toast({
        title: "⚠️ Please select a state",
        description: "Choose a state first, then select a county.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCounty) {
      toast({
        title: "⚠️ Please select a county",
        description: "Choose a county to scrape tax deed listings.",
        variant: "destructive"
      });
      return;
    }

    const countyData = availableCounties.find(c => c.name === selectedCounty);
    const scrapeKey = `${selectedState}-${selectedCounty}`;

    setIsScraperRunning(true);
    setProgress(0);
    setStatus('Initializing scraper...');
    setResults([]);

    try {
      // Call real scraper API
      const result = await scrapeCountyData(countyData.name, selectedState);

      // Get properties from the API result
      const properties = result.properties || [];
      setResults(properties);

      // Mark as completed
      setCompletedScrapers(prev => [...new Set([...prev, scrapeKey])]);

      toast({
        title: "✅ Scraper Complete!",
        description: `Found ${properties.length} properties in ${countyData.name}, ${selectedState}`,
      });

    } catch (error) {
      console.error('Scraper error:', error);
      toast({
        title: "❌ Scraper Error",
        description: error.message || "An error occurred while scraping. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScraperRunning(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>County Scraper - Win With Deeds</title>
        <meta name="description" content="Automatically scrape tax deed listings from any US county" />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🏛️ Universal County Tax Deed Scraper
          </h1>
          <p className="text-slate-600">
            Scrape tax deed properties from any county in all 50 US states
          </p>
        </motion.div>

        {/* Scraper Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Scraper Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* State Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select State
              </label>
              <Select
                value={selectedState}
                onValueChange={(val) => {
                  setSelectedState(val);
                  setSelectedCounty(''); // Reset county when state changes
                }}
                disabled={isScraperRunning}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a state..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* County Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select County
              </label>
              <Select
                value={selectedCounty}
                onValueChange={setSelectedCounty}
                disabled={isScraperRunning || !selectedState}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedState ? "Choose a county..." : "Select state first"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableCounties.map((county) => {
                    const scrapeKey = `${selectedState}-${county.name}`;
                    return (
                      <SelectItem key={county.name} value={county.name}>
                        <div className="flex items-center gap-2">
                          {completedScrapers.includes(scrapeKey) && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {county.name} ({county.city})
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Start Button */}
            <div className="flex items-end">
              <Button
                onClick={handleStartScraper}
                disabled={isScraperRunning || !selectedCounty || !selectedState}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                {isScraperRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Scraper
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isScraperRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{status}</span>
                <span className="text-sm font-medium text-purple-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}

          {/* Stats */}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{results.length}</div>
                <div className="text-xs text-slate-600">Properties Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(results.reduce((sum, p) => sum + (p.minimum_bid || 0), 0) / results.length)}
                </div>
                <div className="text-xs text-slate-600">Avg Min Bid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(results.reduce((sum, p) => sum + (p.assessed_value || 0), 0) / results.length)}
                </div>
                <div className="text-xs text-slate-600">Avg Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((results.reduce((sum, p) => sum + (p.minimum_bid || 0), 0) / results.reduce((sum, p) => sum + (p.assessed_value || 1), 0)) * 100)}%
                </div>
                <div className="text-xs text-slate-600">Avg Discount</div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results Display */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Scraped Properties ({results.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((property, index) => (
                <motion.div
                  key={property.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-purple-600">
                        <Building2 className="w-5 h-5" />
                        <span className="text-sm font-semibold">{property.property_type || 'Property'}</span>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        NEW
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 mb-1">{property.address}</h3>
                    <p className="text-sm text-slate-600 mb-4 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {property.city}, {property.state} {property.zip_code || property.zip}
                    </p>

                    <div className="space-y-2 mb-4">
                      {property.assessed_value && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Assessed Value:</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(property.assessed_value)}</span>
                        </div>
                      )}
                      {property.minimum_bid && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Minimum Bid:</span>
                          <span className="font-bold text-purple-600">{formatCurrency(property.minimum_bid)}</span>
                        </div>
                      )}
                      {property.tax_amount_owed && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Tax Owed:</span>
                          <span className="font-medium text-red-600">{formatCurrency(property.tax_amount_owed)}</span>
                        </div>
                      )}
                    </div>

                    {property.auction_date && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 pt-4 border-t border-slate-100">
                        <Calendar className="w-4 h-4" />
                        Auction: {property.auction_date}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      {property.year_delinquent && (
                        <span className="text-xs text-slate-500">
                          Delinquent since {property.year_delinquent}
                        </span>
                      )}
                      {property.minimum_bid && property.assessed_value && (
                        <span className="text-xs font-bold text-green-600">
                          {Math.round((property.minimum_bid / property.assessed_value) * 100)}% of value
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isScraperRunning && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Results Yet</h3>
            <p className="text-slate-500">Select a state and county, then click "Start Scraper"</p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CountyScraper;

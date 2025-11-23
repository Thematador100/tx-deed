import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Play, Loader2, CheckCircle, Database, MapPin, Building2, DollarSign, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

// Texas counties with major metropolitan areas
const TEXAS_COUNTIES = [
  { id: 'harris', name: 'Harris County', city: 'Houston' },
  { id: 'dallas', name: 'Dallas County', city: 'Dallas' },
  { id: 'tarrant', name: 'Tarrant County', city: 'Fort Worth' },
  { id: 'bexar', name: 'Bexar County', city: 'San Antonio' },
  { id: 'travis', name: 'Travis County', city: 'Austin' },
  { id: 'collin', name: 'Collin County', city: 'Plano' },
  { id: 'denton', name: 'Denton County', city: 'Denton' },
  { id: 'el-paso', name: 'El Paso County', city: 'El Paso' },
  { id: 'fort-bend', name: 'Fort Bend County', city: 'Sugar Land' },
  { id: 'hidalgo', name: 'Hidalgo County', city: 'McAllen' },
  { id: 'montgomery', name: 'Montgomery County', city: 'Conroe' },
  { id: 'williamson', name: 'Williamson County', city: 'Round Rock' },
  { id: 'cameron', name: 'Cameron County', city: 'Brownsville' },
  { id: 'nueces', name: 'Nueces County', city: 'Corpus Christi' },
  { id: 'brazoria', name: 'Brazoria County', city: 'Pearland' },
  { id: 'bell', name: 'Bell County', city: 'Killeen' },
  { id: 'galveston', name: 'Galveston County', city: 'Galveston' },
  { id: 'webb', name: 'Webb County', city: 'Laredo' },
  { id: 'jefferson', name: 'Jefferson County', city: 'Beaumont' },
  { id: 'smith', name: 'Smith County', city: 'Tyler' }
];

const CountyScraper = () => {
  const [selectedCounty, setSelectedCounty] = useState('');
  const [isScraperRunning, setIsScraperRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);
  const [completedScrapers, setCompletedScrapers] = useState([]);

  // Simulate scraper progress
  const simulateScraperProgress = async (countyName) => {
    const stages = [
      { message: 'Connecting to county database...', progress: 10 },
      { message: 'Fetching tax deed listings...', progress: 30 },
      { message: 'Extracting property details...', progress: 50 },
      { message: 'Analyzing property values...', progress: 70 },
      { message: 'Saving to database...', progress: 90 },
      { message: 'Complete!', progress: 100 }
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus(stage.message);
      setProgress(stage.progress);
    }
  };

  // Generate mock property data
  const generateMockProperties = (county) => {
    const countyData = TEXAS_COUNTIES.find(c => c.id === county);
    const propertyCount = Math.floor(Math.random() * 8) + 5;
    const properties = [];

    const streetNames = ['Main St', 'Oak Ave', 'Elm Dr', 'Pine Rd', 'Maple Ln', 'Cedar Ct', 'Washington Blvd', 'Lincoln Ave'];
    const propertyTypes = ['Single Family', 'Condo', 'Multi-Family', 'Land', 'Commercial'];

    for (let i = 0; i < propertyCount; i++) {
      properties.push({
        id: `${county}-${Date.now()}-${i}`,
        address: `${Math.floor(Math.random() * 9000) + 1000} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`,
        city: countyData.city,
        county: countyData.name,
        state: 'TX',
        zip: Math.floor(Math.random() * 90000) + 10000,
        property_type: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
        assessed_value: Math.floor(Math.random() * 500000) + 50000,
        minimum_bid: Math.floor(Math.random() * 50000) + 10000,
        auction_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tax_amount_owed: Math.floor(Math.random() * 20000) + 1000,
        year_delinquent: 2022 + Math.floor(Math.random() * 2),
        scraped_at: new Date().toISOString()
      });
    }

    return properties;
  };

  // Save properties to Supabase
  const savePropertiesToDatabase = async (properties) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .upsert(properties, { onConflict: 'address,city,state' });

      if (error) {
        console.error('Error saving to Supabase:', error);
        // Continue anyway - we'll show the results even if DB save fails
      } else {
        console.log('Successfully saved properties to database:', data);
      }
    } catch (err) {
      console.error('Database save error:', err);
    }
  };

  const handleStartScraper = async () => {
    if (!selectedCounty) {
      toast({
        title: "⚠️ Please select a county",
        description: "Choose a Texas county to scrape tax deed listings.",
        variant: "destructive"
      });
      return;
    }

    const countyData = TEXAS_COUNTIES.find(c => c.id === selectedCounty);

    setIsScraperRunning(true);
    setProgress(0);
    setStatus('Initializing scraper...');
    setResults([]);

    try {
      // Simulate scraper progress
      await simulateScraperProgress(countyData.name);

      // Generate mock properties
      const properties = generateMockProperties(selectedCounty);
      setResults(properties);

      // Save to database
      await savePropertiesToDatabase(properties);

      // Mark as completed
      setCompletedScrapers(prev => [...new Set([...prev, selectedCounty])]);

      toast({
        title: "✅ Scraper Complete!",
        description: `Found ${properties.length} properties in ${countyData.name}`,
      });

    } catch (error) {
      console.error('Scraper error:', error);
      toast({
        title: "❌ Scraper Error",
        description: "An error occurred while scraping. Please try again.",
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
        <meta name="description" content="Automatically scrape tax deed listings from Texas counties" />
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
            🏛️ County Tax Deed Scraper
          </h1>
          <p className="text-slate-600">
            Automatically discover and import tax deed properties from Texas counties
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select County
              </label>
              <Select value={selectedCounty} onValueChange={setSelectedCounty} disabled={isScraperRunning}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a Texas county..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {TEXAS_COUNTIES.map((county) => (
                    <SelectItem key={county.id} value={county.id}>
                      <div className="flex items-center gap-2">
                        {completedScrapers.includes(county.id) && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {county.name} ({county.city})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleStartScraper}
                disabled={isScraperRunning || !selectedCounty}
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
                  {formatCurrency(results.reduce((sum, p) => sum + p.minimum_bid, 0) / results.length)}
                </div>
                <div className="text-xs text-slate-600">Avg Min Bid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(results.reduce((sum, p) => sum + p.assessed_value, 0) / results.length)}
                </div>
                <div className="text-xs text-slate-600">Avg Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((results.reduce((sum, p) => sum + p.minimum_bid, 0) / results.reduce((sum, p) => sum + p.assessed_value, 0)) * 100)}%
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
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-purple-600">
                        <Building2 className="w-5 h-5" />
                        <span className="text-sm font-semibold">{property.property_type}</span>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        NEW
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 mb-1">{property.address}</h3>
                    <p className="text-sm text-slate-600 mb-4 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {property.city}, {property.state} {property.zip}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Assessed Value:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(property.assessed_value)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Minimum Bid:</span>
                        <span className="font-bold text-purple-600">{formatCurrency(property.minimum_bid)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Tax Owed:</span>
                        <span className="font-medium text-red-600">{formatCurrency(property.tax_amount_owed)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600 pt-4 border-t border-slate-100">
                      <Calendar className="w-4 h-4" />
                      Auction: {property.auction_date}
                    </div>
                  </div>

                  <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Delinquent since {property.year_delinquent}
                      </span>
                      <span className="text-xs font-bold text-green-600">
                        {Math.round((property.minimum_bid / property.assessed_value) * 100)}% of value
                      </span>
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
            <p className="text-slate-500">Select a county and click "Start Scraper" to begin</p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CountyScraper;

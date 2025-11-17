import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Building, FileSearch, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PropertyLookupResult from '@/components/PropertyLookupResult';

const PropertyLookup = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setLookupResult(null);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smarty-autocomplete', {
        body: { query: value },
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const fullAddress = `${suggestion.street_line} ${suggestion.city}, ${suggestion.state} ${suggestion.zipcode}`;
    setSearchTerm(fullAddress);
    setSuggestions([]);
    handleFinalSearch(fullAddress);
  };

  const handleFinalSearch = async (addressToSearch) => {
    setIsSearching(true);
    setLookupResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('property-lookup', {
        body: { address: addressToSearch },
      });

      if (error) throw error;
      setLookupResult(data);
    } catch (error) {
      toast({
        title: 'Lookup Failed',
        description: 'Could not perform the property lookup. Please try again.',
        variant: 'destructive',
      });
      setLookupResult({ error: 'Failed to fetch data.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm) {
      setSuggestions([]);
      handleFinalSearch(searchTerm);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Property Lookup - Win With Deeds</title>
        <meta name="description" content="Instantly look up any property address to check its status in our database and get AI-powered insights." />
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <FileSearch className="w-16 h-16 mx-auto text-purple-600 mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">Property Lookup</h1>
            <p className="text-lg text-slate-600">
              Instantly check if a property is in our database and get a preliminary AI analysis.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative mb-4">
            <Input
              type="text"
              placeholder="Enter any U.S. property address..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-14 pl-12 pr-28 text-lg"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <Button type="submit" size="lg" className="absolute right-2 top-1/2 -translate-y-1/2" disabled={isSearching}>
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </Button>
          </form>

          {loading && (
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 mt-2">
              <div className="flex items-center text-slate-500">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Fetching address suggestions...</span>
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 mt-2">
              <ul>
                {suggestions.map((s, index) => (
                  <li key={index} className="p-4 hover:bg-slate-100 cursor-pointer border-b last:border-b-0" onClick={() => handleSuggestionClick(s)}>
                    {s.street_line} {s.city}, {s.state} {s.zipcode}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isSearching && (
            <div className="mt-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
              <p className="mt-4 text-slate-600 font-semibold">Searching our database and consulting our AI... this may take a moment.</p>
            </div>
          )}

          {lookupResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              <PropertyLookupResult result={lookupResult} />
            </motion.div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyLookup;
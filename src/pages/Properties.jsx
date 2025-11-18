import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

const Properties = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('opportunity_score_desc');
  const [filters, setFilters] = useState({
    propertyType: [],
    dealStage: [],
    minScore: 0,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    const minScore = params.get('minScore') || 0;
    setSearchTerm(search);
    setFilters(prev => ({ ...prev, minScore: Number(minScore) }));
  }, [location.search]);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*');

      if (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } else if (data && data.length > 0) {
        setProperties(data);
      } else {
        setProperties([]);
      }
      setLoading(false);
    };

    fetchProperties();
  }, []);

  const handleViewProperty = (id) => {
    navigate(`/property/${id}`);
  };

  const handleAction = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const handleFilterChange = (type, value) => {
    setFilters(prev => {
      const newValues = prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value];
      return { ...prev, [type]: newValues };
    });
  };

  const filteredAndSortedProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    let filtered = properties
      .filter(p => p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => filters.propertyType.length === 0 || filters.propertyType.includes(p.property_type))
      .filter(p => filters.dealStage.length === 0 || filters.dealStage.includes(p.deal_stage))
      .filter(p => (p.opportunity_score || 0) >= filters.minScore);

    switch (sortOption) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'roi_desc':
        filtered.sort((a, b) => b.roi - a.roi);
        break;
      case 'auction_date_asc':
        filtered.sort((a, b) => new Date(a.auction_date) - new Date(b.auction_date));
        break;
      case 'opportunity_score_desc':
        filtered.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [properties, searchTerm, sortOption, filters]);

  const propertyTypes = Array.isArray(properties) ? [...new Set(properties.map(p => p.property_type).filter(Boolean))] : [];
  const dealStages = Array.isArray(properties) ? [...new Set(properties.map(p => p.deal_stage).filter(Boolean))] : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>Properties - Win With Deeds</title>
        <meta name="description" content="Browse all available tax deed properties, including upcoming auctions and investor marketplace listings." />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">The Deal Stream</h1>
          <p className="text-slate-600">
            Explore a comprehensive list of tax deed properties, including upcoming auctions and exclusive investor marketplace listings.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search by address, city, or zip..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 w-full md:w-auto">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Property Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {propertyTypes.map(type => (
                  <DropdownMenuCheckboxItem key={type} checked={filters.propertyType.includes(type)} onCheckedChange={() => handleFilterChange('propertyType', type)}>
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Deal Stage</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {dealStages.map(stage => (
                  <DropdownMenuCheckboxItem key={stage} checked={filters.dealStage.includes(stage)} onCheckedChange={() => handleFilterChange('dealStage', stage)}>
                    {stage}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 w-full md:w-auto">
                  Sort By
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOption('opportunity_score_desc')}>Opportunity Score</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('auction_date_asc')}>Auction Date</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('price_asc')}>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('price_desc')}>Price: High to Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('roi_desc')}>Highest ROI</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          </div>
        ) : (
          filteredAndSortedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <PropertyCard
                    property={property}
                    onViewDetails={() => handleViewProperty(property.id)}
                    onPlaceBid={handleAction}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-md border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">No Properties Found</h2>
              <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Properties;
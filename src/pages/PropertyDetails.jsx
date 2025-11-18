import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Star, ArrowLeft, Bed, Bath, Maximize, Home, Building, LandPlot, PlusCircle, DollarSign, TrendingUp, School, Wind, Users, AlertTriangle, Gavel } from 'lucide-react';
import DealDossier from '@/components/DealDossier';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const StatPill = ({ icon, label, value, className }) => (
  <div className={`flex flex-col items-center justify-center bg-slate-100 rounded-xl p-4 text-center shadow-sm ${className}`}>
    <div className="flex items-center text-purple-600 mb-1">{icon}</div>
    <p className="text-xs text-slate-500 font-medium">{label}</p>
    <p className="text-md font-bold text-slate-800">{value}</p>
  </div>
);

const InfoCard = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        console.warn('Could not fetch from DB or property not found for property ID:', id);
        toast({
          title: "Error",
          description: "Could not find the requested property.",
          variant: "destructive",
        });
        navigate('/properties');
      } else {
        setProperty(data);
      }
      setLoading(false);
    };

    fetchProperty();
  }, [id, navigate]);

  const handleSaveToPipeline = async () => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please log in to save properties to your pipeline.", variant: "destructive" });
      navigate('/login');
      return;
    }
    if (!property) return;

    setIsSaving(true);
    
    let initialStageId = 1; 
    const { data: initialStage } = await supabase.from('pipeline_stages').select('id').order('sort_order').limit(1).single();
    if (initialStage) {
      initialStageId = initialStage.id;
    }

    const { data: existing, error: checkError } = await supabase
      .from('saved_properties')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', property.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      toast({ title: "Error", description: "Could not check pipeline.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    if (existing) {
      toast({ title: "Already in Pipeline", description: "This property is already saved to your pipeline." });
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from('saved_properties')
      .insert({
        user_id: user.id,
        property_id: property.id,
        pipeline_stage_id: initialStageId,
      });

    if (error) {
      toast({ title: "Error", description: "Failed to save property to pipeline.", variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Property saved to your pipeline.", className: "bg-green-100 text-green-800" });
      navigate('/my-pipeline');
    }
    setIsSaving(false);
  };

  const handlePlaceBid = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const getPropertyTypeIcon = (type) => {
    switch (type) {
      case 'Single Family': return <Home className="w-5 h-5 mr-2" />;
      case 'Condo': return <Building className="w-5 h-5 mr-2" />;
      case 'Land':
      case 'Lot': return <LandPlot className="w-5 h-5 mr-2" />;
      default: return <Home className="w-5 h-5 mr-2" />;
    }
  };

  const isInRem = property?.owner?.toLowerCase().includes('in rem');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!property) {
    return null; 
  }

  const mapPlaceholderUrl = `https://api.maptiler.com/maps/streets-v2/static/${property.longitude},${property.latitude},14/800x400.png?key=get-your-own-key`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{property.address} - Win With Deeds</title>
        <meta name="description" content={`Details for tax deed property at ${property.address}.`} />
      </Helmet>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-6 aspect-video">
                <img
                  className="w-full h-full object-cover"
                  alt={`Exterior view of property at ${property.address}`}
                  src={property.image_url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2000'} />
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {property.listing_type === 'auction' ? 'Upcoming Auction' : 'Marketplace Listing'}
                </div>
              </div>

              <InfoCard icon={<Home className="w-6 h-6 mr-3 text-purple-600" />} title="Property Overview">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{property.address}</h1>
                <div className="flex items-center text-slate-500 mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{property.address.split(',').slice(1).join(',').trim()}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{property.description}</p>
              </InfoCard>
            </motion.div>
            
            {isInRem && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <InfoCard icon={<Gavel className="w-6 h-6 mr-3 text-red-600" />} title="Judicial In Rem Foreclosure (GA)">
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4" role="alert">
                    <p className="font-bold">Key Advantage: Cleaner, Faster Ownership</p>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>The county files the case in Superior Court and a judge authorizes the sale.</li>
                      <li>The former owner has a very short redemption window (often just 60 days).</li>
                      <li>After redemption, title vests securely in the buyer—usually no quiet title action needed.</li>
                    </ul>
                  </div>
                </InfoCard>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <InfoCard icon={<MapPin className="w-6 h-6 mr-3 text-purple-600" />} title="Location & Map">
                <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative">
                  <img class="w-full h-full object-cover" alt={`Map view of ${property.address}`} src="https://images.unsplash.com/photo-1518487346609-25352f3e0c8c" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <Button variant="secondary" className="absolute bottom-4 right-4">Open Interactive Map</Button>
                </div>
              </InfoCard>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <InfoCard icon={<TrendingUp className="w-6 h-6 mr-3 text-purple-600" />} title="Neighborhood Insights">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatPill icon={<DollarSign size={20} />} label="Median Income" value={property.median_income ? `$${property.median_income.toLocaleString()}` : 'N/A'} />
                  <StatPill icon={<Users size={20} />} label="Population Density" value={property.population_density ? `${property.population_density}/mi²` : 'N/A'} />
                  <StatPill icon={<School size={20} />} label="Avg. School Rating" value={property.school_rating ? `${property.school_rating}/10` : 'N/A'} />
                  <StatPill icon={<Wind size={20} />} label="Environmental Risks" value={property.environmental_risks?.length || 0} />
                </div>
                {property.red_flags && property.red_flags.length > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                    <h4 className="font-bold flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Red Flags</h4>
                    <ul className="list-disc list-inside text-sm mt-2">
                      {property.red_flags.map((flag, i) => <li key={i}>{flag}</li>)}
                    </ul>
                  </div>
                )}
              </InfoCard>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <DealDossier property={property} />
            </motion.div>

          </div>

          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-24"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Opening Bid</p>
                    <p className="text-4xl font-extrabold text-slate-900">${Number(property.price || property.starting_bid).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                    <Star className="w-4 h-4 mr-1.5" />
                    {property.opportunity_score}/100
                  </div>
                </div>
                <div className="text-sm text-slate-500 mb-6">
                  Estimated Value: <span className="font-bold text-slate-700">${Number(property.estimated_value).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <StatPill icon={<Bed size={20} />} label="Beds" value={property.bedrooms || 'N/A'} />
                  <StatPill icon={<Bath size={20} />} label="Baths" value={property.bathrooms || 'N/A'} />
                  <StatPill icon={<Maximize size={20} />} label="SqFt" value={property.sqft ? property.sqft.toLocaleString() : 'N/A'} />
                </div>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600 flex items-center">Est. ROI</span>
                    <span className="font-bold text-green-600 text-base">{property.roi}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600 flex items-center">Auction Date</span>
                    <span className="font-bold text-slate-800">{new Date(property.auction_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600 flex items-center">{getPropertyTypeIcon(property.property_type)} Property Type</span>
                    <span className="font-bold text-slate-800">{property.property_type}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button size="lg" className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white" onClick={handlePlaceBid}>Place Bid / Make Offer</Button>
                  <Button size="lg" variant="outline" className="w-full" onClick={handleSaveToPipeline} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <PlusCircle className="w-5 h-5 mr-2" />}
                    Save to My Pipeline
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetails;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, TrendingUp, Zap, AlertTriangle, Mountain, ImageOff, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const PropertyCard = ({ property, onViewDetails, isSaved: initialIsSaved = false, onSaveToggle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isSaving, setIsSaving] = useState(false);
  const {
    address,
    price,
    estimated_value,
    auction_date,
    image_url,
    listing_type,
    opportunity_score,
    red_flags,
    property_type,
    bedrooms,
    bathrooms
  } = property;

  const potentialEquity = estimated_value - price;

  const handleSaveToggle = async (e) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to save properties to your pipeline.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    setIsSaving(true);

    if (isSaved) {
      // Unsave the property
      const { error } = await supabase
        .from('saved_properties')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', property.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove property from pipeline.",
          variant: "destructive"
        });
      } else {
        setIsSaved(false);
        toast({
          title: "Removed",
          description: "Property removed from your pipeline."
        });
        if (onSaveToggle) onSaveToggle(property.id, false);
      }
    } else {
      // Save the property
      let initialStageId = 1;
      const { data: initialStage } = await supabase
        .from('pipeline_stages')
        .select('id')
        .order('sort_order')
        .limit(1)
        .single();

      if (initialStage) {
        initialStageId = initialStage.id;
      }

      const { error } = await supabase
        .from('saved_properties')
        .insert({
          user_id: user.id,
          property_id: property.id,
          pipeline_stage_id: initialStageId
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Saved",
            description: "This property is already in your pipeline."
          });
          setIsSaved(true);
        } else {
          toast({
            title: "Error",
            description: "Failed to save property to pipeline.",
            variant: "destructive"
          });
        }
      } else {
        setIsSaved(true);
        toast({
          title: "Saved!",
          description: "Property added to your pipeline.",
          className: "bg-green-100 text-green-800"
        });
        if (onSaveToggle) onSaveToggle(property.id, true);
      }
    }

    setIsSaving(false);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full"
    >
      <div className="relative">
        {image_url ? (
          <img className="w-full h-48 object-cover" alt={address} src={image_url} />
        ) : (
          <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
            <ImageOff className="w-12 h-12 text-slate-400" />
          </div>
        )}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white ${listing_type === 'auction' ? 'bg-orange-500' : 'bg-green-500'}`}>
          {listing_type.toUpperCase()}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={handleSaveToggle}
            disabled={isSaving}
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${
              isSaved
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/90 text-slate-600 hover:bg-white hover:text-red-500'
            }`}
            title={isSaved ? "Remove from pipeline" : "Save to pipeline"}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          {red_flags && red_flags.length > 0 && (
            <div title={`${red_flags.length} Red Flag(s)`} className="px-2 py-1 rounded-full text-xs font-bold text-white bg-red-600/90 backdrop-blur-sm flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
            </div>
          )}
          {opportunity_score && (
            <div className="px-3 py-1 rounded-full text-xs font-bold text-white bg-yellow-500/90 backdrop-blur-sm flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {opportunity_score}
            </div>
          )}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-900 truncate mb-1">{address}</h3>
        <p className="text-sm text-slate-500 flex items-center mb-4">
          <MapPin className="w-4 h-4 mr-1.5" />
          {address.split(',').slice(1).join(',').trim()}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-blue-500" />
            <div>
              <p className="text-slate-500">Price</p>
              <p className="font-bold text-slate-800">${Number(price).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
            <div>
              <p className="text-slate-500">Equity</p>
              <p className="font-bold text-slate-800">${potentialEquity.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {(property_type !== 'Lot' && property_type !== 'Land') && (bedrooms || bathrooms) ? (
          <div className="text-xs text-slate-500 mb-4">
            {bedrooms} Beds • {bathrooms} Baths
          </div>
        ) : (
          <div className="text-xs text-slate-500 mb-4 flex items-center gap-2">
            <Mountain className="w-4 h-4 text-green-700" />
            <span>{property_type || 'Land/Lot'}</span>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <p className="text-slate-500">Auction Date</p>
              <p className="font-semibold text-slate-800">{new Date(auction_date).toLocaleDateString()}</p>
            </div>
            <Button onClick={onViewDetails} variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
              View Details
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
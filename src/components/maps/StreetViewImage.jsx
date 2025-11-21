import React, { useState, useEffect } from 'react';
import { getStreetViewUrl, isGoogleMapsConfigured, FALLBACK_PROPERTY_IMAGE } from '@/lib/googleMapsConfig';
import { MapPin, AlertCircle } from 'lucide-react';

/**
 * Street View Static Image Component
 * @param {Object} props
 * @param {number} props.latitude - Property latitude
 * @param {number} props.longitude - Property longitude
 * @param {string} props.address - Property address for alt text
 * @param {number} props.width - Image width (default 800)
 * @param {number} props.height - Image height (default 400)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.fallbackUrl - Fallback image URL
 */
const StreetViewImage = ({
  latitude,
  longitude,
  address,
  width = 800,
  height = 400,
  className = '',
  fallbackUrl = FALLBACK_PROPERTY_IMAGE,
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isGoogleMapsConfigured() || !latitude || !longitude) {
      setImageUrl(fallbackUrl);
      setIsLoading(false);
      return;
    }

    const streetViewUrl = getStreetViewUrl(latitude, longitude, width, height);

    // Check if Street View is available for this location
    const img = new Image();
    img.onload = () => {
      setImageUrl(streetViewUrl);
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setImageUrl(fallbackUrl);
      setIsLoading(false);
      setHasError(true);
    };
    img.src = streetViewUrl;
  }, [latitude, longitude, width, height, fallbackUrl]);

  if (!isGoogleMapsConfigured()) {
    return (
      <div className={`bg-slate-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 font-medium">Street View Unavailable</p>
          <p className="text-sm text-slate-500 mt-1">Configure Google Maps API key</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse rounded-lg"></div>
      )}
      <img
        src={imageUrl}
        alt={`Street view of ${address || 'property'}`}
        className={`w-full h-full object-cover rounded-lg ${className}`}
        onError={() => {
          if (imageUrl !== fallbackUrl) {
            setImageUrl(fallbackUrl);
            setHasError(true);
          }
        }}
      />
      {hasError && imageUrl === fallbackUrl && (
        <div className="absolute bottom-2 left-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Street View unavailable - showing placeholder
        </div>
      )}
    </div>
  );
};

export default StreetViewImage;

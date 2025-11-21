import React, { useState, useEffect } from 'react';
import { getStaticMapUrl, isGoogleMapsConfigured } from '@/lib/googleMapsConfig';
import { MapPin } from 'lucide-react';

/**
 * Static Map Image Component (lightweight, no JavaScript API)
 * @param {Object} props
 * @param {number} props.latitude - Property latitude
 * @param {number} props.longitude - Property longitude
 * @param {string} props.address - Property address for alt text
 * @param {number} props.width - Image width (default 800)
 * @param {number} props.height - Image height (default 400)
 * @param {number} props.zoom - Zoom level (default 15)
 * @param {string} props.className - Additional CSS classes
 */
const StaticMapImage = ({
  latitude,
  longitude,
  address,
  width = 800,
  height = 400,
  zoom = 15,
  className = '',
}) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (!isGoogleMapsConfigured() || !latitude || !longitude) {
      return;
    }

    const mapUrl = getStaticMapUrl(latitude, longitude, width, height, zoom);
    setImageUrl(mapUrl);
  }, [latitude, longitude, width, height, zoom]);

  if (!isGoogleMapsConfigured()) {
    return (
      <div className={`bg-slate-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 font-medium">Map Preview Unavailable</p>
          <p className="text-sm text-slate-500 mt-1">Configure Google Maps API key</p>
        </div>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className={`bg-slate-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 font-medium">Location Unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`Map view of ${address || 'property'}`}
      className={className}
      loading="lazy"
    />
  );
};

export default StaticMapImage;

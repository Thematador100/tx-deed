import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG, isGoogleMapsConfigured, DEFAULT_MAP_CENTER } from '@/lib/googleMapsConfig';
import { MapPin } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: false,
  fullscreenControl: true,
};

/**
 * Interactive Google Map component for property display
 * @param {Object} props
 * @param {number} props.latitude - Property latitude
 * @param {number} props.longitude - Property longitude
 * @param {string} props.address - Property address
 * @param {number} props.zoom - Initial zoom level (default 15)
 * @param {string} props.className - Additional CSS classes
 */
const PropertyMap = ({ latitude, longitude, address, zoom = 15, className = '' }) => {
  const [showInfo, setShowInfo] = useState(true);

  const center = {
    lat: latitude || DEFAULT_MAP_CENTER.lat,
    lng: longitude || DEFAULT_MAP_CENTER.lng,
  };

  const onLoad = useCallback((map) => {
    // Optional: You can store map instance if needed
  }, []);

  if (!isGoogleMapsConfigured()) {
    return (
      <div className={`bg-slate-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 font-medium">Map Preview Unavailable</p>
          <p className="text-sm text-slate-500 mt-1">Configure Google Maps API key to enable maps</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_CONFIG.apiKey} libraries={GOOGLE_MAPS_CONFIG.libraries}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          options={mapOptions}
          onLoad={onLoad}
        >
          <Marker
            position={center}
            onClick={() => setShowInfo(true)}
          />
          {showInfo && address && (
            <InfoWindow
              position={center}
              onCloseClick={() => setShowInfo(false)}
            >
              <div className="p-2">
                <p className="font-semibold text-slate-800">{address}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default PropertyMap;

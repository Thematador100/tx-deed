import React, { useEffect, useRef, useState } from 'react';
import { createMap, addMarker, loadGoogleMaps } from '../lib/googleMaps';

const PropertyMap = ({ properties = [], center, zoom = 12, height = '400px', onMarkerClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initMap();

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => {
        if (marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && properties.length > 0) {
      updateMarkers();
    }
  }, [properties]);

  const initMap = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine map center
      let mapCenter = center;
      if (!mapCenter && properties.length > 0) {
        const firstProperty = properties.find(p => p.latitude && p.longitude);
        if (firstProperty) {
          mapCenter = {
            lat: firstProperty.latitude,
            lng: firstProperty.longitude
          };
        }
      }

      // Default to Tampa, FL if no center provided
      if (!mapCenter) {
        mapCenter = { lat: 27.9506, lng: -82.4572 };
      }

      // Create map
      const map = await createMap(mapRef.current, {
        center: mapCenter,
        zoom: zoom
      });

      mapInstanceRef.current = map;

      // Add markers
      await updateMarkers();

      setLoading(false);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError(err.message || 'Failed to load map');
      setLoading(false);
    }
  };

  const updateMarkers = async () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // Add new markers
    for (const property of properties) {
      if (!property.latitude || !property.longitude) continue;

      try {
        const marker = await addMarker(mapInstanceRef.current, {
          position: {
            lat: property.latitude,
            lng: property.longitude
          },
          title: property.address,
          animation: google.maps.Animation.DROP
        });

        // Add click listener
        if (onMarkerClick) {
          marker.addListener('click', () => {
            onMarkerClick(property);
          });
        }

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${property.address}</h3>
              ${property.price ? `<p style="margin: 4px 0; font-size: 12px;">Price: $${property.price.toLocaleString()}</p>` : ''}
              ${property.estimated_value ? `<p style="margin: 4px 0; font-size: 12px;">Value: $${property.estimated_value.toLocaleString()}</p>` : ''}
              ${property.roi ? `<p style="margin: 4px 0; font-size: 12px; color: ${property.roi > 0 ? 'green' : 'red'};">ROI: ${property.roi}%</p>` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
      } catch (err) {
        console.error('Error adding marker:', err);
      }
    }

    // Fit bounds to show all markers
    if (markersRef.current.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
      >
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold mb-2">Failed to load map</p>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-500 mt-2">
            Please ensure Google Maps API key is configured in Admin &gt; API Keys
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative rounded-lg overflow-hidden border border-gray-300">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default PropertyMap;

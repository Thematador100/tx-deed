/**
 * Google Maps Platform Configuration
 *
 * This module provides configuration and utility functions for Google Maps integration.
 * Required APIs:
 * - Maps JavaScript API
 * - Places API
 * - Street View Static API
 * - Maps Static API
 */

export const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry'],
  version: 'weekly',
};

/**
 * Check if Google Maps API is configured
 */
export const isGoogleMapsConfigured = () => {
  return !!GOOGLE_MAPS_CONFIG.apiKey && GOOGLE_MAPS_CONFIG.apiKey !== 'your_google_maps_api_key_here';
};

/**
 * Get Street View Static API URL for a property
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} width - Image width (default 800)
 * @param {number} height - Image height (default 400)
 * @returns {string} Street View Static API URL
 */
export const getStreetViewUrl = (lat, lng, width = 800, height = 400) => {
  if (!isGoogleMapsConfigured()) {
    return null;
  }

  const params = new URLSearchParams({
    size: `${width}x${height}`,
    location: `${lat},${lng}`,
    fov: '90',
    pitch: '0',
    key: GOOGLE_MAPS_CONFIG.apiKey,
  });

  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
};

/**
 * Get Static Map API URL for a property
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} width - Image width (default 800)
 * @param {number} height - Image height (default 400)
 * @param {number} zoom - Zoom level (default 15)
 * @returns {string} Static Map API URL
 */
export const getStaticMapUrl = (lat, lng, width = 800, height = 400, zoom = 15) => {
  if (!isGoogleMapsConfigured()) {
    return null;
  }

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    maptype: 'roadmap',
    markers: `color:red|${lat},${lng}`,
    key: GOOGLE_MAPS_CONFIG.apiKey,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
};

/**
 * Get Place Photo URL (requires Place ID from Places API)
 * @param {string} photoReference - Photo reference from Places API
 * @param {number} maxWidth - Maximum width (default 800)
 * @returns {string} Place Photo API URL
 */
export const getPlacePhotoUrl = (photoReference, maxWidth = 800) => {
  if (!isGoogleMapsConfigured() || !photoReference) {
    return null;
  }

  const params = new URLSearchParams({
    photo_reference: photoReference,
    maxwidth: maxWidth.toString(),
    key: GOOGLE_MAPS_CONFIG.apiKey,
  });

  return `https://maps.googleapis.com/maps/api/place/photo?${params.toString()}`;
};

/**
 * Default fallback image for properties
 */
export const FALLBACK_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2000';

/**
 * Default map center (Dallas, TX)
 */
export const DEFAULT_MAP_CENTER = {
  lat: 32.7767,
  lng: -96.7970,
};

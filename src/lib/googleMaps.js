import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from './customSupabaseClient';

let loader = null;
let googleMapsApiKey = null;

/**
 * Initialize Google Maps API loader
 */
export async function initGoogleMaps() {
  if (!googleMapsApiKey) {
    // Fetch Google Maps API key from Supabase
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_api_key')
        .eq('service_name', 'google_maps')
        .single();

      if (error) {
        console.error('Error fetching Google Maps API key:', error);
        throw new Error('Google Maps API key not configured');
      }

      googleMapsApiKey = data.encrypted_api_key;
    } catch (err) {
      console.error('Failed to initialize Google Maps:', err);
      throw err;
    }
  }

  if (!loader) {
    loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });
  }

  return loader;
}

/**
 * Load Google Maps API
 */
export async function loadGoogleMaps() {
  const loaderInstance = await initGoogleMaps();
  return await loaderInstance.load();
}

/**
 * Geocode an address to lat/lng
 */
export async function geocodeAddress(address) {
  try {
    await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formatted_address: results[0].formatted_address
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Reverse geocode lat/lng to address
 */
export async function reverseGeocode(lat, lng) {
  try {
    await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            address: results[0].formatted_address,
            components: results[0].address_components
          });
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

/**
 * Create a map instance
 */
export async function createMap(element, options) {
  try {
    await loadGoogleMaps();

    const defaultOptions = {
      zoom: 15,
      center: { lat: 27.9506, lng: -82.4572 }, // Tampa, FL default
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      ...options
    };

    return new google.maps.Map(element, defaultOptions);
  } catch (error) {
    console.error('Error creating map:', error);
    throw error;
  }
}

/**
 * Add a marker to a map
 */
export async function addMarker(map, options) {
  try {
    await loadGoogleMaps();

    return new google.maps.Marker({
      map,
      ...options
    });
  } catch (error) {
    console.error('Error adding marker:', error);
    throw error;
  }
}

/**
 * Calculate distance between two points in miles
 */
export async function calculateDistance(point1, point2) {
  try {
    await loadGoogleMaps();

    const lat1 = new google.maps.LatLng(point1.lat, point1.lng);
    const lat2 = new google.maps.LatLng(point2.lat, point2.lng);

    const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(lat1, lat2);
    const distanceInMiles = distanceInMeters * 0.000621371;

    return distanceInMiles;
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw error;
  }
}

/**
 * Get nearby places (e.g., schools, hospitals, etc.)
 */
export async function getNearbyPlaces(location, type, radius = 1609) { // 1609 meters = 1 mile
  try {
    await loadGoogleMaps();

    const service = new google.maps.places.PlacesService(document.createElement('div'));

    return new Promise((resolve, reject) => {
      service.nearbySearch(
        {
          location: new google.maps.LatLng(location.lat, location.lng),
          radius,
          type
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            resolve(results);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting nearby places:', error);
    throw error;
  }
}

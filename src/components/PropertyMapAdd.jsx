import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { MapPin, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795 // Center of USA
};

const PropertyMapAdd = ({ onPropertyAdded }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [propertyData, setPropertyData] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: 'Single Family',
    price: '',
    estimated_value: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  const handleMapClick = useCallback(async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    setSelectedLocation({ lat, lng });

    // Try to reverse geocode the location
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const addressComponents = data.results[0].address_components;
        const formattedAddress = data.results[0].formatted_address;

        let address = '';
        let city = '';
        let state = '';
        let zipCode = '';

        addressComponents.forEach(component => {
          if (component.types.includes('street_number')) {
            address = component.long_name;
          }
          if (component.types.includes('route')) {
            address += ' ' + component.long_name;
          }
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
          if (component.types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });

        setPropertyData(prev => ({
          ...prev,
          address: address || formattedAddress,
          city,
          state,
          zip_code: zipCode,
        }));

        toast({
          title: 'Location Selected',
          description: `Address: ${address || formattedAddress}`,
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: 'Address Lookup',
        description: 'Could not find address. Please enter manually.',
        variant: 'default',
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPropertyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProperty = async () => {
    if (!selectedLocation) {
      toast({
        title: 'No Location Selected',
        description: 'Please click on the map to select a property location.',
        variant: 'destructive',
      });
      return;
    }

    if (!propertyData.address || !propertyData.city || !propertyData.state) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least address, city, and state.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([{
          address: propertyData.address,
          city: propertyData.city,
          state: propertyData.state,
          zip_code: propertyData.zip_code,
          property_type: propertyData.property_type,
          price: propertyData.price ? parseFloat(propertyData.price) : null,
          estimated_value: propertyData.estimated_value ? parseFloat(propertyData.estimated_value) : null,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          status: 'active',
          listing_type: 'marketplace',
          deal_stage: 'Lead',
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Property Added!',
        description: `${propertyData.address} has been added to your properties.`,
      });

      // Reset form
      setSelectedLocation(null);
      setPropertyData({
        address: '',
        city: '',
        state: '',
        zip_code: '',
        property_type: 'Single Family',
        price: '',
        estimated_value: '',
      });

      if (onPropertyAdded) {
        onPropertyAdded(data);
      }

    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Could not save property. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchAddress = async () => {
    const searchQuery = `${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zip_code}`;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const location = data.results[0].geometry.location;
        setMapCenter({ lat: location.lat, lng: location.lng });
        setSelectedLocation({ lat: location.lat, lng: location.lng });

        toast({
          title: 'Address Found',
          description: 'Map centered on the address.',
        });
      } else {
        toast({
          title: 'Address Not Found',
          description: 'Could not locate this address on the map.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: 'Search Failed',
        description: 'Could not search for address.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Map Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Select Property Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Click on the map to select a property location. The address will be automatically filled.
          </p>
          <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={12}
              onClick={handleMapClick}
            >
              {selectedLocation && (
                <Marker
                  position={selectedLocation}
                  animation={window.google?.maps?.Animation?.DROP}
                />
              )}
            </GoogleMap>
          </LoadScript>
          {selectedLocation && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Selected:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Address *</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  name="address"
                  value={propertyData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St"
                  className="flex-1"
                />
                <Button
                  onClick={handleSearchAddress}
                  variant="outline"
                  disabled={!propertyData.address}
                >
                  Search
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={propertyData.city}
                  onChange={handleInputChange}
                  placeholder="Houston"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={propertyData.state}
                  onChange={handleInputChange}
                  placeholder="TX"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  value={propertyData.zip_code}
                  onChange={handleInputChange}
                  placeholder="77001"
                />
              </div>
              <div>
                <Label htmlFor="property_type">Property Type</Label>
                <select
                  id="property_type"
                  name="property_type"
                  value={propertyData.property_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="Single Family">Single Family</option>
                  <option value="Multi-Family">Multi-Family</option>
                  <option value="Condo">Condo</option>
                  <option value="Land">Land</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Townhouse">Townhouse</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={propertyData.price}
                  onChange={handleInputChange}
                  placeholder="150000"
                />
              </div>
              <div>
                <Label htmlFor="estimated_value">Estimated Value</Label>
                <Input
                  id="estimated_value"
                  name="estimated_value"
                  type="number"
                  value={propertyData.estimated_value}
                  onChange={handleInputChange}
                  placeholder="200000"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveProperty}
              disabled={isSaving || !selectedLocation}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Property...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Add Property to Database
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              * Required fields
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyMapAdd;

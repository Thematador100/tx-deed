import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Loader2, Home } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    county: '',
    property_type: '',
    description: '',
    price: '',
    parcel_id: '',
    acreage: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    year_built: '',
    redemption_period_ends: '',
    sale_date: '',
    liens_amount: '',
    estimated_value: '',
  });

  const propertyTypes = [
    'Single Family',
    'Multi-Family',
    'Land/Lot',
    'Commercial',
    'Industrial',
    'Condo',
    'Townhouse',
    'Mobile Home',
  ];

  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add a listing.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Validation
    if (!formData.title || !formData.address || !formData.price) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in title, address, and price.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const listingData = {
      user_id: user.id,
      title: formData.title,
      address: formData.address,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zip_code || null,
      county: formData.county || null,
      property_type: formData.property_type || null,
      description: formData.description || null,
      price: parseFloat(formData.price),
      parcel_id: formData.parcel_id || null,
      acreage: formData.acreage ? parseFloat(formData.acreage) : null,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
      square_feet: formData.square_feet ? parseInt(formData.square_feet) : null,
      year_built: formData.year_built ? parseInt(formData.year_built) : null,
      redemption_period_ends: formData.redemption_period_ends || null,
      sale_date: formData.sale_date || null,
      liens_amount: formData.liens_amount ? parseFloat(formData.liens_amount) : null,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
      status: 'active',
    };

    const { data, error } = await supabase
      .from('user_listings')
      .insert([listingData])
      .select();

    if (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: `Failed to create listing: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your property listing has been created.",
      });
      navigate('/my-listings');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Helmet>
        <title>Add Property Listing - Win With Deeds</title>
        <meta name="description" content="List your tax deed property for sale on our marketplace." />
      </Helmet>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-slate-900 flex items-center mb-3">
                <Home className="w-10 h-10 mr-3 text-purple-600" />
                Add Your Property Listing
              </h1>
              <p className="text-lg text-slate-600">
                List your tax deed property on our marketplace and reach thousands of investors.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Fill in the information about your property. Fields marked with * are required.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Listing Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., 3 Bed 2 Bath Tax Deed in Atlanta"
                          value={formData.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Price (USD) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          placeholder="50000"
                          value={formData.price}
                          onChange={(e) => handleChange('price', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address *</Label>
                      <Input
                        id="address"
                        placeholder="123 Main Street"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="Atlanta"
                          value={formData.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Select value={formData.state} onValueChange={(value) => handleChange('state', value)}>
                          <SelectTrigger id="state">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zip_code">ZIP Code</Label>
                        <Input
                          id="zip_code"
                          placeholder="30301"
                          value={formData.zip_code}
                          onChange={(e) => handleChange('zip_code', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="county">County</Label>
                        <Input
                          id="county"
                          placeholder="Fulton"
                          value={formData.county}
                          onChange={(e) => handleChange('county', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="property_type">Property Type</Label>
                        <Select value={formData.property_type} onValueChange={(value) => handleChange('property_type', value)}>
                          <SelectTrigger id="property_type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {propertyTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parcel_id">Parcel ID</Label>
                        <Input
                          id="parcel_id"
                          placeholder="123-456-789"
                          value={formData.parcel_id}
                          onChange={(e) => handleChange('parcel_id', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        placeholder="Describe the property, its condition, potential, and any important details..."
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Property Characteristics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Property Characteristics</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          placeholder="3"
                          value={formData.bedrooms}
                          onChange={(e) => handleChange('bedrooms', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          step="0.5"
                          placeholder="2"
                          value={formData.bathrooms}
                          onChange={(e) => handleChange('bathrooms', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="square_feet">Square Feet</Label>
                        <Input
                          id="square_feet"
                          type="number"
                          placeholder="1500"
                          value={formData.square_feet}
                          onChange={(e) => handleChange('square_feet', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="year_built">Year Built</Label>
                        <Input
                          id="year_built"
                          type="number"
                          placeholder="2000"
                          value={formData.year_built}
                          onChange={(e) => handleChange('year_built', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="acreage">Acreage</Label>
                        <Input
                          id="acreage"
                          type="number"
                          step="0.01"
                          placeholder="0.25"
                          value={formData.acreage}
                          onChange={(e) => handleChange('acreage', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estimated_value">Estimated Value</Label>
                        <Input
                          id="estimated_value"
                          type="number"
                          step="0.01"
                          placeholder="100000"
                          value={formData.estimated_value}
                          onChange={(e) => handleChange('estimated_value', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tax Deed Specific */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Tax Deed Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sale_date">Tax Sale Date</Label>
                        <Input
                          id="sale_date"
                          type="date"
                          value={formData.sale_date}
                          onChange={(e) => handleChange('sale_date', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="redemption_period_ends">Redemption Period Ends</Label>
                        <Input
                          id="redemption_period_ends"
                          type="date"
                          value={formData.redemption_period_ends}
                          onChange={(e) => handleChange('redemption_period_ends', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="liens_amount">Outstanding Liens</Label>
                        <Input
                          id="liens_amount"
                          type="number"
                          step="0.01"
                          placeholder="5000"
                          value={formData.liens_amount}
                          onChange={(e) => handleChange('liens_amount', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating Listing...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-5 w-5" />
                          Create Listing
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AddListing;

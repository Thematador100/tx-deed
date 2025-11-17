import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Home,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Search,
  Users,
  FileText,
  DollarSign,
  Loader2
} from 'lucide-react';
import { verifyAddress, enrichPropertyData } from '@/services/melissaDataService';
import { skipTraceSingle, getAccountBalance } from '@/services/tracerfyService';

const BuyModule = () => {
  // Form state
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Results state
  const [verifiedAddress, setVerifiedAddress] = useState(null);
  const [skipTraceResults, setSkipTraceResults] = useState(null);
  const [propertyData, setPropertyData] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [tracerfyBalance, setTracerfyBalance] = useState(null);

  // Load Tracerfy balance on component mount
  React.useEffect(() => {
    loadTracerfyBalance();
  }, []);

  const loadTracerfyBalance = async () => {
    const result = await getAccountBalance();
    if (result.success) {
      setTracerfyBalance(result.data);
    }
  };

  const handleVerifyAddress = async () => {
    if (!address || !city || !state || !zip) {
      toast({
        title: "Missing Information",
        description: "Please fill in all address fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyAddress({ address, city, state, zip });

      if (result.success) {
        setVerifiedAddress(result.data);
        toast({
          title: "Address Verified",
          description: "Address has been validated and standardized",
        });
        setActiveTab('verified');
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Unable to verify address",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichProperty = async () => {
    if (!address || !city || !state || !zip) {
      toast({
        title: "Missing Information",
        description: "Please verify the address first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await enrichPropertyData({ address, city, state, zip });

      if (result.success) {
        setPropertyData(result.data);
        setVerifiedAddress(result.data);
        toast({
          title: "Property Data Loaded",
          description: "Property information has been enriched",
        });
        setActiveTab('property');
      } else {
        toast({
          title: "Enrichment Failed",
          description: result.error || "Unable to enrich property data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTrace = async () => {
    if (!address || !city || !state || !zip) {
      toast({
        title: "Missing Information",
        description: "Please verify the address first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await skipTraceSingle({ address, city, state, zip });

      if (result.success) {
        setSkipTraceResults(result.data);
        toast({
          title: "Skip Trace Complete",
          description: "Owner contact information has been retrieved",
        });
        setActiveTab('contacts');
        // Reload balance after skip trace
        loadTracerfyBalance();
      } else {
        toast({
          title: "Skip Trace Failed",
          description: result.error || "Unable to find owner information",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFullAnalysis = async () => {
    setLoading(true);
    try {
      // Run all services in sequence
      await handleVerifyAddress();
      await handleEnrichProperty();
      await handleSkipTrace();

      toast({
        title: "Analysis Complete",
        description: "Full property analysis has been completed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Buy Module - Property Research & Skip Tracing</title>
        <meta name="description" content="Comprehensive property research with address verification, property data enrichment, and owner skip tracing" />
      </Helmet>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center">
              <Home className="w-10 h-10 mr-3 text-blue-600" />
              Buy Module - Property Research Suite
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl">
              Comprehensive property research powered by Melissa Data and Tracerfy.
              Verify addresses, enrich property data, and find owner contact information all in one place.
            </p>
          </div>

          {/* Account Balance Display */}
          {tracerfyBalance && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="font-semibold text-slate-700">Tracerfy Credits:</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {tracerfyBalance.credits.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="search">
                <Search className="w-4 h-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="verified">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Verified
              </TabsTrigger>
              <TabsTrigger value="property">
                <FileText className="w-4 h-4 mr-2" />
                Property Data
              </TabsTrigger>
              <TabsTrigger value="contacts">
                <Users className="w-4 h-4 mr-2" />
                Contacts
              </TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Property Address Search</CardTitle>
                  <CardDescription>
                    Enter the property address to begin your research
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="CA"
                          value={state}
                          onChange={(e) => setState(e.target.value.toUpperCase())}
                          maxLength={2}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          placeholder="90210"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          maxLength={10}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <Button
                      onClick={handleVerifyAddress}
                      disabled={loading}
                      className="w-full"
                      variant="outline"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          Verify Address Only
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleEnrichProperty}
                      disabled={loading}
                      className="w-full"
                      variant="outline"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Get Property Data
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleSkipTrace}
                      disabled={loading}
                      className="w-full"
                      variant="outline"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 mr-2" />
                          Skip Trace Owner
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleFullAnalysis}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Full Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Verified Address Tab */}
            <TabsContent value="verified">
              <Card>
                <CardHeader>
                  <CardTitle>Address Verification Results</CardTitle>
                  <CardDescription>
                    Powered by Melissa Data Global Address Verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {verifiedAddress ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                          <span className="font-semibold text-green-900">
                            {verifiedAddress.verificationStatus}
                          </span>
                        </div>
                        <div className="text-lg font-medium text-slate-900">
                          {verifiedAddress.address}
                          {verifiedAddress.address2 && <>, {verifiedAddress.address2}</>}
                        </div>
                        <div className="text-slate-600">
                          {verifiedAddress.city}, {verifiedAddress.state} {verifiedAddress.zip}
                          {verifiedAddress.zip4 && `-${verifiedAddress.zip4}`}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {verifiedAddress.county && (
                          <div className="border rounded-lg p-3">
                            <div className="text-sm text-slate-500">County</div>
                            <div className="font-medium">{verifiedAddress.county}</div>
                          </div>
                        )}

                        {verifiedAddress.timezone && (
                          <div className="border rounded-lg p-3">
                            <div className="text-sm text-slate-500">Timezone</div>
                            <div className="font-medium">{verifiedAddress.timezone}</div>
                          </div>
                        )}

                        {verifiedAddress.latitude && (
                          <div className="border rounded-lg p-3">
                            <div className="text-sm text-slate-500">Coordinates</div>
                            <div className="font-medium text-sm">
                              {verifiedAddress.latitude}, {verifiedAddress.longitude}
                            </div>
                          </div>
                        )}

                        {verifiedAddress.addressType && (
                          <div className="border rounded-lg p-3">
                            <div className="text-sm text-slate-500">Address Type</div>
                            <div className="font-medium">{verifiedAddress.addressType}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No verified address data yet. Run address verification first.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Property Data Tab */}
            <TabsContent value="property">
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                  <CardDescription>
                    Enriched property data and details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {propertyData?.propertyData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(propertyData.propertyData).map(([key, value]) => (
                          value && (
                            <div key={key} className="border rounded-lg p-3">
                              <div className="text-sm text-slate-500 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              <div className="font-medium">{value}</div>
                            </div>
                          )
                        ))}
                      </div>

                      {!Object.values(propertyData.propertyData).some(Boolean) && (
                        <div className="text-center py-8 text-slate-500">
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p>Extended property data will be available with Melissa Property API integration</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No property data yet. Run property enrichment first.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle>Owner Contact Information</CardTitle>
                  <CardDescription>
                    Skip trace results powered by Tracerfy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {skipTraceResults ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-700">Confidence Score</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {(skipTraceResults.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Phone Numbers */}
                      {skipTraceResults.phones?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <Phone className="w-5 h-5 mr-2 text-slate-600" />
                            Phone Numbers ({skipTraceResults.phones.length})
                          </h3>
                          <div className="space-y-2">
                            {skipTraceResults.phones.map((phone, idx) => (
                              <div key={idx} className="border rounded-lg p-3 flex items-center justify-between">
                                <span className="font-medium">{phone}</span>
                                <a
                                  href={`tel:${phone}`}
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  Call
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Email Addresses */}
                      {skipTraceResults.emails?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <Mail className="w-5 h-5 mr-2 text-slate-600" />
                            Email Addresses ({skipTraceResults.emails.length})
                          </h3>
                          <div className="space-y-2">
                            {skipTraceResults.emails.map((email, idx) => (
                              <div key={idx} className="border rounded-lg p-3 flex items-center justify-between">
                                <span className="font-medium">{email}</span>
                                <a
                                  href={`mailto:${email}`}
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  Email
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Relatives */}
                      {skipTraceResults.relatives?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-slate-600" />
                            Related Contacts ({skipTraceResults.relatives.length})
                          </h3>
                          <div className="space-y-2">
                            {skipTraceResults.relatives.map((relative, idx) => (
                              <div key={idx} className="border rounded-lg p-3">
                                <div className="font-medium">{relative.name || relative}</div>
                                {relative.relation && (
                                  <div className="text-sm text-slate-500">{relative.relation}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {skipTraceResults.phones?.length === 0 &&
                       skipTraceResults.emails?.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p>No contact information found for this property owner</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No skip trace results yet. Run skip trace to find owner contacts.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Feature Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Address Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Validate and standardize addresses using Melissa Data's Global Address Verification.
                  Get accurate coordinates, county information, and delivery point validation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  Property Enrichment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Enrich property data with comprehensive information including property details,
                  assessed values, and market data from Melissa Data's property database.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Skip Tracing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Find property owner contact information with 97% accuracy using Tracerfy.
                  Get phone numbers, emails, and related contacts for outreach.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default BuyModule;

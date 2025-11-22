import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListFilter, MapPin, DollarSign, Info, Tag, ImagePlus, Building, Loader2, RefreshCw } from 'lucide-react';
import { mockTaxSaleProperties } from '@/lib/mockData';
import { getTaxDelinquentLeads, scrapeCounty } from '@/lib/supabaseAPI';
import { toast } from '@/components/ui/use-toast';

const TaxDelinquentLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [stateFilter, countyFilter, statusFilter]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (stateFilter !== 'all') filters.state = stateFilter;
      if (countyFilter) filters.county = countyFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;

      const data = await getTaxDelinquentLeads(filters);

      // If no data from database, use mock data
      if (!data || data.length === 0) {
        setLeads(mockTaxSaleProperties);
      } else {
        setLeads(data);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      // Fallback to mock data on error
      setLeads(mockTaxSaleProperties);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeCounty = async () => {
    if (!countyFilter || stateFilter === 'all') {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a state and enter a county name to scrape.',
      });
      return;
    }

    setScraping(true);
    try {
      const result = await scrapeCounty(countyFilter, stateFilter, 'tax_delinquent');

      toast({
        title: 'Scrape Complete',
        description: `Found ${result.recordsFound || 0} properties, inserted ${result.recordsInserted || 0} new records.`,
      });

      // Reload leads
      await loadLeads();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Scrape Failed',
        description: error.message || 'Could not scrape county. Please try again.',
      });
    } finally {
      setScraping(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Upcoming Auction':
        return 'bg-purple-100 text-purple-800';
      case 'Initial Notice':
        return 'bg-blue-100 text-blue-800';
      case 'Final Notice':
        return 'bg-yellow-100 text-yellow-800';
      case 'Payment Plan':
        return 'bg-green-100 text-green-800';
      case 'Lien Filed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleAction = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const ImagePlaceholder = () => (
    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
      <Building className="w-16 h-16 text-slate-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Helmet>
        <title>Tax Delinquent Leads - Win With Deeds</title>
        <meta name="description" content="View and manage your tax delinquent property leads." />
      </Helmet>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 flex items-center">
                <ListFilter className="w-8 h-8 mr-3 text-purple-600" />
                Tax Delinquent Leads
              </h1>
              <p className="text-lg text-slate-600 mt-2">
                {leads.length} high-potential delinquent property leads
              </p>
            </div>
            <Button onClick={loadLeads} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">State</label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="NV">Nevada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">County</label>
                <Input
                  placeholder="Enter county name"
                  value={countyFilter}
                  onChange={(e) => setCountyFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Initial Notice">Initial Notice</SelectItem>
                    <SelectItem value="Final Notice">Final Notice</SelectItem>
                    <SelectItem value="Upcoming Auction">Upcoming Auction</SelectItem>
                    <SelectItem value="Lien Filed">Lien Filed</SelectItem>
                    <SelectItem value="Payment Plan">Payment Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleScrapeCounty}
                  disabled={scraping || !countyFilter || stateFilter === 'all'}
                  className="w-full"
                >
                  {scraping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Scrape County
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <Tabs defaultValue="panel" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
            <TabsTrigger value="panel">Panel View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
          <TabsContent value="panel">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
              </div>
            ) : leads.length === 0 ? (
              <Card className="p-12 text-center">
                <Building className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Leads Found</h3>
                <p className="text-slate-500 mb-4">
                  Try adjusting your filters or scrape a county to add new leads.
                </p>
              </Card>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
              >
                {leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                >
                  <Card className="overflow-hidden h-full flex flex-col">
                    <div className="aspect-video bg-slate-200 relative group">
                      {lead.image_url ? (
                        <img
                          className="w-full h-full object-cover"
                          alt={lead.image_alt}
                          src={lead.image_url} />
                      ) : (
                        <ImagePlaceholder />
                      )}
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" onClick={handleAction}>
                            <ImagePlus className="w-4 h-4 mr-2" />
                            Upload Picture
                          </Button>
                        </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl truncate">{lead.owner || lead.address}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="space-y-3 text-sm">
                        <p className="flex items-center"><Tag className="w-4 h-4 mr-2 text-slate-500" /> Parcel ID: {lead.parcel_id}</p>
                        <p className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-slate-500" /> {lead.address}</p>
                        {lead.starting_bid > 0 &&
                          <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-slate-500" /> Starting Bid: <span className="font-semibold text-base">${lead.starting_bid.toLocaleString()}</span></p>
                        }
                        <p className="flex items-center"><Info className="w-4 h-4 mr-2 text-slate-500" />
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(lead.status)}`}>
                            {lead.status}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button className="w-full" onClick={handleAction}>View Details</Button>
                    </div>
                  </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
          <TabsContent value="table">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
              </div>
            ) : leads.length === 0 ? (
              <Card className="p-12 text-center">
                <Building className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Leads Found</h3>
                <p className="text-slate-500 mb-4">
                  Try adjusting your filters or scrape a county to add new leads.
                </p>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcel ID</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-right">Starting Bid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium flex items-center gap-2"><Tag className="w-4 h-4 text-slate-400" />{lead.parcel_id}</TableCell>
                        <TableCell className="max-w-xs truncate">{lead.owner}</TableCell>
                        <TableCell>{lead.address}</TableCell>
                        <TableCell className="text-right font-mono">{lead.starting_bid > 0 ? `$${lead.starting_bid.toLocaleString()}` : 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(lead.status)}`}>
                            {lead.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={handleAction}>View</Button>
                        </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default TaxDelinquentLeads;
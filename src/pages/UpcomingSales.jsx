import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CalendarIcon, MapPin, Loader2, Search, Filter, ExternalLink, Phone, Mail, DollarSign } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const UpcomingSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [saleType, setSaleType] = useState('all');

  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('upcoming_sales')
      .select('*')
      .order('sale_date', { ascending: true });

    if (error) {
      console.error('Error fetching sales:', error);
      // Use mock data if database query fails
      setSales(generateMockSales());
      toast({
        title: "Using Sample Data",
        description: "Displaying sample upcoming sales. Database not configured yet.",
      });
    } else {
      // Filter to only show future sales
      const futureSales = (data || []).filter(sale => isFuture(parseISO(sale.sale_date)));
      setSales(futureSales.length > 0 ? futureSales : generateMockSales());
    }
    setLoading(false);
  };

  const generateMockSales = () => {
    const today = new Date();
    return [
      {
        id: 1,
        state: 'GA',
        county: 'Fulton',
        sale_date: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sale_time: '10:00:00',
        location_name: 'Fulton County Courthouse',
        location_address: '136 Pryor Street SW, Atlanta, GA 30303',
        registration_deadline: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deposit_required: true,
        deposit_amount: 2500,
        sale_type: 'Tax Deed',
        num_properties: 47,
        website_url: 'https://www.fultoncountyga.gov',
        contact_phone: '(404) 612-8400',
        contact_email: 'taxcommissioner@fultoncountyga.gov',
      },
      {
        id: 2,
        state: 'FL',
        county: 'Miami-Dade',
        sale_date: new Date(today.getTime() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sale_time: '11:00:00',
        location_name: 'Online Auction',
        location_address: 'www.miamidade.realforeclose.com',
        registration_deadline: new Date(today.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deposit_required: true,
        deposit_amount: 5000,
        sale_type: 'Tax Deed',
        num_properties: 156,
        website_url: 'https://www.miamidade.realforeclose.com',
        contact_phone: '(305) 375-5207',
        contact_email: 'taxcollector@miamidade.gov',
      },
      {
        id: 3,
        state: 'AZ',
        county: 'Maricopa',
        sale_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sale_time: '09:00:00',
        location_name: 'Maricopa County Treasurer',
        location_address: '301 W Jefferson St, Phoenix, AZ 85003',
        registration_deadline: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deposit_required: false,
        sale_type: 'Tax Lien',
        num_properties: 203,
        website_url: 'https://treasurer.maricopa.gov',
        contact_phone: '(602) 506-8511',
        contact_email: 'treasurer@maricopa.gov',
      },
      {
        id: 4,
        state: 'TX',
        county: 'Harris',
        sale_date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sale_time: '10:00:00',
        location_name: 'Harris County Courthouse',
        location_address: '1001 Preston St, Houston, TX 77002',
        registration_deadline: new Date(today.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deposit_required: true,
        deposit_amount: 1000,
        sale_type: 'Sheriff Sale',
        num_properties: 89,
        website_url: 'https://www.cclerk.hctx.net',
        contact_phone: '(713) 274-8000',
        contact_email: 'info@cco.hctx.net',
      },
      {
        id: 5,
        state: 'CA',
        county: 'Los Angeles',
        sale_date: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sale_time: '14:00:00',
        location_name: 'Online via Bid4Assets',
        location_address: 'www.bid4assets.com/losangeles',
        registration_deadline: new Date(today.getTime() + 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deposit_required: true,
        deposit_amount: 3000,
        sale_type: 'Tax Deed',
        num_properties: 312,
        website_url: 'https://ttc.lacounty.gov',
        contact_phone: '(888) 807-2111',
        contact_email: 'ttc@ttc.lacounty.gov',
      },
    ];
  };

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch =
        sale.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.location_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = selectedState === 'all' || sale.state === selectedState;
      const matchesType = saleType === 'all' || sale.sale_type === saleType;

      return matchesSearch && matchesState && matchesType;
    });
  }, [sales, searchTerm, selectedState, saleType]);

  const getSaleTypeBadge = (type) => {
    switch (type) {
      case 'Tax Deed':
        return <Badge className="bg-purple-500">Tax Deed</Badge>;
      case 'Tax Lien':
        return <Badge className="bg-blue-500">Tax Lien</Badge>;
      case 'Sheriff Sale':
        return <Badge className="bg-orange-500">Sheriff Sale</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Helmet>
        <title>Nationwide Upcoming Sales - Win With Deeds</title>
        <meta name="description" content="Browse upcoming tax deed and tax lien sales across the United States." />
      </Helmet>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-slate-900 flex items-center mb-3">
              <CalendarIcon className="w-10 h-10 mr-3 text-purple-600" />
              Nationwide Upcoming Sales
            </h1>
            <p className="text-lg text-slate-600">
              Track tax deed, tax lien, and sheriff sales happening across the country. Updated weekly.
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Search by county or location..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={saleType} onValueChange={setSaleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sale Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Tax Deed">Tax Deed</SelectItem>
                    <SelectItem value="Tax Lien">Tax Lien</SelectItem>
                    <SelectItem value="Sheriff Sale">Sheriff Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sales List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            </div>
          ) : filteredSales.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CalendarIcon className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Sales Found</h3>
                <p className="text-slate-500">Try adjusting your filters or check back later.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredSales.map((sale, index) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl mb-2">
                            {sale.county} County, {sale.state}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            {getSaleTypeBadge(sale.sale_type)}
                            {sale.num_properties && (
                              <span className="text-sm text-slate-500">
                                {sale.num_properties} properties
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <CalendarIcon className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-lg text-slate-900">
                                {format(parseISO(sale.sale_date), 'MMMM d, yyyy')}
                              </p>
                              {sale.sale_time && (
                                <p className="text-sm text-slate-600">
                                  {format(parseISO(`2000-01-01T${sale.sale_time}`), 'h:mm a')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-start">
                            <MapPin className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-slate-900">{sale.location_name}</p>
                              {sale.location_address && (
                                <p className="text-sm text-slate-600">{sale.location_address}</p>
                              )}
                            </div>
                          </div>

                          {sale.deposit_required && (
                            <div className="flex items-start">
                              <DollarSign className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-slate-900">
                                  Deposit: ${sale.deposit_amount?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {sale.registration_deadline && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-yellow-900">Registration Deadline</p>
                              <p className="text-sm text-yellow-800">
                                {format(parseISO(sale.registration_deadline), 'MMMM d, yyyy')}
                              </p>
                            </div>
                          )}

                          {sale.contact_phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-slate-500 mr-2" />
                              <span className="text-sm text-slate-700">{sale.contact_phone}</span>
                            </div>
                          )}

                          {sale.contact_email && (
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 text-slate-500 mr-2" />
                              <a href={`mailto:${sale.contact_email}`} className="text-sm text-purple-600 hover:underline">
                                {sale.contact_email}
                              </a>
                            </div>
                          )}

                          {sale.website_url && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => window.open(sale.website_url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Visit Official Website
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default UpcomingSales;

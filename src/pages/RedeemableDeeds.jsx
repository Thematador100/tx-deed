import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileClock, MapPin, DollarSign, Info, Users, Building, BrainCircuit, Search as SearchIcon, TrendingUp, Calculator, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { format, differenceInDays, parseISO } from 'date-fns';

const RedeemableDeeds = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRedeemableDeeds = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'Redeemable')
        .order('redemption_date', { ascending: true });

      if (error) {
        console.error('Error fetching redeemable deeds:', error);
        toast({
          title: "Error loading deeds",
          description: "Please check your database connection.",
          variant: "destructive",
        });
        setLeads([]);
      } else {
        setLeads(data || []);
      }
      setLoading(false);
    };

    fetchRedeemableDeeds();
  }, []);

  const handleAction = (feature) => {
    toast({
      title: `🚀 ${feature} coming soon!`,
      description: "This automated feature is in development. You can request to prioritize it!"
    });
  };

  const ImagePlaceholder = () => (
    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
      <Building className="w-16 h-16 text-slate-400" />
    </div>
  );

  const DaysLeft = ({ dateString }) => {
    const days = differenceInDays(parseISO(dateString), new Date());
    const color = days < 30 ? 'text-red-500' : days < 90 ? 'text-yellow-500' : 'text-green-500';
    return <span className={`font-bold ${color}`}>{days} days</span>;
  };

  const calculateRedemption = (lead) => {
    if (lead.state === 'GA') {
      // Georgia: 20% penalty on the sale price
      const penalty = lead.sale_price * 0.20;
      return lead.sale_price + penalty;
    }
    // Default or other states can be added here
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Helmet>
        <title>Redeemable Deeds - Win With Deeds</title>
        <meta name="description" content="Track and analyze properties in their redemption period." />
      </Helmet>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 flex items-center">
              <FileClock className="w-8 h-8 mr-3 text-red-600" />
              Redeemable Deeds
            </h1>
            <p className="text-lg text-slate-600 mt-2">Your watchlist for properties in the redemption period.</p>
          </div>
          <Button onClick={() => handleAction('Import')}>
            Import Deeds
          </Button>
        </motion.div>

        <Tabs defaultValue="panel" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
            <TabsTrigger value="panel">Panel View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
          <TabsContent value="panel">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-md border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">No Redeemable Deeds Found</h2>
                <p className="text-slate-500 mt-2">Import deeds or search for properties in redemption period.</p>
              </div>
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
                {leads.map((lead) => {
                const redemptionAmount = calculateRedemption(lead);
                return (
                  <motion.div
                    key={lead.id}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 },
                    }}
                  >
                    <Card className="overflow-hidden h-full flex flex-col border-2 border-transparent hover:border-red-300 transition-colors">
                      <div className="aspect-video bg-slate-200 relative group">
                        <ImagePlaceholder />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl truncate">{lead.address}</CardTitle>
                        <p className="text-sm text-slate-500">Sold to: {lead.new_owner}</p>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-3 text-sm">
                        <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-slate-500" /> Sale Price: <span className="font-semibold text-base ml-1">${lead.sale_price.toLocaleString()}</span></p>
                        <p className="flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-green-500" /> Est. Value: <span className="font-semibold text-base ml-1 text-green-600">${lead.estimated_value.toLocaleString()}</span></p>
                        {redemptionAmount && (
                          <p className="flex items-center"><Calculator className="w-4 h-4 mr-2 text-blue-500" /> Est. Redemption: <span className="font-semibold text-base ml-1 text-blue-600">${redemptionAmount.toLocaleString()}</span></p>
                        )}
                        <p className="flex items-center"><Info className="w-4 h-4 mr-2 text-slate-500" /> Redemption Ends: <span className="font-semibold ml-1">{format(parseISO(lead.redemption_date), 'MMM d, yyyy')}</span> (<DaysLeft dateString={lead.redemption_date} />)</p>
                      </CardContent>
                      <div className="p-6 pt-0 grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => handleAction('Skip Trace')}>
                          <SearchIcon className="w-4 h-4 mr-2" /> Skip Trace
                        </Button>
                        <Button onClick={() => handleAction('AI Valuation')}>
                          <BrainCircuit className="w-4 h-4 mr-2" /> AI Valuation
                        </Button>
                      </div>
                    </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </TabsContent>
          <TabsContent value="table">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-md border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">No Redeemable Deeds Found</h2>
                <p className="text-slate-500 mt-2">Import deeds or search for properties in redemption period.</p>
              </div>
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
                        <TableHead>Address</TableHead>
                        <TableHead>New Owner</TableHead>
                        <TableHead className="text-right">Sale Price</TableHead>
                        <TableHead className="text-right">Est. Redemption</TableHead>
                        <TableHead>Redemption Ends</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => {
                      const redemptionAmount = calculateRedemption(lead);
                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.address}</TableCell>
                          <TableCell className="max-w-xs truncate">{lead.new_owner}</TableCell>
                          <TableCell className="text-right font-mono">${lead.sale_price.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-blue-600">
                            {redemptionAmount ? `$${redemptionAmount.toLocaleString()}` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{format(parseISO(lead.redemption_date), 'MMM d, yyyy')}</span>
                              <span className="text-xs"><DaysLeft dateString={lead.redemption_date} /> left</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleAction('Details')}>View</Button>
                          </TableCell>
                          </TableRow>
                        )
                      })}
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

export default RedeemableDeeds;
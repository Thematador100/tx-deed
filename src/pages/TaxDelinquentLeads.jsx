import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListFilter, MapPin, DollarSign, Info, Tag, ImagePlus, Building, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const TaxDelinquentLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tax_delinquent_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tax delinquent leads:', error);
      toast({
        title: "Error loading leads",
        description: "Could not load tax delinquent leads. Please try again.",
        variant: "destructive"
      });
      setLeads([]);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
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
      title: "Coming soon",
      description: "This feature will be available in a future update."
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
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 flex items-center">
              <ListFilter className="w-8 h-8 mr-3 text-purple-600" />
              Tax Delinquent Leads
            </h1>
            <p className="text-lg text-slate-600 mt-2">Your curated list of high-potential delinquent property leads.</p>
          </div>
          <Button onClick={handleAction}>
            Import Leads
          </Button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
          </div>
        ) : leads.length === 0 ? (
          <Card className="p-12 text-center">
            <Building className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Tax Delinquent Leads Yet</h2>
            <p className="text-slate-600 mb-6">Import leads or wait for the Scout Agent to find new opportunities.</p>
            <Button onClick={handleAction}>Import Leads</Button>
          </Card>
        ) : (
          <Tabs defaultValue="panel" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
              <TabsTrigger value="panel">Panel View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            <TabsContent value="panel">
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
                            alt={lead.address}
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
                        <CardTitle className="text-xl truncate">{lead.name || lead.address}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-3 text-sm">
                          {lead.parcel_id && <p className="flex items-center"><Tag className="w-4 h-4 mr-2 text-slate-500" /> Parcel ID: {lead.parcel_id}</p>}
                          <p className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-slate-500" /> {lead.address}</p>
                          {lead.delinquent_amount && lead.delinquent_amount > 0 &&
                            <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-slate-500" /> Delinquent: <span className="font-semibold text-base">${Number(lead.delinquent_amount).toLocaleString()}</span></p>
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
            </TabsContent>
            <TabsContent value="table">
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
                        <TableHead>Owner/Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-right">Delinquent Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <Tag className="w-4 h-4 text-slate-400" />
                            {lead.parcel_id || 'N/A'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{lead.name}</TableCell>
                          <TableCell>{lead.address}</TableCell>
                          <TableCell className="text-right font-mono">
                            {lead.delinquent_amount > 0 ? `$${Number(lead.delinquent_amount).toLocaleString()}` : 'N/A'}
                          </TableCell>
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
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TaxDelinquentLeads;

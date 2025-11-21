import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { HeartHandshake as Handshake, Loader2, Send, FileCheck, Clock, HelpCircle as CircleHelp, Award } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

const FundingPortal = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [savedProperties, setSavedProperties] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const { data: propsData, error: propsError } = await supabase
      .from('saved_properties')
      .select('id, properties(id, address, price, estimated_value, opportunity_score)')
      .eq('user_id', user.id);

    if (propsError) {
      toast({ title: "Error", description: "Could not fetch your saved properties.", variant: "destructive" });
    } else {
      setSavedProperties(propsData.map(p => p.properties).filter(Boolean));
    }

    const { data: subsData, error: subsError } = await supabase
      .from('funding_submissions')
      .select('*, properties(address)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (subsError) {
      toast({ title: "Error", description: "Could not fetch your submissions.", variant: "destructive" });
    } else {
      setSubmissions(subsData);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const preselectedPropertyId = location.state?.propertyId;
    if (preselectedPropertyId) {
      setSelectedPropertyId(preselectedPropertyId);
      setIsDialogOpen(true);
      setNotes("Applying for WinWithDeeds Capital for this elite deal.");
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !selectedPropertyId) {
      toast({ title: "Error", description: "Please select a property.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('funding_submissions')
      .insert({
        user_id: user.id,
        property_id: selectedPropertyId,
        notes: notes,
        status: 'Submitted'
      })
      .select('*, properties(address)')
      .single();

    if (error) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deal Submitted!", description: "Your deal has been sent to our funding partners." });
      setSubmissions([data, ...submissions]);
      setSelectedPropertyId('');
      setNotes('');
      setIsDialogOpen(false);
      navigate('/funding-portal', { replace: true, state: {} }); // Clear state
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Funding Partner Portal - Win With Deeds</title>
        <meta name="description" content="Submit your deals to a network of vetted hard money and private lenders." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center">
                <Handshake className="w-10 h-10 mr-3 text-purple-600" /> Funding Partner Portal
              </h1>
              <p className="text-lg text-slate-600">Submit your deals to our network of vetted lenders, including <span className="font-bold text-green-600">WinWithDeeds Capital</span>.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">Submit New Deal</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Submit a Deal for Funding</DialogTitle>
                  {savedProperties.find(p => p.id === selectedPropertyId)?.opportunity_score >= 95 && (
                     <DialogDescription className="flex items-center text-green-600 bg-green-50 p-3 rounded-md mt-2">
                       <Award className="w-5 h-5 mr-2" /> This is an elite deal, fast-tracked for WinWithDeeds Capital!
                     </DialogDescription>
                  )}
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="property">Select a Saved Property</Label>
                    <select
                      id="property"
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      required
                    >
                      <option value="" disabled>Choose a property...</option>
                      {savedProperties.map(prop => (
                        <option key={prop.id} value={prop.id}>{prop.address}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes for Lenders</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Include any relevant details about the deal, your exit strategy, etc."
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit to Lenders
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">My Submissions</h2>
              <p className="text-sm text-slate-500 mt-1">Track the status of your funding requests.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 font-semibold text-slate-800">Property</th>
                    <th className="p-4 font-semibold text-slate-800">Submitted</th>
                    <th className="p-4 font-semibold text-slate-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" /></td></tr>
                  ) : submissions.length === 0 ? (
                    <tr><td colSpan="3" className="text-center p-8 text-slate-500">You haven't submitted any deals for funding yet.</td></tr>
                  ) : (
                    submissions.map(sub => (
                      <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-medium text-slate-900">{sub.properties?.address || 'Property not found'}</td>
                        <td className="p-4 text-slate-600">{new Date(sub.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sub.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                            sub.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {sub.status === 'Submitted' && <Clock className="w-3 h-3 mr-1.5" />}
                            {sub.status === 'Under Review' && <CircleHelp className="w-3 h-3 mr-1.5" />}
                            {sub.status === 'Funded' && <FileCheck className="w-3 h-3 mr-1.5" />}
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default FundingPortal;
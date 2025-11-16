import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import AdminLayout from '@/pages/admin/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Check, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminAffiliates = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partner_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Could not fetch affiliate applications.", variant: "destructive" });
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = async (id, status) => {
    const { error } = await supabase
      .from('partner_applications')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: `Could not update application status.`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Application has been updated.` });
      fetchApplications();
    }
  };

  const ApplicationCard = ({ app }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{app.name}</h3>
          <a href={`mailto:${app.email}`} className="text-sm text-purple-600 hover:underline flex items-center gap-1">
            <Mail className="w-3 h-3" /> {app.email}
          </a>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
          app.status === 'approved' ? 'bg-green-100 text-green-800' :
          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {app.status || 'pending'}
        </span>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p><span className="font-semibold">Website:</span> <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{app.website}</a></p>
        <p><span className="font-semibold">Audience:</span> {app.audience_size}</p>
        <p><span className="font-semibold">Platform:</span> {app.platform}</p>
        {app.message && <p className="pt-2 border-t border-slate-100 mt-2"><span className="font-semibold">Message:</span> {app.message}</p>}
      </div>
      {(!app.status || app.status === 'pending') && (
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={() => handleStatusChange(app.id, 'approved')}>
            <Check className="w-4 h-4 mr-2" /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleStatusChange(app.id, 'rejected')}>
            <X className="w-4 h-4 mr-2" /> Reject
          </Button>
        </div>
      )}
    </div>
  );

  const renderTabContent = (status) => {
    const filteredApps = applications.filter(app => (app.status || 'pending') === status);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredApps.length > 0 ? (
          filteredApps.map(app => <ApplicationCard key={app.id} app={app} />)
        ) : (
          <p className="text-slate-500 col-span-full text-center py-8">No {status} applications.</p>
        )}
      </motion.div>
    );
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Manage Affiliates - Admin</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Affiliate Applications</h1>
        
        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              <TabsContent value="pending">{renderTabContent('pending')}</TabsContent>
              <TabsContent value="approved">{renderTabContent('approved')}</TabsContent>
              <TabsContent value="rejected">{renderTabContent('rejected')}</TabsContent>
            </>
          )}
        </Tabs>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminAffiliates;
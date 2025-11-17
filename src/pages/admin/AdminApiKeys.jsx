
import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import AdminLayout from '@/pages/admin/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Edit, Trash, KeyRound, Zap, Check, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const AdminApiKeys = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ service_name: '', encrypted_api_key: '' });
  const [testingService, setTestingService] = useState(null);

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_api_key_status');

    if (error) {
      toast({ title: "Error", description: "Could not fetch API key statuses.", variant: "destructive" });
      setApiKeys([]);
    } else {
      setApiKeys(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ service_name: '', encrypted_api_key: '' });
  };

  const handleOpenDialog = (key = null) => {
    if (key) {
      setFormData({ service_name: key.service_name, encrypted_api_key: '' });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { error } = await supabase.functions.invoke('manage-api-key', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (error) {
      toast({ title: "Save Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: `API Key for ${formData.service_name} saved to vault.` });
      setIsDialogOpen(false);
      fetchApiKeys();
    }
  };

  const handleDelete = async (serviceName) => {
    if (!window.confirm(`Are you sure you want to remove the API key for ${serviceName}? The key will be cleared from the vault.`)) return;
    
    const { error } = await supabase.functions.invoke('manage-api-key', {
      method: 'DELETE',
      body: JSON.stringify({ service_name: serviceName }),
    });

    if (error) {
      toast({ title: "Delete Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "API Key Removed" });
      fetchApiKeys();
    }
  };

  const handleTestConnection = async (serviceName) => {
    setTestingService(serviceName);
    try {
      const { data, error } = await supabase.functions.invoke('test-api-key', {
        body: { service: serviceName },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: 'Connection Successful!',
          description: data.message,
          action: <div className="p-2 bg-green-100 rounded-md"><Check className="h-5 w-5 text-green-600" /></div>,
        });
      } else {
        throw new Error(data.error || 'An unknown error occurred.');
      }
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
        action: <div className="p-2 bg-red-100 rounded-md"><AlertTriangle className="h-5 w-5 text-red-600" /></div>,
      });
    } finally {
      setTestingService(null);
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Manage API Keys - Admin</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">API Key Vault</h1>
            <p className="text-slate-600 mt-1">Securely store and manage API keys for all third-party services.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add/Update Key</Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add / Update API Key</DialogTitle>
              <DialogDescription>
                Enter the service name (e.g., 'smarty', 'openai') and the API key. This will add a new key or update an existing one.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service_name" className="text-right">Service</Label>
                <Input id="service_name" name="service_name" value={formData.service_name} onChange={handleInputChange} className="col-span-3" placeholder="e.g., smarty, openai" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="encrypted_api_key" className="text-right">API Key</Label>
                <Textarea id="encrypted_api_key" name="encrypted_api_key" value={formData.encrypted_api_key} onChange={handleInputChange} className="col-span-3" placeholder="Enter API Key" required />
              </div>
              <DialogFooter>
                <Button type="submit">Save to Vault</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-800">Service</th>
                  <th className="p-4 font-semibold text-slate-800">Status</th>
                  <th className="p-4 font-semibold text-slate-800">Last Updated</th>
                  <th className="p-4 font-semibold text-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" /></td></tr>
                ) : apiKeys.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-8 text-slate-500">No API services configured. Add a key to get started.</td></tr>
                ) : (
                  apiKeys.map((key) => (
                    <tr key={key.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900 flex items-center gap-2"><KeyRound className="w-4 h-4 text-yellow-500" /> {key.service_name}</td>
                      <td className="p-4 text-slate-600 font-mono">
                        {key.key_present ? (
                          <div className="flex items-center gap-2 text-green-600"><ShieldCheck className="w-5 h-5" /><span>Active</span></div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500"><ShieldOff className="w-5 h-5" /><span>Not Configured</span></div>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{key.updated_at ? new Date(key.updated_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-4 text-right space-x-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => handleTestConnection(key.service_name)}
                          disabled={testingService === key.service_name || !key.key_present}
                          title="Test Connection"
                        >
                          {testingService === key.service_name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(key)} title="Update Key"><Edit className="w-4 h-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(key.service_name)} disabled={!key.key_present} title="Remove Key"><Trash className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminApiKeys;
  
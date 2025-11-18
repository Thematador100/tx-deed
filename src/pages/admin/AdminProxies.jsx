import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import AdminLayout from '@/pages/admin/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Edit, Trash, Shield, Zap, Check, AlertTriangle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminProxies = () => {
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState(null);
  const [testingProxy, setTestingProxy] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    protocol: 'http',
    enabled: true,
    rotating: false,
  });

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would fetch from Supabase
    setProxies([
      {
        id: 1,
        name: 'Residential Proxy Pool 1',
        host: 'proxy.example.com',
        port: '8080',
        protocol: 'http',
        enabled: true,
        rotating: true,
        last_tested: '2025-01-15T10:30:00',
        status: 'active',
      },
      {
        id: 2,
        name: 'Datacenter Proxy',
        host: 'dc-proxy.example.com',
        port: '3128',
        protocol: 'https',
        enabled: false,
        rotating: false,
        last_tested: null,
        status: 'inactive',
      },
    ]);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '',
      username: '',
      password: '',
      protocol: 'http',
      enabled: true,
      rotating: false,
    });
    setEditingProxy(null);
  };

  const handleOpenDialog = (proxy = null) => {
    if (proxy) {
      setEditingProxy(proxy);
      setFormData({
        name: proxy.name,
        host: proxy.host,
        port: proxy.port,
        username: proxy.username || '',
        password: '',
        protocol: proxy.protocol,
        enabled: proxy.enabled,
        rotating: proxy.rotating,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // In a real app, this would save to Supabase
    toast({
      title: "Proxy Configuration Saved",
      description: `Proxy "${formData.name}" has been ${editingProxy ? 'updated' : 'added'} successfully.`,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (proxy) => {
    if (!window.confirm(`Are you sure you want to delete "${proxy.name}"?`)) return;

    toast({
      title: "Proxy Deleted",
      description: `"${proxy.name}" has been removed.`,
    });
  };

  const handleTestProxy = async (proxy) => {
    setTestingProxy(proxy.id);

    // Simulate test
    setTimeout(() => {
      const success = Math.random() > 0.3;

      if (success) {
        toast({
          title: 'Proxy Test Successful!',
          description: `Connected to ${proxy.host}:${proxy.port} successfully.`,
          action: <div className="p-2 bg-green-100 rounded-md"><Check className="h-5 w-5 text-green-600" /></div>,
        });
      } else {
        toast({
          title: 'Proxy Test Failed',
          description: 'Could not connect to proxy. Please check configuration.',
          variant: 'destructive',
          action: <div className="p-2 bg-red-100 rounded-md"><AlertTriangle className="h-5 w-5 text-red-600" /></div>,
        });
      }

      setTestingProxy(null);
    }, 1500);
  };

  const handleToggleProxy = (proxy) => {
    toast({
      title: proxy.enabled ? "Proxy Disabled" : "Proxy Enabled",
      description: `"${proxy.name}" is now ${proxy.enabled ? 'disabled' : 'enabled'}.`,
    });
  };

  return (
    <AdminLayout>
      <Helmet><title>Proxy Management - Admin</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Proxy Management</h1>
            <p className="text-slate-600 mt-1">Configure proxy servers for web scraping and data collection.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Proxy
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingProxy ? 'Edit' : 'Add'} Proxy Configuration</DialogTitle>
              <DialogDescription>
                Configure a proxy server for scraping county records and avoiding rate limits.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="e.g., Main Residential Pool"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="protocol" className="text-right">Protocol</Label>
                <Select value={formData.protocol} onValueChange={(value) => setFormData(prev => ({ ...prev, protocol: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="socks5">SOCKS5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="host" className="text-right">Host</Label>
                <Input
                  id="host"
                  name="host"
                  value={formData.host}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="proxy.example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="port" className="text-right">Port</Label>
                <Input
                  id="port"
                  name="port"
                  type="number"
                  value={formData.port}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="8080"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder={editingProxy ? "Leave blank to keep current" : "Optional"}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rotating" className="text-right">Rotating</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Switch
                    id="rotating"
                    checked={formData.rotating}
                    onCheckedChange={(checked) => handleSwitchChange('rotating', checked)}
                  />
                  <span className="text-sm text-slate-600">Enable IP rotation</span>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="enabled" className="text-right">Enabled</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => handleSwitchChange('enabled', checked)}
                  />
                  <span className="text-sm text-slate-600">Activate this proxy</span>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">{editingProxy ? 'Update' : 'Add'} Proxy</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-800">Name</th>
                  <th className="p-4 font-semibold text-slate-800">Endpoint</th>
                  <th className="p-4 font-semibold text-slate-800">Type</th>
                  <th className="p-4 font-semibold text-slate-800">Status</th>
                  <th className="p-4 font-semibold text-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" /></td></tr>
                ) : proxies.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-8 text-slate-500">No proxies configured. Add one to get started.</td></tr>
                ) : (
                  proxies.map((proxy) => (
                    <tr key={proxy.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500" /> {proxy.name}
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-sm">
                        {proxy.protocol}://{proxy.host}:{proxy.port}
                      </td>
                      <td className="p-4 text-slate-600">
                        {proxy.rotating ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">Rotating</span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-semibold">Static</span>
                        )}
                      </td>
                      <td className="p-4">
                        {proxy.enabled ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <Shield className="w-5 h-5" />
                            <span className="font-semibold">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Shield className="w-5 h-5" />
                            <span>Inactive</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTestProxy(proxy)}
                          disabled={testingProxy === proxy.id}
                          title="Test Proxy"
                        >
                          {testingProxy === proxy.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(proxy)}
                          title="Edit Proxy"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(proxy)}
                          title="Delete Proxy"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <h3 className="text-lg font-bold text-blue-900 mb-2">About Proxy Configuration</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Rotating Proxies:</strong> Automatically rotate IP addresses to avoid detection and rate limiting</li>
            <li>• <strong>Static Proxies:</strong> Use a consistent IP address for each request</li>
            <li>• <strong>Protocols:</strong> HTTP for basic scraping, SOCKS5 for advanced routing</li>
            <li>• <strong>Test:</strong> Always test proxies before enabling them for production scraping</li>
          </ul>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminProxies;


import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/pages/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { KeyRound, ArrowRight } from 'lucide-react';

const AdminIntegrations = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <Helmet><title>Manage Integrations - Admin</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Integrations</h1>
        <p className="text-slate-600 mb-8">Connect and manage third-party services to power up your platform.</p>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-3 rounded-lg">
              <KeyRound className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">API Key Vault</h2>
              <p className="text-sm text-slate-600 mt-1">Add, update, and test all your third-party API keys in one secure place.</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
            <Button onClick={() => navigate('/admin/api-keys')}>
              Manage API Keys <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminIntegrations;
  
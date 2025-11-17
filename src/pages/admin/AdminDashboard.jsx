import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AdminLayout from '@/pages/admin/AdminLayout';
import { Users, DollarSign, Activity, Bot, Library, Share2, HeartHandshake as Handshake, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    revenue: 0,
    subscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: revenueData, error: revenueError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'completed');

      let totalRevenue = 0;
      if (!revenueError && revenueData) {
        totalRevenue = revenueData.reduce((sum, tx) => sum + tx.amount, 0);
      }

      const { count: subsCount, error: subsError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .like('product_name', '%Plan%');


      setStats({
        users: userError ? 0 : userCount,
        revenue: totalRevenue,
        subscriptions: subsError ? 0 : subsCount,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats.users.toLocaleString(), icon: Users, color: 'blue' },
    { title: 'Total Revenue', value: `$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'green' },
    { title: 'Active Subscriptions', value: stats.subscriptions.toLocaleString(), icon: Activity, color: 'purple' },
  ];

  const quickLinks = [
    { title: 'AI Workforce', href: '/admin/ai-workforce', icon: Bot, description: 'Monitor and manage all AI agents.' },
    { title: 'Manage Users', href: '/admin/users', icon: Users, description: 'View, edit, and manage all user accounts.' },
    { title: 'Affiliates', href: '/admin/affiliates', icon: Handshake, description: 'Review and manage partner applications.' },
    { title: 'View Transactions', href: '/admin/transactions', icon: DollarSign, description: 'Browse all payment and subscription history.' },
    { title: 'Resource Library', href: '/admin/library', icon: Library, description: 'Add or remove content from the resource library.' },
    { title: 'Integrations', href: '/admin/integrations', icon: Share2, description: 'Connect and manage third-party APIs.' },
    { title: 'API Key Vault', href: '/admin/api-keys', icon: KeyRound, description: 'Securely manage your API keys.' },
  ];

  return (
    <AdminLayout>
      <Helmet>
        <title>Admin Dashboard - Win With Deeds</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div key={index} className={`bg-white p-6 rounded-xl shadow-md border border-slate-200`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${stat.color}-100`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map(link => (
            <Link key={link.href} to={link.href} className="block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-200 hover:border-purple-300">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center"><link.icon className="mr-3 text-purple-600"/>{link.title}</h2>
              <p className="text-slate-600">{link.description}</p>
            </Link>
          ))}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
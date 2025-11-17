
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ShieldCheck, Key, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const SetupAdmin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both an email and a password.",
      });
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('force-admin-setup', {
        body: { email, password },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Admin Account Secured!",
          description: "Your admin account has been successfully created or updated. Please log in.",
        });
        navigate('/login');
      } else {
        throw new Error(data.message || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error("Admin setup failed:", error);
      toast({
        variant: "destructive",
        title: "Admin Setup Failed",
        description: error.message || "Could not set up the admin account. Please contact support.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Helmet>
        <title>Admin Setup - Win With Deeds</title>
        <meta name="description" content="One-time secure setup for the site administrator." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl border border-slate-200"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Secure Admin Setup</h1>
          <p className="text-slate-600">Create your master administrator account. This is a one-time process.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-800 flex items-center"><Mail className="w-4 h-4 mr-2" />Admin Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500"
              placeholder="Enter your admin email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-800 flex items-center"><Key className="w-4 h-4 mr-2" />Admin Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500"
              placeholder="Choose a strong password"
              required
              minLength="6"
            />
            <p className="text-xs text-slate-500">Minimum 6 characters.</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
          >
            {loading ? "Securing Account..." : "Create Admin Account"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default SetupAdmin;


import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import LibrarianChat from '@/components/LibrarianChat';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin');
      } else {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
      }
    }
  }, [user, profile, authLoading, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Verifying credentials...",
      description: "Please wait while we check your admin status.",
    });
    // The useEffect will handle redirection once the profile is loaded.
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <Helmet>
        <title>Admin Login - Win With Deeds</title>
      </Helmet>
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-slate-400">Enter your credentials to access the control panel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              {(loading || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading || authLoading ? "Authenticating..." : "Secure Sign In"}
            </Button>
          </form>
           <div className="text-center text-sm">
              <Link to="/" className="text-slate-400 hover:text-slate-200">
                &larr; Back to main site
              </Link>
            </div>
        </motion.div>
      </div>
      <LibrarianChat />
    </div>
  );
};

export default AdminLogin;
  
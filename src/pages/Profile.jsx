import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const Profile = () => {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
      setEmail(user.email || '');
    }
  }, [user, authLoading, navigate]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
    });

    if (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated!",
        description: "Your profile information has been successfully saved.",
      });
    }
    setIsSaving(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>Profile - TaxDeeds Pro</title>
        <meta name="description" content="Manage your TaxDeeds Pro user profile, update personal information, and view account settings." />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Your Profile</h1>

          <div className="flex flex-col items-center mb-8">
            <Avatar className="h-24 w-24 border-4 border-purple-500 mb-4">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-purple-100 text-purple-700 text-4xl font-bold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold text-slate-900">{fullName || 'Investor'}</h2>
            <p className="text-slate-600">{email}</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-800">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-slate-50 border-slate-300 text-slate-900"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-800">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl" className="text-slate-800">Avatar URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="bg-slate-50 border-slate-300 text-slate-900"
                placeholder="https://example.com/your-avatar.jpg"
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-semibold py-3 rounded-lg transition-all duration-200"
            >
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
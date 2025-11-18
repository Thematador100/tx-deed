import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Users, DollarSign, Target, BarChart, Loader2, BrainCircuit, ShieldCheck, GitBranch, Fingerprint, Banknote, Gauge, Sparkles } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-6 rounded-xl shadow-lg border border-slate-200"
  >
    <div className="flex items-center gap-4 mb-3">
      <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
    </div>
    <p className="text-slate-600 text-sm">{description}</p>
  </motion.div>
);

const AffiliateProgram = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    audience_size: '',
    platform: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('partner_applications').insert(formData);
    if (error) {
      toast({ title: "Error", description: "Could not submit your application. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Application Submitted!", description: "We've received your application and will be in touch soon." });
      setFormData({ name: '', email: '', website: '', audience_size: '', platform: '', message: '' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>Affiliate Program - Win With Deeds</title>
        <meta name="description" content="Partner with Win With Deeds and earn by promoting the leading tax deed investment platform." />
      </Helmet>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 flex items-center justify-center">
            <Users className="w-12 h-12 mr-4 text-purple-600" /> The Industry's Most Intelligent Partner Program
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-4xl mx-auto">
            We're not building an affiliate program. We're building a sovereign, data-rich partner engine from the ground up. This is your invitation to join a new class of partnership.
          </p>
        </motion.div>

        <div className="space-y-16 mb-20">
          <div>
            <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3"><BrainCircuit className="w-8 h-8 text-blue-600" />Module 1: The Attribution & Tracking Core</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard icon={GitBranch} title="Multi-Touch Attribution" description="Go beyond 'last-click'. Our system supports First-Click, Last-Click, and Linear models to fairly reward your entire funnel." delay={0.2} />
              <FeatureCard icon={Fingerprint} title="Cookieless & Probabilistic Tracking" description="Future-proof tracking using first-party data, IP fingerprinting, and unique user IDs. We don't miss a thing." delay={0.3} />
              <FeatureCard icon={ShieldCheck} title="Secure Link Generation" description="A dedicated microservice for creating unique, memorable, and secure affiliate links with custom Sub-ID support." delay={0.4} />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3"><Banknote className="w-8 h-8 text-green-600" />Module 2: The Commission & Payout Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard icon={DollarSign} title="Dynamic Commission Rules" description="Flexible, admin-controlled rules for recurring revenue, performance bonuses, and tiered payouts without code changes." delay={0.5} />
              <FeatureCard icon={Target} title="Automated Payout & Compliance" description="Secure, API-driven payouts via Stripe Connect, with automated approval logic and tax form (W-9/1099) generation." delay={0.6} />
              <FeatureCard icon={BarChart} title="Fintech-Grade Precision" description="Built with the security and accuracy of a financial application to ensure you get paid correctly, every time." delay={0.7} />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3"><Gauge className="w-8 h-8 text-orange-600" />Module 3: The Partner Cockpit</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard icon={Sparkles} title="Real-Time Granular Analytics" description="An event-driven dashboard that feels alive. See your clicks, referrals, and sales register the moment they happen." delay={0.8} />
              <FeatureCard icon={BrainCircuit} title="Predictive Performance Forecasting" description="Our AI analyzes your traffic patterns to forecast your monthly earnings, helping you optimize your campaigns." delay={0.9} />
              <FeatureCard icon={Users} title="Deep Integration & 'Smart Assets'" description="Get a 'Referral Health' monitor and AI-powered recommendations on which content is converting best right now." delay={1.0} />
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-2xl border border-slate-200"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Become a Founding Partner</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website or Social Media URL</Label>
              <Input id="website" name="website" value={formData.website} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="audience_size">Audience Size</Label>
                <Input id="audience_size" name="audience_size" value={formData.audience_size} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="platform">Primary Platform (e.g., YouTube, Blog)</Label>
                <Input id="platform" name="platform" value={formData.platform} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Tell us about your audience and why you want to partner</Label>
              <Textarea id="message" name="message" value={formData.message} onChange={handleInputChange} />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply Now
            </Button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AffiliateProgram;
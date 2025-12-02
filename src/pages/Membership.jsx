import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, BookOpen, Video, FileText, Loader2, Users, Zap, RefreshCw, Star, BrainCircuit, UserCheck, Layers, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 text-center"
  >
    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 text-sm">{description}</p>
  </motion.div>
);

const Membership = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [libraryItems, setLibraryItems] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  useEffect(() => {
    const fetchLibraryItems = async () => {
      setLoadingLibrary(true);
      const { data, error } = await supabase
        .from('library_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) {
        console.error("Error fetching library items:", error);
        toast({ title: "Error", description: "Could not load library resources.", variant: "destructive" });
      } else {
        setLibraryItems(data);
      }
      setLoadingLibrary(false);
    };
    fetchLibraryItems();
  }, []);

  const tiers = [
    {
      name: 'Pro Investor',
      price: '$99',
      // TODO: Replace with your real Stripe Price ID from: https://dashboard.stripe.com/products
      // Create a recurring price for $99/month in your Stripe dashboard and paste the price_xxx ID here
      priceId: 'price_1P5qYgRxxxxxxxxxxxxxxxxx',
      description: 'For active investors who need the core toolset.',
      features: [
        'Full Access to Property Database',
        'Basic AI Deal Analysis',
        'Buyer-Match Graph (10 searches/mo)',
        'Standard Support'
      ],
      cta: 'Choose Pro',
      primary: false,
    },
    {
      name: 'Mentee Elite',
      price: '$299',
      // TODO: Replace with your real Stripe Price ID from: https://dashboard.stripe.com/products
      // Create a recurring price for $299/month in your Stripe dashboard and paste the price_xxx ID here
      priceId: 'price_1P5qZgRxxxxxxxxxxxxxxxxx',
      description: 'For dedicated mentees seeking an unfair advantage.',
      features: [
        'Everything in Pro Investor',
        'AI Dispo Copilot & Deal Microsites',
        'Deal Rescue Engine (3 deals/mo)',
        'Exclusive Mentee-Only Webinars',
        'Direct Q&A with Mentors',
        'Priority Support'
      ],
      cta: 'Become Elite',
      primary: true,
    },
    {
      name: 'Syndicate',
      price: 'Contact Us',
      priceId: null,
      description: 'For teams and high-volume operators.',
      features: [
        'Everything in Mentee Elite',
        'Unlimited AI Tool Usage',
        'Team Accounts & Collaboration',
        'API Access',
        'Dedicated Account Manager'
      ],
      cta: 'Contact Sales',
      primary: false,
    }
  ];

  const handleChoosePlan = (tier) => {
    if (user) {
      navigate('/member-dashboard');
      toast({ title: "Welcome Back!", description: "You are already a member. Exploring your dashboard." });
      return;
    }
    if (tier.priceId) {
      navigate('/checkout', { state: { tier } });
    } else {
      toast({
        title: "Contact Us for Custom Plans",
        description: "Please get in touch to discuss our Syndicate options.",
      });
      navigate('/contact');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-6 h-6 text-red-500" />;
      case 'pdf': return <FileText className="w-6 h-6 text-blue-500" />;
      default: return <BookOpen className="w-6 h-6 text-green-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>Membership - Win With Deeds</title>
        <meta name="description" content="Unlock exclusive AI-powered tools, resources, and mentorship to accelerate your tax deed investment success." />
      </Helmet>
      <Navbar />
      <main>
        <div className="relative bg-gradient-to-b from-purple-50 via-white to-slate-50 pt-20 pb-24">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Your Unfair Advantage in <span className="text-purple-600">Tax Deed Investing</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10">
                Stop guessing. Start winning. Our platform combines elite mentorship with a powerful AI toolkit to find, analyze, and flip deals faster than ever before.
              </p>
              <Button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} size="lg" className="text-lg px-10 py-7 bg-purple-600 hover:bg-purple-700 text-white shadow-lg">
                View Plans & Get Started
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900">An Entire AI Workforce at Your Fingertips</h2>
              <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">These aren't just features; they're your automated team of experts.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<UserCheck className="w-8 h-8 text-purple-600" />}
                title="Scout AI Agents"
                description="Deploy autonomous agents that hunt for deals 24/7 based on your exact criteria."
                delay={0.1}
              />
              <FeatureCard 
                icon={<ShieldCheck className="w-8 h-8 text-indigo-600" />}
                title="AI Deal Dossier"
                description="Get instant due diligence reports, including title summaries and red flag analysis."
                delay={0.2}
              />
              <FeatureCard 
                icon={<Users className="w-8 h-8 text-blue-600" />}
                title="Buyer-Match Graph"
                description="Instantly find the top 20 most likely buyers for any property in your portfolio."
                delay={0.3}
              />
              <FeatureCard 
                icon={<Zap className="w-8 h-8 text-green-600" />}
                title="AI Dispo Copilot"
                description="Generate one-click deal microsites and compliant outreach campaigns to sell faster."
                delay={0.4}
              />
              <FeatureCard 
                icon={<RefreshCw className="w-8 h-8 text-red-600" />}
                title="Deal Rescue Engine"
                description="Revive stalled deals with new pricing strategies and fresh buyer lists from our AI."
                delay={0.5}
              />
              <FeatureCard 
                icon={<Layers className="w-8 h-8 text-orange-600" />}
                title="AI Property Uploader"
                description="Upload any property list (CSV, PDF) and let our AI parse, clean, and import it for you."
                delay={0.6}
              />
            </div>
          </div>
        </div>

        <div id="pricing" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900">Choose Your Weapon</h2>
              <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">Select the plan that aligns with your ambition. Cancel anytime.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {tiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`flex flex-col rounded-2xl border p-8 ${tier.primary ? 'bg-white shadow-2xl border-purple-500 ring-4 ring-purple-200' : 'bg-white shadow-lg border-slate-200'}`}
                >
                  {tier.primary && (
                    <div className="text-center mb-4 -mt-12">
                      <span className="bg-purple-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md">Most Popular</span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">{tier.name}</h3>
                  <p className="text-slate-600 text-center mb-6 h-10">{tier.description}</p>
                  <p className="text-5xl font-extrabold text-slate-900 text-center mb-6">
                    {tier.price}
                    {tier.price.startsWith('$') && <span className="text-base font-medium text-slate-500">/ month</span>}
                  </p>
                  <ul className="space-y-4 mb-8 flex-grow">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleChoosePlan(tier)}
                    size="lg"
                    className={`w-full text-lg py-6 ${tier.primary ? 'bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
                  >
                    {user ? 'Go to Dashboard' : tier.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center flex items-center justify-center">
              <BookOpen className="w-8 h-8 mr-3 text-purple-600" /> From the Exclusive Resource Library
            </h2>
            {loadingLibrary ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {libraryItems.map(item => (
                  <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="h-40 bg-cover bg-center" style={{backgroundImage: `url(${item.thumbnail_url})`}}></div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
                          {getIcon(item.item_type)}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">{item.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Membership;

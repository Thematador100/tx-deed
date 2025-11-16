import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Globe, DollarSign, Image, FileText } from 'lucide-react';

const DealMicrosite = () => {
  const handleAction = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>AI Dispo Copilot - TaxDeeds Pro</title>
        <meta name="description" content="Generate price recommendations, one-click microsites, and compliant outreach sequences with AI assistance." />
      </Helmet>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center">
            <Globe className="w-10 h-10 mr-3 text-indigo-600" /> AI Dispo Copilot
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl">
            Your intelligent assistant for property disposition. The AI Dispo Copilot helps you with price recommendations, generates stunning one-click microsites for each deal, and crafts compliant outreach sequences.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-600" /> Price Recommendation
              </h2>
              <p className="text-slate-700">
                Get data-driven price recommendations based on comps and investor yield ranges, ensuring you list your property at the optimal price.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <Image className="w-6 h-6 mr-2 text-purple-600" /> One-Click Microsite
              </h2>
              <p className="text-slate-700">
                Generate a professional, branded microsite for each deal with compelling copy, high-quality photos, and key underwriting highlights. Includes a CTA and NDA gate.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-blue-600" /> Compliant Outreach
              </h2>
              <p className="text-slate-700">
                Auto-generate compliant 10DLC/SMS and email sequences with built-in STOP/quiet hours, ensuring effective and legal communication.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={handleAction} size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-lg px-8 py-6 shadow-lg">
              Launch Your Deal Now
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DealMicrosite;
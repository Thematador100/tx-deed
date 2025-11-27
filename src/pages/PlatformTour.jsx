import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { X, Rocket, UserCheck, ShieldCheck, Users, Zap, RefreshCw, Layers, FileSearch, Columns, Calendar, HeartHandshake as Handshake, Terminal, ShoppingCart, ListFilter, FileClock } from 'lucide-react';

const features = [
  {
    id: 'scout-ai',
    icon: UserCheck,
    title: 'Scout AI Agents',
    description: 'Deploy autonomous agents that hunt for deals 24/7 based on your exact criteria, from specific counties to minimum opportunity scores. Your personal deal-finding army never sleeps.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
        path: '/scout-agent',
  },
  {
    id: 'dossier',
    icon: ShieldCheck,
    title: 'AI Deal Dossier',
    description: 'Get instant, comprehensive due diligence reports. Our AI summarizes title information, checks for liens, analyzes court records, and flags potential red flags, saving you hours of manual research.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
        path: '/deal-dossier',
  },
  {
    id: 'buyer-match',
    icon: Users,
    title: 'Buyer-Match Graph',
    description: 'Instantly find the top 20 most likely cash buyers for any property in your portfolio. Our AI analyzes public records to connect you with investors who have a proven track record of buying similar properties in that exact area.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
        path: '/buyer-match',
  },
  {
    id: 'dispo-copilot',
    icon: Zap,
    title: 'AI Dispo Copilot',
    description: 'Generate stunning, one-click deal microsites complete with AI-generated copy, underwriting highlights, and an NDA gate. Also creates compliant email and SMS outreach campaigns to sell your deals faster.',
    color: 'text-green-500',
    bg: 'bg-green-50',
        path: '/deal-microsite',
  },
  {
    id: 'deal-rescue',
    icon: RefreshCw,
    title: 'Deal Rescue Engine',
    description: 'Is a deal going stale? The Deal Rescue Engine analyzes what went wrong, suggests new pricing strategies, and generates a fresh list of potential buyers who might have been overlooked.',
    color: 'text-red-500',
    bg: 'bg-red-50',
        path: '/deal-rescue',
  },
  {
    id: 'uploader',
    icon: Layers,
    title: 'AI Property Uploader',
    description: 'Have a list from Regrid, PropWire, or a county website? Just upload the file (CSV, PDF, etc.) and our AI will automatically parse, clean, and import the properties into your account.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    id: 'lookup',
    icon: FileSearch,
    title: 'Property Lookup',
    description: 'Quickly check any US address to see if it\'s already in our database, view its history, and get a preliminary AI analysis on its potential as a tax deed investment.',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
        path: '/property-lookup',
  },
  {
    id: 'pipeline',
    icon: Columns,
    title: 'Visual Pipeline',
    description: 'Manage your deals from research to closing with a drag-and-drop Kanban board. Includes a pre-flight checklist to ensure you never miss a critical step before an auction.',
    color: 'text-teal-500',
    bg: 'bg-teal-50',
        path: '/my-pipeline',
  },
  {
    id: 'calendar',
    icon: Calendar,
    title: 'Integrated Calendar',
    description: 'All your important dates in one place. Automatically tracks auction dates and redemption period deadlines for every property in your pipeline.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
        path: '/calendar',
  },
  {
    id: 'funding',
    icon: Handshake,
    title: 'Funding Portal',
    description: 'Submit your best deals directly to our network of vetted hard money lenders and private capital partners, including our own in-house fund, WinWithDeeds Capital.',
    color: 'text-amber-500',
        path: '/funding-portal',
    bg: 'bg-amber-50',
  },
  {
    id: 'dev-hub',
    icon: Terminal,
    title: 'Developer Hub',
    description: 'For power users and teams, our Developer Hub allows you to connect your own custom scrapers and tools directly to our backend via a secure API.',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
        path: '/developer-hub',
  },
  {
    id: 'marketplace',
    icon: ShoppingCart,
    title: 'Lead Marketplace',
    description: 'A peer-to-peer marketplace for buying and selling high-quality, vetted tax deed leads. Monetize your research or find deals in new markets.',
    color: 'text-lime-500',
    bg: 'bg-lime-50',
        path: '/lead-marketplace',
  },
];

const PlatformTour = () => {
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  const selectedFeature = features.find(f => f.id === selectedId);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Platform Tour - Win With Deeds</title>
        <meta name="description" content="An interactive tour of the powerful AI-driven features of the Win With Deeds platform." />
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Rocket className="w-16 h-16 mx-auto text-purple-600 mb-4" />
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4">
            The Win With Deeds Platform Tour
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            This is more than a tool; it's an entire AI-powered ecosystem for tax deed investing. Click any feature to learn more.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              layoutId={feature.id}
              onClick={() => setSelectedId(feature.id)}
              className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${feature.bg}`}
            >
              <feature.icon className={`w-10 h-10 mb-3 ${feature.color}`} />
              <h3 className={`text-lg font-bold ${feature.color}`}>{feature.title}</h3>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedId && selectedFeature && (
            <motion.div
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                layoutId={selectedId}
                className={`relative w-full max-w-2xl rounded-2xl p-8 shadow-2xl ${selectedFeature.bg}`}
              >
                <motion.button
                  onClick={() => setSelectedId(null)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
                  whileHover={{ scale: 1.1 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
                <div className="flex items-start gap-6">
                  <selectedFeature.icon className={`w-16 h-16 flex-shrink-0 ${selectedFeature.color}`} />
                  <div>
                    <motion.h2 className={`text-3xl font-bold mb-2 ${selectedFeature.color}`}>{selectedFeature.title}</motion.h2>
                    <motion.p className="text-slate-700 leading-relaxed">{selectedFeature.description}</motion.p>
                  </div>
                </div>
                <motion.div className="mt-6 text-right">
                  <Button onClick={() => navigate(selectedFeature.path || '/membership')} className="bg-purple-600 hover:bg-purple-700 text-white">
                    Unlock This Feature
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-24 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900">Ready to Dominate Your Market?</h2>
          <p className="text-lg text-slate-600 mt-4 max-w-xl mx-auto">
            Stop leaving money on the table. Join the elite investors using AI to build their portfolios.
          </p>
          <Button onClick={() => navigate('/membership')} size="lg" className="mt-8 text-lg px-10 py-7 bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg">
            View Membership Plans
          </Button>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default PlatformTour;

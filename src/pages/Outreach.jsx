import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Mail, MessageSquare, Users, BrainCircuit, Target } from 'lucide-react';
import Footer from '@/components/Footer';

const Outreach = () => {
  const handleAction = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>AI-Powered Outreach - TaxDeeds Pro</title>
        <meta name="description" content="Automate compliant 10DLC/SMS and email sequences for your deals with built-in quiet hours and STOP functionality." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 flex items-center justify-center">
              <BrainCircuit className="w-12 h-12 mr-4 text-purple-600" /> AI-Powered Outreach
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Let the "Outreach" AI agent act as your marketing strategist. It intelligently segments your audience and crafts hyper-personalized campaigns to maximize engagement and drive action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md text-center">
              <Users className="w-10 h-10 mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Intelligent Segmentation</h2>
              <p className="text-slate-600 text-sm">The AI analyzes user behavior to create dynamic segments like "Inactive Florida Investors" or "High-Potential Buyers."</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md text-center">
              <Target className="w-10 h-10 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Hyper-Personalization</h2>
              <p className="text-slate-600 text-sm">Drafts unique emails for each segment. "Hi John, noticed you liked properties in Miami. Here are 3 new deals..."</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md text-center">
              <Mail className="w-10 h-10 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Automated Triggers</h2>
              <p className="text-slate-600 text-sm">Sends emails based on user actions: new sign-ups, saved properties, or abandoned checkouts to re-engage users.</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Powered by Best-in-Class Deliverability Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="text-xl font-bold text-slate-900 mb-3 flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2 text-purple-600" /> 10DLC/SMS Sequences
                </h4>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li>Auto-generated SMS campaigns for rapid buyer engagement.</li>
                  <li>Built-in "STOP" functionality for immediate opt-out compliance.</li>
                  <li>Automated quiet hours to respect recipient preferences.</li>
                </ul>
                <p className="text-xs text-slate-500 mt-4">Powered by <span className="font-bold text-red-600">Twilio</span> for maximum deliverability.</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="text-xl font-bold text-slate-900 mb-3 flex items-center">
                  <Mail className="w-6 h-6 mr-2 text-blue-600" /> Email Campaigns
                </h4>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li>Professionally crafted email templates for various deal stages.</li>
                  <li>Automated follow-up sequences to nurture leads.</li>
                  <li>Compliance checks for CAN-SPAM and other regulations.</li>
                </ul>
                <p className="text-xs text-slate-500 mt-4">Powered by <span className="font-bold text-blue-600">SendGrid</span> for enterprise-grade reliability.</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Button onClick={handleAction} size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-lg px-8 py-6 shadow-lg">
                Launch AI Campaign
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Outreach;
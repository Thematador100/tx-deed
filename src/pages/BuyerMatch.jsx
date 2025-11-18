import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Users, TrendingUp, Target, HelpCircle } from 'lucide-react';

const BuyerMatch = () => {
  const handleAction = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Buyer-Match Graph - TaxDeeds Pro</title>
        <meta name="description" content="Leverage AI to match your deals with the top 20 buyers in any micro-market, complete with personalized reasons." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center">
            <Users className="w-10 h-10 mr-3 text-purple-600" /> Buyer-Match Graph
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl">
            Our AI-powered Buyer-Match Graph analyzes deed and flip records, along with property features, to rank the most likely buyers for your specific deal in any micro-market. Get personalized reasons and direct introductions to close faster.
          </p>

          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-xl mb-12">
            <h3 className="font-bold text-lg flex items-center mb-2"><HelpCircle className="w-5 h-5 mr-2" />How to Use This Tool</h3>
            <p className="text-sm">
              <strong>1. Enter Property Details:</strong> Start by providing the address and key features of the property you want to sell.
              <br />
              <strong>2. Run Analysis:</strong> Our AI will scan millions of data points to find investors who have recently bought similar properties in the area.
              <br />
              <strong>3. Get Your List:</strong> Receive a ranked list of the top 20 potential buyers, complete with contact info and the AI's reasoning for the match.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-600" /> How it Works
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li>Upload your deal details and property features.</li>
                <li>Our AI analyzes historical transaction data.</li>
                <li>Receive a ranked list of top 20 buyers for your deal.</li>
                <li>Get personalized insights into why each buyer is a good fit.</li>
                <li>Initiate direct introductions through the platform.</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <Target className="w-6 h-6 mr-2 text-blue-600" /> Key Benefits
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li>**Auto-Demand:** Generate instant buyer interest.</li>
                <li>**Precision Matching:** Connect with buyers who actually close.</li>
                <li>**Save Time:** Eliminate manual buyer research and outreach.</li>
                <li>**Maximize Profit:** Find the best buyer for the best price.</li>
                <li>**Network Expansion:** Discover new, active investors.</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={handleAction} size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-lg px-8 py-6 shadow-lg">
              Find Your Buyers Now
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default BuyerMatch;
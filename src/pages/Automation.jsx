import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { FileText, ClipboardCheck, HeartHandshake as Handshake, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Automation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAutomateWorkflow = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access automation features.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    toast({
      title: "Automation Coming Soon!",
      description: "Document automation features are currently under development. Check your pipeline for now.",
      duration: 4000
    });
    navigate('/my-pipeline');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>Doc & Process Automation - Win With Deeds</title>
        <meta name="description" content="Automate assignments, addenda, POF requests, and escrow handoffs with templated and prefilled documents." />
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
            <FileText className="w-10 h-10 mr-3 text-green-600" /> Doc & Process Automation
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl">
            Streamline your entire deal closing process with intelligent document and workflow automation. From assignments to escrow handoffs, our system ensures accuracy and efficiency.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <ClipboardCheck className="w-6 h-6 mr-2 text-purple-600" /> Templated Documents
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li>Pre-filled assignments and addenda for quick generation.</li>
                <li>Automated Proof of Funds (POF) requests.</li>
                <li>Customizable templates to fit your specific needs.</li>
                <li>Ensures legal compliance and reduces errors.</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
                <Handshake className="w-6 h-6 mr-2 text-blue-600" /> Escrow Handoff
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li>Seamless integration with escrow services.</li>
                <li>Automated transfer of all necessary documentation.</li>
                <li>Track the status of your escrow process in real-time.</li>
                <li>Reduces administrative burden and speeds up closing.</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={handleAutomateWorkflow} size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-lg px-8 py-6 shadow-lg">
              Automate Your Workflow
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Automation;
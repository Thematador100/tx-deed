import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Bot, Loader2, PlusCircle, Power, PowerOff, RefreshCw, Clock, Newspaper, Landmark, BrainCircuit, Microscope } from 'lucide-react';

const AIWorkforce = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const analystAgents = [
    { id: 'analyst-openai', source_name: 'OpenAI Analyst', source_type: 'LLM Processor', status: 'Active', last_run_at: new Date(Date.now() - 3600 * 1000 * 0.5).toISOString() },
    { id: 'analyst-google', source_name: 'Google AI Analyst', source_type: 'LLM Processor', status: 'Active', last_run_at: new Date(Date.now() - 3600 * 1000 * 0.7).toISOString() },
    { id: 'analyst-deepseek', source_name: 'Deep Seek Analyst', source_type: 'LLM Processor', status: 'Active', last_run_at: new Date(Date.now() - 3600 * 1000 * 0.9).toISOString() },
  ];

  useEffect(() => {
    const fetchLeadSources = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lead sources:', error);
        toast({
          title: "Error",
          description: "Could not fetch lead sources.",
          variant: "destructive",
        });
      } else {
        const existingTypes = new Set(data.map(d => d.source_type));
        let enhancedData = [...data];
        if (!existingTypes.has('News API Scraper')) {
            enhancedData.push({ id: 'temp-news', source_name: 'National News Scraper', source_type: 'News API Scraper', status: 'Active', last_run_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString() });
        }
        if (!existingTypes.has('Legislation Monitor')) {
            enhancedData.push({ id: 'temp-leg', source_name: 'State Legislation Monitor', source_type: 'Legislation Monitor', status: 'Active', last_run_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString() });
        }
        setSources(enhancedData);
      }
      setLoading(false);
    };

    fetchLeadSources();
  }, []);

  const handleAction = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };
  
  const timeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  const getSourceIcon = (type) => {
    switch (type) {
      case 'County Scraper': return <Bot className="w-5 h-5 text-purple-600" />;
      case 'News API Scraper': return <Newspaper className="w-5 h-5 text-blue-600" />;
      case 'Legislation Monitor': return <Landmark className="w-5 h-5 text-green-600" />;
      case 'LLM Processor': return <BrainCircuit className="w-5 h-5 text-orange-500" />;
      default: return <Bot className="w-5 h-5 text-gray-600" />;
    }
  };

  const AgentTable = ({ title, description, agents, loading, icon }) => (
    <div className="mb-16">
      <div className="flex items-center mb-4">
        {icon}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-600">{description}</p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-800">Agent Mission</th>
                <th className="p-4 font-semibold text-slate-800">Type</th>
                <th className="p-4 font-semibold text-slate-800">Status</th>
                <th className="p-4 font-semibold text-slate-800">Last Sync</th>
                <th className="p-4 font-semibold text-slate-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                      <span className="ml-4 text-slate-600">Loading Agents...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                agents.map((agent, index) => (
                  <motion.tr
                    key={agent.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.05 * index }}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                      {getSourceIcon(agent.source_type)}
                      {agent.source_name}
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-200 rounded-full">
                        {agent.source_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        agent.status === 'Active' ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 flex items-center gap-2"><Clock className="w-4 h-4" />{timeAgo(agent.last_run_at)}</td>
                    <td className="p-4 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={handleAction}>
                        {agent.status === 'Active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleAction}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Force Sync
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>AI Workforce - Win With Deeds</title>
        <meta name="description" content="Manage and monitor your automated AI 'Scout' and 'Analyst' agents." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-12"
        >
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 flex items-center">
              <BrainCircuit className="w-10 h-10 mr-4 text-purple-600" /> AI Workforce
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl">
              Your command center for the AI teams that find and analyze your deals.
            </p>
          </div>
          <Button onClick={handleAction} size="lg">
            <PlusCircle className="w-5 h-5 mr-2" /> Deploy New Agent
          </Button>
        </motion.div>

        <AgentTable 
          title="Scout Agents"
          description="This team of data foragers finds raw data from across the web."
          agents={sources}
          loading={loading}
          icon={<Bot className="w-8 h-8 mr-4 text-purple-600" />}
        />

        <AgentTable 
          title="Analyst Agents"
          description="This team processes and enriches the raw data found by the Scouts."
          agents={analystAgents}
          loading={false}
          icon={<Microscope className="w-8 h-8 mr-4 text-orange-600" />}
        />

      </main>
      <Footer />
    </div>
  );
};

export default AIWorkforce;
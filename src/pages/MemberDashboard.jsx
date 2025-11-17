import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, BookOpen, Video, FileText, Users, Zap, RefreshCw, Star, Settings, Bell } from 'lucide-react';
import MemberProfilePanel from '@/components/MemberProfilePanel';

const MemberDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleToolClick = (path) => {
    if (path) {
      navigate(path);
    } else {
      toast({
        title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
      });
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-6 h-6 text-red-500" />;
      case 'pdf': return <FileText className="w-6 h-6 text-blue-500" />;
      default: return <BookOpen className="w-6 h-6 text-green-500" />;
    }
  };

  const userName = profile?.full_name || user?.email;
  const memberTier = "Mentee Elite"; // This would be dynamic in a real app

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Helmet>
        <title>Member Dashboard - Win With Deeds</title>
        <meta name="description" content="Your exclusive member dashboard with access to premium tools and resources." />
      </Helmet>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Member Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome, {userName}! Let's find your next winning deal.</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4" />
              <span>{memberTier} Member</span>
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowProfilePanel(true)}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Premium Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">Your Premium Toolkit</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => handleToolClick('/buyer-match')} className="flex flex-col items-center text-center space-y-2 p-4 bg-slate-50 hover:bg-purple-100 rounded-xl transition-colors border border-slate-200 hover:border-purple-200 w-full">
                  <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
                  <span className="text-slate-800 font-semibold text-sm">Buyer-Match Graph</span>
                </button>
                <button onClick={() => handleToolClick('/deal-microsite')} className="flex flex-col items-center text-center space-y-2 p-4 bg-slate-50 hover:bg-indigo-100 rounded-xl transition-colors border border-slate-200 hover:border-indigo-200 w-full">
                  <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 rounded-lg"><Zap className="w-5 h-5 text-indigo-600" /></div>
                  <span className="text-slate-800 font-semibold text-sm">AI Dispo Copilot</span>
                </button>
                <button onClick={() => handleToolClick('/deal-rescue')} className="flex flex-col items-center text-center space-y-2 p-4 bg-slate-50 hover:bg-red-100 rounded-xl transition-colors border border-slate-200 hover:border-red-200 w-full">
                  <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg"><RefreshCw className="w-5 h-5 text-red-600" /></div>
                  <span className="text-slate-800 font-semibold text-sm">Deal Rescue Engine</span>
                </button>
              </div>
            </motion.div>

            {/* Exclusive Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">Exclusive Content</h3>
                <Button variant="ghost" onClick={() => navigate('/membership')} className="text-purple-600 hover:text-purple-700 font-semibold">View All</Button>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  {libraryItems.map(item => (
                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white border flex items-center justify-center">
                        {getIcon(item.item_type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{item.title}</h4>
                        <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">Usage Overview</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>AI Analyses</span><span>3 / 10</span></div>
                <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-purple-600 h-2 rounded-full" style={{width: '30%'}}></div></div>
                
                <div className="flex justify-between pt-2"><span>Deal Rescues</span><span>1 / 3</span></div>
                <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{width: '33%'}}></div></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl"
            >
              <Bell className="w-8 h-8 mb-3" />
              <h3 className="text-xl font-bold mb-2">Next Mentee Webinar</h3>
              <p className="opacity-90 mb-4">Join us for a live Q&A on "Scaling Your Portfolio" next Tuesday at 2 PM EST.</p>
              <Button variant="outline" className="bg-white/20 border-white/50 text-white hover:bg-white/30 w-full">Register Now</Button>
            </motion.div>
          </div>
        </div>
      </main>
      
      <MemberProfilePanel isOpen={showProfilePanel} setIsOpen={setShowProfilePanel} />
      
      <Footer />
    </div>
  );
};

export default MemberDashboard;
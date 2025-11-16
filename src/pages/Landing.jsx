
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  DollarSign, Zap, FileText, ArrowRight, Target, TrendingUp,
  Shield, Database, Bell, BarChart3, BookOpen, Users,
  Calculator, MapPin, Award, Briefcase, Globe, Smartphone,
  Search, CheckCircle2, Brain, Rocket, Lock, Clock, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { mockRedeemableDeeds } from '@/lib/mockData';

const DealTicker = () => {
  const duplicatedDeals = [...mockRedeemableDeeds, ...mockRedeemableDeeds];

  return (
    <div className="relative w-full h-20 overflow-hidden bg-slate-800 text-white">
      <motion.div
        className="absolute top-0 left-0 flex items-center h-full"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          ease: 'linear',
          duration: 40,
          repeat: Infinity,
        }}
      >
        {duplicatedDeals.map((deal, index) => (
          <div key={index} className="flex items-center mx-8 flex-shrink-0">
            <div className="text-center">
              <p className="text-sm text-slate-400">Acquired Price</p>
              <p className="font-bold text-lg">${deal.sale_price.toLocaleString()}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-green-400 mx-4" />
            <div className="text-center">
              <p className="text-sm text-slate-400">Est. Value</p>
              <p className="font-bold text-lg text-green-300">${deal.estimated_value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-transparent to-slate-800 pointer-events-none"></div>
    </div>
  );
};


const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, duration: 0.8 } },
  };

  const features = [
    { icon: <Database className="w-8 h-8 text-purple-600" />, title: '50-State Database', description: 'Access tax deed and tax lien properties from all 50 states with real-time auction updates and historical data.' },
    { icon: <Brain className="w-8 h-8 text-indigo-600" />, title: 'AI-Powered Analytics', description: 'Machine learning algorithms analyze property values, ROI potential, and market trends to identify the best opportunities.' },
    { icon: <Calculator className="w-8 h-8 text-blue-600" />, title: 'Advanced ROI Calculators', description: 'Comprehensive financial tools including profit calculators, holding cost estimators, and tax implication forecasts.' },
    { icon: <Bell className="w-8 h-8 text-green-600" />, title: 'Real-Time Auction Alerts', description: 'Never miss an opportunity with customizable alerts for new listings, auction reminders, and price drops.' },
    { icon: <Shield className="w-8 h-8 text-red-600" />, title: 'Due Diligence Tools', description: 'Automated title research, lien analysis, environmental checks, and comprehensive property reports.' },
    { icon: <Users className="w-8 h-8 text-orange-600" />, title: 'Investor Network', description: 'Connect with partners, mentors, and buyers through our exclusive community marketplace.' },
    { icon: <FileText className="w-8 h-8 text-teal-600" />, title: 'Document Automation', description: 'Generate legal documents, assignments, and contracts with state-specific templates and e-signature integration.' },
    { icon: <BookOpen className="w-8 h-8 text-pink-600" />, title: 'Education Center', description: 'Complete training library with state-specific guides, video courses, webinars, and case studies.' },
    { icon: <TrendingUp className="w-8 h-8 text-cyan-600" />, title: 'Market Intelligence', description: 'Track market trends, competition analysis, and historical auction results to make informed decisions.' },
  ];

  const comprehensiveFeatures = [
    {
      category: 'Data & Research',
      items: [
        { icon: <MapPin className="w-5 h-5" />, name: 'Multi-State Property Database', description: 'Access over 500,000+ tax deed properties nationwide' },
        { icon: <BarChart3 className="w-5 h-5" />, name: 'Property Valuations', description: 'Automated Valuation Models (AVM) with comparable sales analysis' },
        { icon: <Search className="w-5 h-5" />, name: 'Title & Lien Research', description: 'Comprehensive title chain and lien position analysis' },
        { icon: <Globe className="w-5 h-5" />, name: 'Environmental Reports', description: 'Hazard checks, flood zones, and EPA compliance data' },
      ]
    },
    {
      category: 'Auction & Bidding',
      items: [
        { icon: <Calendar className="w-5 h-5" />, name: 'Live Auction Calendar', description: 'County-by-county auction schedules with registration links' },
        { icon: <Target className="w-5 h-5" />, name: 'Bid Strategy Tools', description: 'Max bid calculators and competition tracking' },
        { icon: <Clock className="w-5 h-5" />, name: 'Auction Results Tracking', description: 'Historical data on winning bids and success rates' },
        { icon: <Bell className="w-5 h-5" />, name: 'Smart Notifications', description: 'Custom alerts for properties matching your criteria' },
      ]
    },
    {
      category: 'Financial Tools',
      items: [
        { icon: <DollarSign className="w-5 h-5" />, name: 'ROI Calculators', description: 'Profit projections with holding costs and exit strategies' },
        { icon: <TrendingUp className="w-5 h-5" />, name: 'Portfolio Tracking', description: 'Monitor all your properties and investments in one dashboard' },
        { icon: <Briefcase className="w-5 h-5" />, name: 'Funding Marketplace', description: 'Connect with lenders and private money partners' },
        { icon: <FileText className="w-5 h-5" />, name: 'Tax Impact Analysis', description: 'Calculate tax implications and deductions' },
      ]
    },
    {
      category: 'Education & Support',
      items: [
        { icon: <BookOpen className="w-5 h-5" />, name: '50-State Guides', description: 'Step-by-step instructions for every state\'s process' },
        { icon: <Award className="w-5 h-5" />, name: 'Video Training Library', description: '100+ hours of expert instruction and walkthroughs' },
        { icon: <Users className="w-5 h-5" />, name: 'Mentor Network', description: 'Connect with experienced investors for guidance' },
        { icon: <Rocket className="w-5 h-5" />, name: 'Live Webinars', description: 'Weekly training sessions and Q&A with experts' },
      ]
    },
    {
      category: 'Technology & Automation',
      items: [
        { icon: <Brain className="w-5 h-5" />, name: 'AI Workforce', description: 'Automated research, outreach, and deal analysis' },
        { icon: <Zap className="w-5 h-5" />, name: 'Marketing Automation', description: 'Auto-generated property websites and buyer campaigns' },
        { icon: <Smartphone className="w-5 h-5" />, name: 'Mobile App', description: 'Manage your business on-the-go with iOS/Android apps' },
        { icon: <Lock className="w-5 h-5" />, name: 'API Access', description: 'Developer-friendly API for custom integrations' },
      ]
    }
  ];

  const handleHeroClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="bg-white text-slate-800">
      <Helmet>
        <title>TaxDeeds Pro - The Premier Tax Deed Investment Platform</title>
        <meta name="description" content="The all-in-one platform for discovering, analyzing, and acquiring tax deed properties." />
      </Helmet>
      
      <Navbar />

      <main>
        <section className="relative pt-24 md:py-40 text-center overflow-hidden bg-gradient-to-b from-white to-slate-50">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants} className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1 rounded-full mb-6 border border-purple-200">
                The #1 Platform for Serious Real Estate Investors
              </motion.div>
              <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 max-w-4xl mx-auto tracking-tight">
                Unlock Off-Market Deals with Unmatched AI Power
              </motion.h1>
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                TaxDeeds Pro gives you the data, AI-driven insights, and automation to find and close high-equity tax deed properties faster and smarter.
              </motion.p>
              <motion.div variants={itemVariants} className="flex justify-center items-center space-x-4">
                <Button onClick={handleHeroClick} size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-lg px-8 py-6 shadow-lg shadow-purple-500/20">
                  Get Started for Free
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <DealTicker />

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 -mt-16 md:-mt-24 relative z-20"
        >
          <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-slate-300/50 border border-slate-200">
            <img class="w-full h-auto object-cover rounded-xl" alt="A professional dashboard showing property analytics and charts" src="https://images.unsplash.com/photo-1516383274235-5f42d6c6426d" />
          </div>
        </motion.div>

        <section id="features" className="py-20 md:py-32 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The Most Comprehensive Tax Deed Platform Ever Built</h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">Everything you need to find, analyze, acquire, and profit from tax deed properties - all in one powerful platform.</p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={itemVariants} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center transform hover:-translate-y-2 transition-transform duration-300">
                  <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 mx-auto border border-purple-200">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Comprehensive Features Section */}
            <div className="mt-20">
              <div className="text-center mb-12">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Every Tool You'll Ever Need</h3>
                <p className="text-lg text-slate-600">A complete ecosystem designed to give you an unfair advantage</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {comprehensiveFeatures.map((category, catIndex) => (
                  <motion.div
                    key={catIndex}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: catIndex * 0.1 }}
                    className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200"
                  >
                    <h4 className="text-xl font-bold text-purple-600 mb-6">{category.category}</h4>
                    <div className="space-y-4">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                            {item.icon}
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-900 mb-1">{item.name}</h5>
                            <p className="text-sm text-slate-600">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">500K+</div>
                <div className="text-purple-200">Active Listings</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">50</div>
                <div className="text-purple-200">States Covered</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">$2.4B+</div>
                <div className="text-purple-200">Properties Tracked</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">25K+</div>
                <div className="text-purple-200">Active Investors</div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="cta" className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-12 text-center overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Find Your Next Big Deal?</h2>
                <p className="text-lg text-indigo-200 mb-8 max-w-2xl mx-auto">
                  Explore our powerful suite of investment tools and see the difference AI can make.
                </p>
                <Button onClick={() => navigate('/properties')} size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-10 py-6">
                  View Properties
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Landing;

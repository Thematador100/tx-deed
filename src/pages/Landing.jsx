
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { DollarSign, Zap, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const DealTicker = () => {
  const duplicatedDeals = [...[], ...[]];

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
    { icon: <DollarSign className="w-8 h-8 text-purple-600" />, title: 'Buyer-Match Graph', description: 'Automatically connect with top buyers for your deals, ranked by their historical purchase patterns and preferences.' },
    { icon: <Zap className="w-8 h-8 text-indigo-600" />, title: 'AI Dispo Copilot', description: 'Generate price recommendations, one-click microsites, and compliant outreach sequences with AI assistance.' },
    { icon: <FileText className="w-8 h-8 text-blue-600" />, title: 'Doc & Process Automation', description: 'Streamline assignments, addenda, POF requests, and escrow handoffs with pre-filled templates.' },
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
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Your AI-Powered Investment Edge</h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">Leverage cutting-edge AI to automate, optimize, and scale your tax deed investment strategy.</p>
            </div>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={itemVariants} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center transform hover:-translate-y-2 transition-transform duration-300">
                  <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 mx-auto border border-purple-200">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
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

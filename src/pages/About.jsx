import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Building2, Target, Users, HeartHandshake as Handshake } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    className="bg-white p-6 rounded-xl shadow-md border border-slate-100"
    whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
  >
    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-600 text-sm">{description}</p>
  </motion.div>
);

const About = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>About Us - Win With Deeds</title>
        <meta name="description" content="Learn about the mission and vision of Win With Deeds, the premier platform for tax deed investors." />
      </Helmet>
      <Navbar />

      <main>
        <section className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4">
                Democratizing Real Estate Investment
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
                Win With Deeds was founded on a simple principle: everyone deserves the opportunity to build wealth through property investment. We're breaking down the barriers to the lucrative world of tax deeds.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">Our Mission & Vision</h2>
              <p className="text-slate-600 mt-2">What drives us forward every day.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <img
                  className="rounded-2xl shadow-xl w-full h-auto object-cover"
                  alt="A diverse team of professionals collaborating in a modern office"
                 src="https://images.unsplash.com/photo-1651009188116-bb5f80eaf6aa" />
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Our Mission</h3>
                    <p className="text-slate-600 mt-1">To provide investors with the most powerful, data-driven tools and resources to find, analyze, and acquire profitable tax deed properties with confidence and ease.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Our Vision</h3>
                    <p className="text-slate-600 mt-1">To be the central ecosystem for tax deed investing, fostering a transparent and accessible marketplace that empowers a new generation of real estate entrepreneurs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">Why Choose Win With Deeds?</h2>
              <p className="text-slate-600 mt-2">The pillars of our platform.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Users className="w-6 h-6 text-purple-600" />}
                title="Community-Centric"
                description="We're more than a platform; we're a community of investors, experts, and partners dedicated to mutual success."
              />
              <FeatureCard
                icon={<Handshake className="w-6 h-6 text-indigo-600" />}
                title="Unwavering Integrity"
                description="Transparency and trust are at the core of everything we do. We provide clear, verified data to help you make informed decisions."
              />
              <FeatureCard
                icon={<Target className="w-6 h-6 text-pink-600" />}
                title="Relentless Innovation"
                description="We leverage cutting-edge AI and data analytics to give you an unparalleled advantage in the market."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
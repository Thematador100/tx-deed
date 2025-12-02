import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import PropertyMapAdd from '@/components/PropertyMapAdd';
import { useNavigate } from 'react-router-dom';

const AddProperty = () => {
  const navigate = useNavigate();

  const handlePropertyAdded = (newProperty) => {
    // Navigate to properties list after successful add
    setTimeout(() => {
      navigate('/properties');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>Add Property - Win With Deeds</title>
        <meta name="description" content="Add a new property to your portfolio using Google Maps" />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Add New Property
          </h1>
          <p className="text-slate-600">
            Click on the map to select a property location, or enter an address to search
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <PropertyMapAdd onPropertyAdded={handlePropertyAdded} />
        </motion.div>
      </main>
    </div>
  );
};

export default AddProperty;

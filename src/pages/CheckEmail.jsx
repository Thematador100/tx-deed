
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { MailCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const CheckEmail = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Helmet>
        <title>Check Your Email - Win With Deeds</title>
        <meta name="description" content="Please check your email to activate your Win With Deeds account." />
      </Helmet>
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg border border-slate-200 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-teal-500 rounded-full">
            <MailCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Check Your Inbox!</h1>
          <p className="text-slate-600">
            We've sent a verification link to your email address. Please click the link to activate your account and log in.
          </p>
          <p className="text-sm text-slate-500">
            Didn't receive an email? Check your spam folder or try signing up again.
          </p>
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
            <Link to="/login">Back to Login</Link>
          </Button>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckEmail;

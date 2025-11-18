import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Building, Bot, TrendingUp, Map, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PropertyLookupResult = ({ result }) => {
  const navigate = useNavigate();

  if (result.error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-lg flex items-center"><XCircle className="mr-2" /> Lookup Error</h3>
        <p>{result.error}</p>
      </div>
    );
  }

  if (result.status === 'found') {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg shadow-md"
      >
        <h3 className="font-bold text-lg flex items-center mb-4"><CheckCircle className="mr-2 text-green-600" /> Property Found in Deal Stream!</h3>
        <div className="bg-white p-4 rounded-md border border-green-200">
          <p className="font-semibold text-slate-800 text-lg">{result.property.address}</p>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-slate-500">Price</p>
              <p className="font-bold text-slate-800">${Number(result.property.price).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500">Est. Value</p>
              <p className="font-bold text-slate-800">${Number(result.property.estimated_value).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/property/${result.property.id}`)} className="mt-6 w-full" size="lg">
          <Building className="mr-2 h-4 w-4" /> View Full Property Details
        </Button>
      </motion.div>
    );
  }

  if (result.status === 'not_found') {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-slate-200 p-6 rounded-lg shadow-md"
      >
        <h3 className="font-bold text-lg flex items-center mb-4"><XCircle className="mr-2 text-orange-500" /> Not in Deal Stream... Yet</h3>
        <p className="text-slate-600 mb-6">This property is not currently in our database, but our AI has generated a quick preliminary analysis for you.</p>
        
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-800 flex items-center mb-2"><TrendingUp className="mr-2 h-5 w-5 text-purple-600" /> Quick Value Estimate</h4>
            <p className="text-3xl font-bold text-slate-900">{result.ai_analysis.estimated_value}</p>
            <p className="text-xs text-slate-500">This is an AI-generated estimate and not a formal appraisal.</p>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-800 flex items-center mb-2"><BrainCircuit className="mr-2 h-5 w-5 text-purple-600" /> Market Narrative</h4>
            <p className="text-sm text-slate-700">{result.ai_analysis.market_narrative}</p>
          </div>
        </div>

        <Button onClick={() => {}} variant="outline" className="mt-8 w-full" size="lg">
          <Bot className="mr-2 h-4 w-4" /> Add to Watchlist & Deploy Scout Agent
        </Button>
      </motion.div>
    );
  }

  return null;
};

export default PropertyLookupResult;
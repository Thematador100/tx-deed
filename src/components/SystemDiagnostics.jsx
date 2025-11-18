import React, { useState, useEffect } from 'react';
    import { Button } from '@/components/ui/button';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import { Loader2, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
    import { motion, AnimatePresence } from 'framer-motion';

    const SystemDiagnostics = ({ onComplete }) => {
      const [loading, setLoading] = useState(false);
      const [results, setResults] = useState(null);

      const runDiagnostics = async () => {
        setLoading(true);
        setResults(null);
        try {
          const { data, error } = await supabase.functions.invoke('system-health-check');
          if (error) throw error;
          setResults(data.results);
          onComplete(data.results);
          toast({ title: 'Diagnostics Complete', description: 'System health check finished.' });
        } catch (error) {
          toast({
            title: 'Diagnostics Failed',
            description: 'Could not run system health check.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        runDiagnostics();
      }, []);

      return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <ShieldCheck className="w-6 h-6 mr-3 text-purple-600" />
                System Health Check
              </h2>
              <p className="text-slate-500 mt-1">Verifying API connections and ensuring all agents are operational.</p>
            </div>
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Re-run Diagnostics'
              )}
            </Button>
          </div>
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-slate-200"
              >
                <h3 className="font-semibold text-slate-700 mb-2">Diagnostic Results:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(results).map(([key, value]) => (
                    <div key={key} className={`p-3 rounded-lg flex items-center justify-between ${value.status === 'Success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center">
                        {value.status === 'Success' ? <CheckCircle className="w-5 h-5 mr-2 text-green-500" /> : <XCircle className="w-5 h-5 mr-2 text-red-500" />}
                        <span className="font-medium text-slate-800 capitalize">{key.replace(/_/g, ' ')}</span>
                      </div>
                      <span className={`text-xs font-mono px-2 py-1 rounded ${value.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {value.status === 'Success' ? `${value.responseTime}ms` : 'FAILED'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    };

    export default SystemDiagnostics;
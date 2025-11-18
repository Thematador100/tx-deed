import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import AdminLayout from '@/pages/admin/AdminLayout';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Bot, Cpu, BookUser, Shield, FileInput, Loader2, Clock } from 'lucide-react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
    import { formatDistanceToNow } from 'date-fns';
    import { toast } from '@/components/ui/use-toast';
    import AgentStatusCard from '@/components/AgentStatusCard';

    const AdminAIWorkforce = () => {
      const [selectedAgent, setSelectedAgent] = useState(null);
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      const [agents, setAgents] = useState([]);
      const [activityLog, setActivityLog] = useState([]);
      const [loading, setLoading] = useState(true);
      const [runningAgent, setRunningAgent] = useState(null);

      const fetchAgentData = useCallback(async () => {
        setLoading(true);
        
        const [
          apiKeysRes,
          latestPropertyRes, 
          latestUploadRes, 
          latestLibraryRes,
          scoutAgentRes
        ] = await Promise.all([
          supabase.rpc('get_api_key_status'),
          supabase.from('properties').select('address, created_at').order('created_at', { ascending: false }).limit(1),
          supabase.from('lead_uploads').select('file_name, created_at').order('created_at', { ascending: false }).limit(1),
          supabase.from('library_items').select('title, created_at').order('created_at', { ascending: false }).limit(1),
          supabase.from('scout_agents').select('last_run_at').order('last_run_at', { ascending: false }).limit(1)
        ]);

        const connectedApis = apiKeysRes.data?.filter(k => k.key_present).map(k => k.service_name) || [];
        const latestPropertyData = latestPropertyRes.data?.[0];
        const latestUploadData = latestUploadRes.data?.[0];
        const latestLibraryData = latestLibraryRes.data?.[0];
        const scoutAgentData = scoutAgentRes.data?.[0];

        const getStatus = (apiKeyName) => {
          return connectedApis.includes(apiKeyName) ? 'Live' : 'Inactive';
        };

        const initialAgents = [
          { id: 'supervisor', name: 'Supervisor Agent', role: 'System Monitor', icon: Shield, status: 'Live', lastActivity: 'All systems nominal', color: 'cyan', requiredApi: null },
          { id: 'scout', name: 'Scout Agents', role: 'Data Foragers', icon: Bot, status: getStatus('smarty'), lastActivity: scoutAgentData?.last_run_at ? `Last run ${formatDistanceToNow(new Date(scoutAgentData.last_run_at))} ago` : 'Awaiting first run', color: 'purple', requiredApi: 'smarty' },
          { id: 'openai', name: 'OpenAI Analyst', role: 'LLM Intelligence', icon: Cpu, status: getStatus('openai'), lastActivity: latestPropertyData?.created_at ? `Enriched property ${formatDistanceToNow(new Date(latestPropertyData.created_at))} ago` : 'Awaiting properties', color: 'blue', requiredApi: 'openai' },
          { id: 'google-ai', name: 'Google AI Analyst', role: 'LLM Intelligence', icon: Cpu, status: getStatus('google-ai'), lastActivity: 'Ready for analysis tasks', color: 'green', requiredApi: 'google-ai' },
          { id: 'ocr', name: 'OCR Ingestor', role: 'Document Reader', icon: FileInput, status: getStatus('google-doc-ai'), lastActivity: latestUploadData?.created_at ? `Processed file ${formatDistanceToNow(new Date(latestUploadData.created_at))} ago` : 'Awaiting files', color: 'yellow', requiredApi: 'google-doc-ai' },
          { id: 'librarian', name: 'Librarian Agent', role: 'User Co-Pilot', icon: BookUser, status: 'Live', lastActivity: latestLibraryData?.created_at ? `Indexed item ${formatDistanceToNow(new Date(latestLibraryData.created_at))} ago` : 'Awaiting library items', color: 'indigo', requiredApi: null },
        ];
        setAgents(initialAgents);

        const log = [];
        if (scoutAgentData) log.push({ type: 'Scout Agent', message: `Completed a property scan.`, time: scoutAgentData.last_run_at, icon: Bot, color: 'purple' });
        if (latestPropertyData) log.push({ type: 'Analyst Agent', message: `Analyzed and added new property: ${latestPropertyData.address}.`, time: latestPropertyData.created_at, icon: Cpu, color: 'blue' });
        if (latestUploadData) log.push({ type: 'Ingestor & Router', message: `Processed uploaded file: ${latestUploadData.file_name}.`, time: latestUploadData.created_at, icon: FileInput, color: 'yellow' });
        if (latestLibraryData) log.push({ type: 'Librarian Agent', message: `Indexed new library item: ${latestLibraryData.title}.`, time: latestLibraryData.created_at, icon: BookUser, color: 'green' });
        
        log.sort((a, b) => new Date(b.time) - new Date(a.time));
        setActivityLog(log);

        setLoading(false);
      }, []);

      useEffect(() => {
        fetchAgentData();
        const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public' }, fetchAgentData).subscribe();
        return () => supabase.removeChannel(channel);
      }, [fetchAgentData]);

      const handleCardClick = (agent) => {
        setSelectedAgent(agent);
        setIsDialogOpen(true);
      };
      
      const handleRunAgent = async (agentId) => {
        if (agentId !== 'scout') {
          toast({ title: "🚧 Action not available for this agent yet." });
          return;
        }
        setRunningAgent(agentId);
        try {
          const { data, error } = await supabase.functions.invoke('run-scout-agent');
          if (error) throw error;
          toast({
            title: 'Scout Agent Finished!',
            description: `Found and added ${data.newLeadsCount} new properties to the Deal Stream.`,
          });
          fetchAgentData();
        } catch (error) {
          toast({
            title: 'Scout Agent Failed',
            description: error.message || 'Could not run the agent. Check API keys and try again.',
            variant: 'destructive',
          });
        } finally {
          setRunningAgent(null);
        }
      };

      return (
        <AdminLayout>
          <Helmet>
            <title>AI Workforce - Admin</title>
          </Helmet>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Workforce Status</h1>
                <p className="text-slate-600 mb-4">
                  Real-time monitor for your multi-agent system. Click "Run Now" on the Scout Agent to find new leads.
                </p>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-pulse">
                        <div className="h-12 w-12 rounded-lg bg-slate-200 mb-4"></div>
                        <div className="h-6 w-3/4 rounded bg-slate-200 mb-2"></div>
                        <div className="h-4 w-1/2 rounded bg-slate-200 mb-4"></div>
                        <div className="h-3 w-full rounded bg-slate-200"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {agents.map((agent) => (
                      <AgentStatusCard 
                        key={agent.id} 
                        agent={agent} 
                        onCardClick={handleCardClick}
                        onRunAgent={handleRunAgent}
                        isRunning={runningAgent === agent.id}
                      />
                    ))}
                  </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Live System Activity Log</h2>
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <ul className="space-y-4">
                  {activityLog.length > 0 ? activityLog.map((log, index) => {
                    const Icon = log.icon;
                    return (
                      <li key={index} className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full bg-${log.color}-100 flex items-center justify-center flex-shrink-0`}><Icon className={`w-5 h-5 text-${log.color}-600`} /></div>
                        <div>
                          <p className="font-semibold text-slate-800">{log.message}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(log.time))} ago</p>
                        </div>
                      </li>
                    )
                  }) : <p className="text-slate-500 text-center py-8">No recent activity found in the database. Run the Scout Agent to see live updates.</p>}
                </ul>
              )}
            </div>
          </motion.div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
              {selectedAgent && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center text-2xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${selectedAgent.color}-100 mr-4`}>
                        <selectedAgent.icon className={`w-5 h-5 text-${selectedAgent.color}-600`} />
                      </div>
                      {selectedAgent.name}
                    </DialogTitle>
                    <DialogDescription>{selectedAgent.role}</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Agent Status</h3>
                      <div className={`flex items-center p-3 rounded-md ${selectedAgent.status === 'Live' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {selectedAgent.status === 'Live' ? 'This agent is live and ready.' : `This agent is inactive. It requires the ${selectedAgent.requiredApi} API key to be configured.`}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

        </AdminLayout>
      );
    };

    export default AdminAIWorkforce;
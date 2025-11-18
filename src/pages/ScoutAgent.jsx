import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { UserCheck, PlusCircle, Loader2, Trash2, Edit, Bell, Mail, MessageSquare, Eye, BarChart3, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import AgentScheduler from '@/components/AgentScheduler';
import AgentQuotaManager from '@/components/AgentQuotaManager';
import AgentPerformanceMetrics from '@/components/AgentPerformanceMetrics';

const ScoutAgentForm = ({ agent, onSave, onCancel }) => {
  const [name, setName] = useState(agent?.agent_name || '');
  const [counties, setCounties] = useState(agent?.criteria?.counties?.join(', ') || '');
  const [propertyType, setPropertyType] = useState(agent?.criteria?.propertyType || 'Any');
  const [minBeds, setMinBeds] = useState(agent?.criteria?.minBeds || 0);
  const [minBaths, setMinBaths] = useState(agent?.criteria?.minBaths || 0);
  const [minScore, setMinScore] = useState(agent?.criteria?.minScore || 70);
  const [notificationMethod, setNotificationMethod] = useState(agent?.notification_method || 'email');
  const [schedule, setSchedule] = useState(agent?.schedule || { enabled: false, frequency: 'manual' });
  const [quotas, setQuotas] = useState(agent?.quotas || { enabled: false, dailyExecutions: 10, monthlyApiCalls: 1000, maxConcurrent: 3 });

  const handleSave = () => {
    if (!name) {
      toast({ title: "Agent name is required", variant: "destructive" });
      return;
    }
    const criteria = {
      counties: counties.split(',').map(c => c.trim()).filter(Boolean),
      propertyType,
      minBeds,
      minBaths,
      minScore,
    };
    onSave({
      agent_name: name,
      criteria,
      notification_method: notificationMethod,
      is_active: agent?.is_active ?? true,
      schedule,
      quotas,
    });
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Agent Name</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" placeholder="e.g., 'Texas SFR Hunter'" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="counties" className="text-right">Counties</Label>
          <Input id="counties" value={counties} onChange={e => setCounties(e.target.value)} className="col-span-3" placeholder="e.g., Travis, Harris, Dallas" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="minScore" className="text-right">Min. Score</Label>
          <div className="col-span-3 flex items-center gap-4">
            <Slider id="minScore" value={[minScore]} onValueChange={val => setMinScore(val[0])} max={100} step={1} />
            <span className="font-bold w-12 text-center">{minScore}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Notifications</Label>
          <div className="col-span-3 flex gap-2">
            <Button variant={notificationMethod === 'email' ? 'default' : 'outline'} size="sm" onClick={() => setNotificationMethod('email')}><Mail className="w-4 h-4 mr-2" /> Email</Button>
            <Button variant={notificationMethod === 'sms' ? 'default' : 'outline'} size="sm" onClick={() => setNotificationMethod('sms')}><MessageSquare className="w-4 h-4 mr-2" /> SMS</Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4 py-4">
        <AgentScheduler schedule={schedule} onChange={setSchedule} />
        <AgentQuotaManager quotas={quotas} usage={agent?.usage} onChange={setQuotas} />
      </TabsContent>

      <TabsContent value="metrics" className="py-4">
        <AgentPerformanceMetrics metrics={agent?.metrics} />
      </TabsContent>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Agent</Button>
      </DialogFooter>
    </Tabs>
  );
};

const AgentCard = ({ agent, onToggleActive, onEdit, onDelete, onShowFinds }) => {
  const [recentFinds, setRecentFinds] = useState([]);
  const [loadingFinds, setLoadingFinds] = useState(true);

  const fetchFinds = useCallback(async () => {
    setLoadingFinds(true);
    let query = supabase.from('properties').select('id, address, opportunity_score').order('opportunity_score', { ascending: false }).limit(3);
    
    if (agent.criteria.minScore) {
      query = query.gte('opportunity_score', agent.criteria.minScore);
    }
    if (agent.criteria.counties && agent.criteria.counties.length > 0) {
      const countyFilters = agent.criteria.counties.map(county => `address.ilike.%${county}%`).join(',');
      query = query.or(countyFilters);
    }

    const { data, error } = await query;
    if (!error) {
      setRecentFinds(data);
    }
    setLoadingFinds(false);
  }, [agent.criteria.minScore, agent.criteria.counties]);

  useEffect(() => {
    if (agent.is_active) {
      fetchFinds();
    } else {
      setRecentFinds([]);
      setLoadingFinds(false);
    }
  }, [agent.is_active, fetchFinds]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-xl text-slate-900">{agent.agent_name}</h3>
            <p className="text-sm text-slate-600 mt-1">
              Searching in <span className="font-semibold">{agent.criteria.counties?.join(', ') || 'All Counties'}</span> with score <span className="font-semibold">&gt;{agent.criteria.minScore}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={agent.is_active} onCheckedChange={() => onToggleActive(agent)} />
          </div>
        </div>
      </div>
      <div className="bg-slate-50 px-6 py-4 border-t border-b border-slate-200 flex-grow">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Finds</h4>
        {loadingFinds ? (
          <div className="flex items-center justify-center h-24"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
        ) : !agent.is_active ? (
          <div className="text-center text-sm text-slate-500 py-4">Agent is paused.</div>
        ) : recentFinds.length > 0 ? (
          <ul className="space-y-2">
            {recentFinds.map(find => (
              <li key={find.id} className="text-xs flex justify-between items-center">
                <span className="text-slate-600 truncate pr-2">{find.address}</span>
                <span className="font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{find.opportunity_score}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-sm text-slate-500 py-4">No new finds matching criteria.</div>
        )}
      </div>
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Bell className="w-3 h-3 text-purple-600" />
            <span className="text-slate-600">Notifying via {agent.notification_method}</span>
          </div>
          {agent.schedule?.enabled && (
            <div className="flex items-center gap-1.5">
              <Settings className="w-3 h-3 text-blue-600" />
              <span className="text-slate-600">
                {agent.schedule.frequency === 'hourly' && 'Runs hourly'}
                {agent.schedule.frequency === 'daily' && 'Runs daily'}
                {agent.schedule.frequency === 'weekly' && 'Runs weekly'}
                {agent.schedule.frequency === 'custom' && `Every ${agent.schedule.customHours}h`}
                {agent.schedule.frequency === 'manual' && 'Manual only'}
              </span>
            </div>
          )}
          {agent.metrics?.successRate !== undefined && (
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-green-600" />
              <span className="text-slate-600">Success: {agent.metrics.successRate}%</span>
            </div>
          )}
          {agent.quotas?.enabled && agent.usage && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600">
                Quota: {agent.usage.dailyExecutions}/{agent.quotas.dailyExecutions} today
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 bg-white flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Button variant="default" size="sm" onClick={() => onShowFinds(agent)}>
            <Eye className="w-4 h-4 mr-2" /> View Finds
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(agent)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => onDelete(agent.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const ScoutAgent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('scout_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: "Error", description: "Could not fetch your Scout Agents.", variant: "destructive" });
      } else {
        setAgents(data);
      }
      setLoading(false);
    };
    fetchAgents();
  }, [user]);

  const handleSaveAgent = async (agentData) => {
    if (!user) return;
    const dataToSave = { ...agentData, user_id: user.id };

    if (editingAgent) {
      const { data, error } = await supabase.from('scout_agents').update(agentData).eq('id', editingAgent.id).select().single();
      if (error) {
        toast({ title: "Error updating agent", description: error.message, variant: "destructive" });
      } else {
        setAgents(agents.map(a => a.id === data.id ? data : a));
        toast({ title: "Agent Updated!" });
      }
    } else {
      const { data, error } = await supabase.from('scout_agents').insert(dataToSave).select().single();
      if (error) {
        toast({ title: "Error creating agent", description: error.message, variant: "destructive" });
      } else {
        setAgents([data, ...agents]);
        toast({ title: "Scout Agent Activated!" });
      }
    }
    setIsFormOpen(false);
    setEditingAgent(null);
  };

  const handleDeleteAgent = async (agentId) => {
    const { error } = await supabase.from('scout_agents').delete().eq('id', agentId);
    if (error) {
      toast({ title: "Error deleting agent", variant: "destructive" });
    } else {
      setAgents(agents.filter(a => a.id !== agentId));
      toast({ title: "Agent Deactivated" });
    }
  };

  const handleToggleActive = async (agent) => {
    const newStatus = !agent.is_active;
    const { data, error } = await supabase.from('scout_agents').update({ is_active: newStatus }).eq('id', agent.id).select().single();
    if (error) {
      toast({ title: "Error updating agent status", variant: "destructive" });
    } else {
      setAgents(agents.map(a => a.id === data.id ? data : a));
      toast({ title: `Agent ${newStatus ? 'activated' : 'paused'}` });
    }
  };

  const handleShowFinds = (agent) => {
    const searchParams = new URLSearchParams();
    if (agent.criteria.counties && agent.criteria.counties.length > 0) {
      searchParams.set('search', agent.criteria.counties.join(','));
    }
    searchParams.set('minScore', agent.criteria.minScore);
    navigate(`/properties?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Scout AI Agents - Win With Deeds</title>
        <meta name="description" content="Deploy autonomous AI agents to find deals for you 24/7." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center">
                <UserCheck className="w-10 h-10 mr-3 text-purple-600" /> Scout AI Agents
              </h1>
              <p className="text-lg text-slate-600">Your personal deal-finding army. Deploy and manage autonomous agents 24/7.</p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button size="lg" onClick={() => { setEditingAgent(null); setIsFormOpen(true); }}>
                  <PlusCircle className="w-5 h-5 mr-2" /> Deploy New Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>{editingAgent ? 'Configure' : 'Deploy'} Scout Agent</DialogTitle>
                  <DialogDescription>
                    Define your ideal property and let your agent notify you the instant it's found.
                  </DialogDescription>
                </DialogHeader>
                <ScoutAgentForm
                  agent={editingAgent}
                  onSave={handleSaveAgent}
                  onCancel={() => { setIsFormOpen(false); setEditingAgent(null); }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-purple-600" /></div>
          ) : !user ? (
            <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-slate-200">
              <p className="text-slate-500 mb-4">Please log in to deploy and manage your Scout Agents.</p>
              <Button onClick={() => navigate('/login')}>Log In</Button>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-slate-200">
              <p className="text-slate-500 mb-4">You haven't deployed any Scout Agents yet.</p>
              <Button onClick={() => { setEditingAgent(null); setIsFormOpen(true); }}>Deploy Your First Agent</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map(agent => (
                <AgentCard 
                  key={agent.id}
                  agent={agent}
                  onToggleActive={handleToggleActive}
                  onEdit={() => { setEditingAgent(agent); setIsFormOpen(true); }}
                  onDelete={handleDeleteAgent}
                  onShowFinds={handleShowFinds}
                />
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ScoutAgent;
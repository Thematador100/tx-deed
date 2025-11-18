import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Activity, KeyRound, Play, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AgentStatusCard = ({ agent, onCardClick, onRunAgent, isRunning }) => {
  const { id, name, role, icon: Icon, status, lastActivity, color, requiredApi } = agent;
  const navigate = useNavigate();

  const isLive = status === 'Live';
  const isInactive = status === 'Inactive';

  let statusIcon, statusColor, borderColor, bgColor;

  if (isLive) {
    statusIcon = <CheckCircle className="w-4 h-4 text-green-500" />;
    statusColor = 'text-green-600';
    borderColor = 'border-slate-200 hover:border-purple-300';
    bgColor = 'bg-white';
  } else { // Inactive
    statusIcon = <AlertCircle className="w-4 h-4 text-yellow-500" />;
    statusColor = 'text-yellow-600';
    borderColor = 'border-yellow-300 hover:border-yellow-400';
    bgColor = 'bg-yellow-50';
  }

  const handleCardClick = (e) => {
    if (isInactive && requiredApi) {
      e.stopPropagation();
      navigate('/admin/integrations');
    } else {
      onCardClick(agent);
    }
  };

  const handleRunClick = (e) => {
    e.stopPropagation();
    onRunAgent(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} p-6 rounded-xl shadow-md border ${borderColor} flex flex-col justify-between transition-all`}
    >
      <div onClick={handleCardClick} className="cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            {statusIcon}
            <span className={statusColor}>{status}</span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800">{name}</h2>
        <p className="text-sm font-medium text-slate-500 mb-4">{role}</p>
        
        {isLive ? (
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>{lastActivity}</span>
          </div>
        ) : (
          <div className={`text-xs font-semibold flex items-center gap-2 p-2 rounded-md bg-yellow-100 text-yellow-700`}>
            <KeyRound className="w-3 h-3" />
            <span>Requires {requiredApi} API Key</span>
          </div>
        )}
      </div>

      {id === 'scout' && isLive && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button onClick={handleRunClick} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Now
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default AgentStatusCard;
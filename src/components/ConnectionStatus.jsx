import React from 'react';
import { useConnection } from '@/contexts/ConnectionContext';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

const ConnectionStatus = () => {
  const { isOnline, isSupabaseConnected, isConnected, reconnecting, manualReconnect } = useConnection();

  // Don't show anything if everything is connected
  if (isConnected && !reconnecting) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-slate-900 text-white rounded-lg shadow-lg p-4 border-2 border-slate-700">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {reconnecting ? (
              <RefreshCw className="h-6 w-6 text-yellow-400 animate-spin" />
            ) : !isOnline ? (
              <WifiOff className="h-6 w-6 text-red-400" />
            ) : !isSupabaseConnected ? (
              <WifiOff className="h-6 w-6 text-orange-400" />
            ) : (
              <Wifi className="h-6 w-6 text-green-400" />
            )}
          </div>

          {/* Status Text */}
          <div className="flex-1">
            <div className="font-semibold text-sm">
              {reconnecting ? (
                'Reconnecting...'
              ) : !isOnline ? (
                'No Internet Connection'
              ) : !isSupabaseConnected ? (
                'Connection Lost'
              ) : (
                'Connected'
              )}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {reconnecting ? (
                'Attempting to restore connection'
              ) : !isOnline ? (
                'Check your network settings'
              ) : !isSupabaseConnected ? (
                'Unable to reach server'
              ) : (
                'All systems operational'
              )}
            </div>
          </div>

          {/* Manual Reconnect Button */}
          {!isConnected && !reconnecting && (
            <Button
              size="sm"
              variant="outline"
              onClick={manualReconnect}
              className="flex-shrink-0 bg-white text-slate-900 hover:bg-slate-100"
            >
              Retry
            </Button>
          )}
        </div>

        {/* Connection Details */}
        <div className="mt-3 pt-3 border-t border-slate-700 flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-slate-300">
              Network {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-slate-300">
              Server {isSupabaseConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;

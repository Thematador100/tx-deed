import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Activity,
  Play,
  Square,
  RefreshCw,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';

const SCRAPER_API_URL = import.meta.env.VITE_SCRAPER_API_URL || 'http://localhost:3001';

const AdminScrapers = () => {
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch scraper status
  const fetchStatus = async () => {
    try {
      const response = await fetch(`${SCRAPER_API_URL}/api/scrapers/status`);
      const data = await response.json();
      setStatus(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching status:', error);
      toast({
        title: 'Connection Error',
        description: 'Could not connect to scraper server. Make sure it is running.',
        variant: 'destructive',
      });
    }
  };

  // Fetch scraper stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${SCRAPER_API_URL}/api/scrapers/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchStats();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchStatus();
      if (!scraping) {
        fetchStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [scraping]);

  // Start scraping all counties
  const startScrapeAll = async () => {
    setLoading(true);
    setScraping(true);

    try {
      const response = await fetch(`${SCRAPER_API_URL}/api/scrapers/scrape-all`, {
        method: 'POST',
      });
      const data = await response.json();

      toast({
        title: 'Scraping Started',
        description: `Scraping ${data.status?.queueLength || 0} counties`,
        className: 'bg-green-100 text-green-800',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setScraping(false);
    } finally {
      setLoading(false);
    }
  };

  // Start scheduler
  const startScheduler = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${SCRAPER_API_URL}/api/scrapers/scheduler/start`, {
        method: 'POST',
      });
      const data = await response.json();

      toast({
        title: 'Scheduler Started',
        description: `Schedule: ${data.schedule}`,
        className: 'bg-green-100 text-green-800',
      });

      fetchStatus();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Stop scheduler
  const stopScheduler = async () => {
    setLoading(true);

    try {
      await fetch(`${SCRAPER_API_URL}/api/scrapers/scheduler/stop`, {
        method: 'POST',
      });

      toast({
        title: 'Scheduler Stopped',
        className: 'bg-yellow-100 text-yellow-800',
      });

      fetchStatus();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear history
  const clearHistory = async () => {
    setLoading(true);

    try {
      await fetch(`${SCRAPER_API_URL}/api/scrapers/clear-history`, {
        method: 'POST',
      });

      toast({
        title: 'History Cleared',
        className: 'bg-green-100 text-green-800',
      });

      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, label, value, className = '' }) => (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className="text-purple-600">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Helmet>
        <title>Scraper Management - Admin</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Web Scraper Management</h1>
              <p className="text-slate-600 mt-2">
                Monitor and control automated property data collection from county websites
              </p>
            </div>
            <Button
              onClick={() => {
                fetchStatus();
                fetchStats();
              }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Status Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            icon={<Activity className="w-8 h-8" />}
            label="Scraper Status"
            value={status?.isRunning ? 'Running' : 'Idle'}
            className={status?.isRunning ? 'border-l-4 border-green-500' : 'border-l-4 border-slate-300'}
          />
          <StatCard
            icon={<Clock className="w-8 h-8" />}
            label="Scheduler"
            value={status?.schedulerActive ? 'Active' : 'Inactive'}
            className={status?.schedulerActive ? 'border-l-4 border-blue-500' : 'border-l-4 border-slate-300'}
          />
          <StatCard
            icon={<Database className="w-8 h-8" />}
            label="Queue Length"
            value={status?.queueLength || 0}
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8" />}
            label="Running Jobs"
            value={status?.runningJobs || 0}
          />
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4">Control Panel</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={startScrapeAll}
              disabled={loading || scraping}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {scraping ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Scrape All Counties
            </Button>

            {status?.schedulerActive ? (
              <Button onClick={stopScheduler} disabled={loading} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop Scheduler
              </Button>
            ) : (
              <Button onClick={startScheduler} disabled={loading} className="bg-green-600 hover:bg-green-700">
                <Clock className="w-4 h-4 mr-2" />
                Start Scheduler
              </Button>
            )}

            <Button onClick={clearHistory} disabled={loading} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear History
            </Button>

            <Button variant="outline" disabled>
              <Activity className="w-4 h-4 mr-2" />
              View Logs
            </Button>
          </div>
        </motion.div>

        {/* Statistics */}
        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
          >
            {/* Manager Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                Scraper Statistics
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Jobs</span>
                  <span className="font-bold">{stats.manager?.totalJobs || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Completed</span>
                  <span className="font-bold text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {stats.manager?.completedJobs || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Failed</span>
                  <span className="font-bold text-red-600 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {stats.manager?.failedJobs || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Success Rate</span>
                  <span className="font-bold">{stats.manager?.successRate || '0%'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Items Scraped</span>
                  <span className="font-bold text-purple-600">{stats.manager?.totalItemsScraped || 0}</span>
                </div>
              </div>
            </div>

            {/* Database Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-purple-600" />
                Database Statistics
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Properties Scraped</span>
                  <span className="font-bold">{stats.database?.totalScraped || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Scraped (Last 24h)</span>
                  <span className="font-bold text-green-600">{stats.database?.recentlyScraped || 0}</span>
                </div>
                {stats.database?.bySource && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">By Source:</p>
                    <div className="space-y-2">
                      {Object.entries(stats.database.bySource).slice(0, 5).map(([source, count]) => (
                        <div key={source} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{source}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Running Jobs */}
        {status?.runningJobDetails && status.runningJobDetails.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <Loader2 className="w-5 h-5 mr-2 text-purple-600 animate-spin" />
              Running Jobs
            </h2>

            <div className="space-y-3">
              {status.runningJobDetails.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">{job.county}</p>
                    <p className="text-sm text-slate-600">Type: {job.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      Started: {new Date(job.startedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Jobs */}
        {stats?.manager?.recentJobs && stats.manager.recentJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Jobs</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">County</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Items</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.manager.recentJobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-100">
                      <td className="py-3 px-4">{job.county}</td>
                      <td className="py-3 px-4">
                        {job.status === 'completed' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">{job.itemsScraped || 0}</td>
                      <td className="py-3 px-4">{((job.duration || 0) / 1000).toFixed(1)}s</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Last Refresh */}
        {lastRefresh && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminScrapers;

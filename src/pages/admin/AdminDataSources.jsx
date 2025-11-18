import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { useToast } from '../../components/ui/use-toast';
import {
  scrapeTaxSaleResources,
  getScraperStatus,
  executeScheduledJob,
  setJobEnabled,
  testScraper
} from '../../services/scrapers/index';
import { Database, Play, Pause, RefreshCw, CheckCircle2, XCircle, Clock, Download } from 'lucide-react';

const AdminDataSources = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runningJobs, setRunningJobs] = useState(new Set());
  const { toast } = useToast();

  // TaxSaleResources form state
  const [taxSaleConfig, setTaxSaleConfig] = useState({
    username: '',
    password: '',
    states: '',
    counties: '',
    maxPages: '10',
    enabled: true
  });

  // Load scraper status on mount
  useEffect(() => {
    loadScraperStatus();
  }, []);

  const loadScraperStatus = () => {
    try {
      const status = getScraperStatus();
      setJobs(status);
    } catch (error) {
      console.error('Error loading scraper status:', error);
    }
  };

  const handleRunScraper = async (jobName) => {
    setRunningJobs(prev => new Set(prev).add(jobName));
    setLoading(true);

    try {
      let result;

      if (jobName === 'taxsaleresources') {
        // Use form configuration
        result = await scrapeTaxSaleResources({
          username: taxSaleConfig.username,
          password: taxSaleConfig.password,
          states: taxSaleConfig.states ? taxSaleConfig.states.split(',').map(s => s.trim()) : [],
          counties: taxSaleConfig.counties ? taxSaleConfig.counties.split(',').map(c => c.trim()) : [],
          maxPages: parseInt(taxSaleConfig.maxPages) || 10
        });
      } else {
        // Use scheduler for other jobs
        result = await executeScheduledJob(jobName);
      }

      if (result.success) {
        toast({
          title: "Scraper completed successfully",
          description: `Scraped: ${result.recordsScraped}, Saved: ${result.recordsSaved} properties`,
          variant: "default"
        });
      } else {
        throw new Error(result.error || 'Scraper failed');
      }

      loadScraperStatus();

    } catch (error) {
      toast({
        title: "Scraper failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRunningJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobName);
        return newSet;
      });
      setLoading(false);
    }
  };

  const handleToggleJob = (jobName, enabled) => {
    try {
      setJobEnabled(jobName, enabled);
      loadScraperStatus();

      toast({
        title: `Job ${enabled ? 'enabled' : 'disabled'}`,
        description: `${jobName} has been ${enabled ? 'enabled' : 'disabled'}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTestScraper = async () => {
    setLoading(true);

    try {
      const result = await testScraper();

      toast({
        title: "Test completed",
        description: `Successfully tested scraper. Saved ${result.count || 0} test records.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Sources</h1>
        <p className="text-muted-foreground mt-2">
          Manage automated data scraping from tax sale sources
        </p>
      </div>

      {/* TaxSaleResources Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                TaxSaleResources.com
              </CardTitle>
              <CardDescription>
                Nationwide tax sale data - liens, deeds, and redeemable deeds
              </CardDescription>
            </div>
            <Switch
              checked={taxSaleConfig.enabled}
              onCheckedChange={(checked) =>
                setTaxSaleConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="your-username"
                value={taxSaleConfig.username}
                onChange={(e) =>
                  setTaxSaleConfig(prev => ({ ...prev, username: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={taxSaleConfig.password}
                onChange={(e) =>
                  setTaxSaleConfig(prev => ({ ...prev, password: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="states">States (comma-separated)</Label>
              <Input
                id="states"
                type="text"
                placeholder="FL, GA, TX, AZ (leave empty for all)"
                value={taxSaleConfig.states}
                onChange={(e) =>
                  setTaxSaleConfig(prev => ({ ...prev, states: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counties">Counties (comma-separated)</Label>
              <Input
                id="counties"
                type="text"
                placeholder="Fulton, DeKalb (leave empty for all)"
                value={taxSaleConfig.counties}
                onChange={(e) =>
                  setTaxSaleConfig(prev => ({ ...prev, counties: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPages">Max Pages</Label>
              <Input
                id="maxPages"
                type="number"
                min="1"
                max="100"
                value={taxSaleConfig.maxPages}
                onChange={(e) =>
                  setTaxSaleConfig(prev => ({ ...prev, maxPages: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleRunScraper('taxsaleresources')}
              disabled={loading || !taxSaleConfig.username || !taxSaleConfig.password}
              className="gap-2"
            >
              {runningJobs.has('taxsaleresources') ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Scraper
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleTestScraper}
              disabled={loading}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scraper Jobs Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Scraper Jobs</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadScraperStatus}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          <CardDescription>Status of all registered scraper jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scraper jobs registered</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold capitalize">{job.name}</h4>
                      {job.isRunning && (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Running
                        </span>
                      )}
                      {job.enabled ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Pause className="h-3 w-3" />
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      {job.lastRun && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Last run: {new Date(job.lastRun).toLocaleString()}
                        </div>
                      )}
                      {job.nextRun && job.enabled && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Next run: {new Date(job.nextRun).toLocaleString()}
                        </div>
                      )}
                      <div className="flex gap-4 text-xs">
                        <span>Total runs: {job.stats?.totalRuns || 0}</span>
                        <span className="text-green-600">
                          Success: {job.stats?.successfulRuns || 0}
                        </span>
                        <span className="text-red-600">
                          Failed: {job.stats?.failedRuns || 0}
                        </span>
                        <span>
                          Records: {job.stats?.totalRecordsScraped?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={job.enabled}
                      onCheckedChange={(checked) => handleToggleJob(job.name, checked)}
                      disabled={job.isRunning}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help & Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">1. TaxSaleResources Account</h4>
            <p className="text-muted-foreground">
              Create an account at{' '}
              <a
                href="https://taxsaleresources.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                taxsaleresources.com
              </a>
              . Plans start at $1.99 for trial access.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Enter Credentials</h4>
            <p className="text-muted-foreground">
              Enter your TaxSaleResources username and password above. Credentials are stored
              securely and never logged.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Configure Scraper</h4>
            <p className="text-muted-foreground">
              Specify which states and counties to scrape, or leave empty to scrape all available
              data. Set max pages to control data volume.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4. Run or Schedule</h4>
            <p className="text-muted-foreground">
              Click "Run Scraper" to execute immediately, or enable the job to run automatically
              on schedule (2 AM daily by default).
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> The scraper respects rate limits and includes automatic
              retry logic. Large scrapes may take several minutes to complete.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDataSources;

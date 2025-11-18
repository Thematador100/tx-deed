import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, DollarSign, Activity, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * AgentPerformanceMetrics Component
 * Displays comprehensive performance metrics for an agent
 */
const AgentPerformanceMetrics = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No performance data available yet.</p>
        <p className="text-sm mt-1">Metrics will appear after the agent runs.</p>
      </div>
    );
  }

  const {
    totalRuns = 0,
    successfulRuns = 0,
    failedRuns = 0,
    averageExecutionTime = 0,
    lastRunTime,
    totalApiCalls = 0,
    estimatedCost = 0,
    propertiesFound = 0,
    successRate = 0,
    trend = 'stable',
  } = metrics;

  const getStatusIcon = (status) => {
    if (status === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (status === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Runs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
            {lastRunTime && (
              <p className="text-xs text-slate-500 mt-1">
                Last: {formatDistanceToNow(new Date(lastRunTime))} ago
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Success Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <Progress value={successRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Avg. Runtime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Clock className="w-5 h-5 text-blue-600" />
              {averageExecutionTime}s
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Est. Cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1 text-purple-600">
              <DollarSign className="w-5 h-5" />
              {estimatedCost.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Execution Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">Successful</span>
              </div>
              <span className="font-semibold">{successfulRuns}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm">Failed</span>
              </div>
              <span className="font-semibold">{failedRuns}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Properties Found</span>
              </div>
              <span className="font-semibold text-purple-600">{propertiesFound}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Calls (Total)</span>
              <span className="font-semibold">{totalApiCalls.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg. per Run</span>
              <span className="font-semibold">
                {totalRuns > 0 ? Math.round(totalApiCalls / totalRuns) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm flex items-center gap-2">
                Trend
                {getStatusIcon(trend)}
              </span>
              <span className="font-semibold capitalize">{trend}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Score */}
      {propertiesFound > 0 && totalApiCalls > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Efficiency Metrics
            </CardTitle>
            <CardDescription>Cost-effectiveness analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Properties per Run</span>
              <span className="font-semibold">{(propertiesFound / totalRuns).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Cost per Property</span>
              <span className="font-semibold">${(estimatedCost / propertiesFound).toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>API Calls per Property</span>
              <span className="font-semibold">{(totalApiCalls / propertiesFound).toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentPerformanceMetrics;

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * AgentQuotaManager Component
 * Manages and displays quota limits and usage for agents
 */
const AgentQuotaManager = ({ quotas, usage, onChange }) => {
  const [enabled, setEnabled] = useState(quotas?.enabled || false);
  const [dailyExecutions, setDailyExecutions] = useState(quotas?.dailyExecutions || 10);
  const [monthlyApiCalls, setMonthlyApiCalls] = useState(quotas?.monthlyApiCalls || 1000);
  const [maxConcurrent, setMaxConcurrent] = useState(quotas?.maxConcurrent || 3);

  const handleUpdate = (updates) => {
    const newQuotas = {
      enabled,
      dailyExecutions,
      monthlyApiCalls,
      maxConcurrent,
      ...updates,
    };

    if (updates.enabled !== undefined) setEnabled(updates.enabled);
    if (updates.dailyExecutions !== undefined) setDailyExecutions(updates.dailyExecutions);
    if (updates.monthlyApiCalls !== undefined) setMonthlyApiCalls(updates.monthlyApiCalls);
    if (updates.maxConcurrent !== undefined) setMaxConcurrent(updates.maxConcurrent);

    onChange(newQuotas);
  };

  // Calculate usage percentages
  const executionUsagePercent = usage?.dailyExecutions
    ? Math.min((usage.dailyExecutions / dailyExecutions) * 100, 100)
    : 0;

  const apiCallsUsagePercent = usage?.monthlyApiCalls
    ? Math.min((usage.monthlyApiCalls / monthlyApiCalls) * 100, 100)
    : 0;

  const isNearLimit = executionUsagePercent > 80 || apiCallsUsagePercent > 80;

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          <Label className="text-base font-semibold">Quota Management</Label>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => handleUpdate({ enabled: checked })}
        />
      </div>

      {enabled && (
        <>
          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">Daily Runs</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={dailyExecutions}
                onChange={(e) => handleUpdate({ dailyExecutions: parseInt(e.target.value) || 10 })}
                className="col-span-3"
              />
            </div>

            {usage?.dailyExecutions !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Today's Usage</span>
                  <span className="font-semibold">{usage.dailyExecutions} / {dailyExecutions}</span>
                </div>
                <Progress value={executionUsagePercent} className="h-2" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">Monthly API Calls</Label>
              <Input
                type="number"
                min="100"
                max="100000"
                step="100"
                value={monthlyApiCalls}
                onChange={(e) => handleUpdate({ monthlyApiCalls: parseInt(e.target.value) || 1000 })}
                className="col-span-3"
              />
            </div>

            {usage?.monthlyApiCalls !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>This Month's API Calls</span>
                  <span className="font-semibold">{usage.monthlyApiCalls.toLocaleString()} / {monthlyApiCalls.toLocaleString()}</span>
                </div>
                <Progress value={apiCallsUsagePercent} className="h-2" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-sm">Max Concurrent</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={maxConcurrent}
              onChange={(e) => handleUpdate({ maxConcurrent: parseInt(e.target.value) || 3 })}
              className="col-span-3"
            />
          </div>

          {isNearLimit && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-xs">
                <strong>Approaching Limit:</strong> You're nearing your quota limits. Consider increasing limits or reducing agent frequency.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-md border border-purple-200">
            <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-purple-800">
              <strong>Quotas help manage costs.</strong> Set daily execution limits, monthly API call caps, and concurrent run limits to control resource usage and expenses.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentQuotaManager;

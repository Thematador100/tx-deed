import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Repeat } from 'lucide-react';

/**
 * AgentScheduler Component
 * Provides scheduling configuration for agents with multiple frequency options
 */
const AgentScheduler = ({ schedule, onChange }) => {
  const [enabled, setEnabled] = useState(schedule?.enabled || false);
  const [frequency, setFrequency] = useState(schedule?.frequency || 'manual');
  const [customHours, setCustomHours] = useState(schedule?.customHours || 24);
  const [timeOfDay, setTimeOfDay] = useState(schedule?.timeOfDay || '09:00');

  const handleUpdate = (updates) => {
    const newSchedule = {
      enabled,
      frequency,
      customHours,
      timeOfDay,
      ...updates,
    };

    // Update local state
    if (updates.enabled !== undefined) setEnabled(updates.enabled);
    if (updates.frequency !== undefined) setFrequency(updates.frequency);
    if (updates.customHours !== undefined) setCustomHours(updates.customHours);
    if (updates.timeOfDay !== undefined) setTimeOfDay(updates.timeOfDay);

    // Notify parent component
    onChange(newSchedule);
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <Label className="text-base font-semibold">Scheduling</Label>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => handleUpdate({ enabled: checked })}
        />
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value) => handleUpdate({ frequency: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Only</SelectItem>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="every-4-hours">Every 4 Hours</SelectItem>
                <SelectItem value="every-12-hours">Every 12 Hours</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="custom">Custom Interval</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === 'custom' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Every (hours)</Label>
              <Input
                type="number"
                min="1"
                max="168"
                value={customHours}
                onChange={(e) => handleUpdate({ customHours: parseInt(e.target.value) || 24 })}
                className="col-span-3"
              />
            </div>
          )}

          {(frequency === 'daily' || frequency === 'weekly') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right flex items-center gap-1">
                <Clock className="w-4 h-4" /> Time
              </Label>
              <Input
                type="time"
                value={timeOfDay}
                onChange={(e) => handleUpdate({ timeOfDay: e.target.value })}
                className="col-span-3"
              />
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
            <Repeat className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              {frequency === 'manual' && 'Agent will only run when manually triggered.'}
              {frequency === 'hourly' && 'Agent will run automatically every hour.'}
              {frequency === 'every-4-hours' && 'Agent will run automatically every 4 hours.'}
              {frequency === 'every-12-hours' && 'Agent will run automatically every 12 hours.'}
              {frequency === 'daily' && `Agent will run daily at ${timeOfDay}.`}
              {frequency === 'weekly' && `Agent will run weekly at ${timeOfDay}.`}
              {frequency === 'custom' && `Agent will run every ${customHours} hours.`}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentScheduler;

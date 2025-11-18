# Database Migration: Enhanced Agent Controls

This document outlines the database schema changes required to support the new agent control features: **Scheduling**, **Quotas**, and **Performance Metrics**.

## Overview

The enhanced agent controls add three major features to the existing `scout_agents` table:
1. **Scheduling** - Automated agent execution on defined schedules
2. **Quota Management** - Resource limits and usage tracking
3. **Performance Metrics** - Execution statistics and cost tracking

## Required Database Changes

### 1. Update `scout_agents` Table

Add new JSONB columns to the existing `scout_agents` table to store scheduling, quota, and metrics data:

```sql
-- Add scheduling configuration
ALTER TABLE scout_agents
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{"enabled": false, "frequency": "manual"}'::jsonb;

-- Add quota configuration
ALTER TABLE scout_agents
ADD COLUMN IF NOT EXISTS quotas JSONB DEFAULT '{"enabled": false, "dailyExecutions": 10, "monthlyApiCalls": 1000, "maxConcurrent": 3}'::jsonb;

-- Add usage tracking
ALTER TABLE scout_agents
ADD COLUMN IF NOT EXISTS usage JSONB DEFAULT '{"dailyExecutions": 0, "monthlyApiCalls": 0, "lastResetDate": null}'::jsonb;

-- Add performance metrics
ALTER TABLE scout_agents
ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{"totalRuns": 0, "successfulRuns": 0, "failedRuns": 0, "averageExecutionTime": 0, "totalApiCalls": 0, "estimatedCost": 0, "propertiesFound": 0, "successRate": 0, "trend": "stable"}'::jsonb;

-- Add last run timestamp if it doesn't exist
ALTER TABLE scout_agents
ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;
```

### 2. Create Index for Performance

Create indexes to optimize queries on schedule and quota fields:

```sql
-- Index for scheduled agents (for cron jobs)
CREATE INDEX IF NOT EXISTS idx_scout_agents_schedule_enabled
ON scout_agents ((schedule->>'enabled'))
WHERE (schedule->>'enabled')::boolean = true;

-- Index for active agents with schedules
CREATE INDEX IF NOT EXISTS idx_scout_agents_active_scheduled
ON scout_agents (is_active, ((schedule->>'enabled')::boolean));

-- Index for last run time (for scheduling logic)
CREATE INDEX IF NOT EXISTS idx_scout_agents_last_run_at
ON scout_agents (last_run_at);
```

### 3. Create Database Functions

#### Function to Update Usage Metrics

```sql
CREATE OR REPLACE FUNCTION update_agent_usage(
  agent_id UUID,
  api_calls_count INT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage JSONB;
  current_quotas JSONB;
  last_reset DATE;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get current usage and quotas
  SELECT usage, quotas INTO current_usage, current_quotas
  FROM scout_agents
  WHERE id = agent_id;

  -- Parse last reset date
  last_reset := (current_usage->>'lastResetDate')::DATE;

  -- Reset daily counter if it's a new day
  IF last_reset IS NULL OR last_reset < today THEN
    current_usage := jsonb_set(current_usage, '{dailyExecutions}', '0');
    current_usage := jsonb_set(current_usage, '{lastResetDate}', to_jsonb(today::TEXT));
  END IF;

  -- Increment daily executions
  current_usage := jsonb_set(
    current_usage,
    '{dailyExecutions}',
    to_jsonb(COALESCE((current_usage->>'dailyExecutions')::INT, 0) + 1)
  );

  -- Increment monthly API calls
  current_usage := jsonb_set(
    current_usage,
    '{monthlyApiCalls}',
    to_jsonb(COALESCE((current_usage->>'monthlyApiCalls')::INT, 0) + api_calls_count)
  );

  -- Update the record
  UPDATE scout_agents
  SET usage = current_usage
  WHERE id = agent_id;
END;
$$;
```

#### Function to Update Performance Metrics

```sql
CREATE OR REPLACE FUNCTION update_agent_metrics(
  agent_id UUID,
  execution_success BOOLEAN,
  execution_time_seconds INT,
  api_calls_count INT,
  properties_found_count INT,
  estimated_cost_amount DECIMAL DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_metrics JSONB;
  total_runs INT;
  successful_runs INT;
  failed_runs INT;
  new_success_rate DECIMAL;
BEGIN
  -- Get current metrics
  SELECT metrics INTO current_metrics
  FROM scout_agents
  WHERE id = agent_id;

  -- Calculate updated values
  total_runs := COALESCE((current_metrics->>'totalRuns')::INT, 0) + 1;

  IF execution_success THEN
    successful_runs := COALESCE((current_metrics->>'successfulRuns')::INT, 0) + 1;
    failed_runs := COALESCE((current_metrics->>'failedRuns')::INT, 0);
  ELSE
    successful_runs := COALESCE((current_metrics->>'successfulRuns')::INT, 0);
    failed_runs := COALESCE((current_metrics->>'failedRuns')::INT, 0) + 1;
  END IF;

  -- Calculate success rate
  new_success_rate := ROUND((successful_runs::DECIMAL / total_runs::DECIMAL) * 100, 2);

  -- Update metrics
  current_metrics := jsonb_set(current_metrics, '{totalRuns}', to_jsonb(total_runs));
  current_metrics := jsonb_set(current_metrics, '{successfulRuns}', to_jsonb(successful_runs));
  current_metrics := jsonb_set(current_metrics, '{failedRuns}', to_jsonb(failed_runs));
  current_metrics := jsonb_set(current_metrics, '{successRate}', to_jsonb(new_success_rate));

  -- Update average execution time
  current_metrics := jsonb_set(
    current_metrics,
    '{averageExecutionTime}',
    to_jsonb(
      ROUND(
        ((COALESCE((current_metrics->>'averageExecutionTime')::DECIMAL, 0) * (total_runs - 1)) + execution_time_seconds) / total_runs,
        2
      )
    )
  );

  -- Update API calls
  current_metrics := jsonb_set(
    current_metrics,
    '{totalApiCalls}',
    to_jsonb(COALESCE((current_metrics->>'totalApiCalls')::INT, 0) + api_calls_count)
  );

  -- Update properties found
  current_metrics := jsonb_set(
    current_metrics,
    '{propertiesFound}',
    to_jsonb(COALESCE((current_metrics->>'propertiesFound')::INT, 0) + properties_found_count)
  );

  -- Update estimated cost
  current_metrics := jsonb_set(
    current_metrics,
    '{estimatedCost}',
    to_jsonb(COALESCE((current_metrics->>'estimatedCost')::DECIMAL, 0) + estimated_cost_amount)
  );

  -- Update the record
  UPDATE scout_agents
  SET
    metrics = current_metrics,
    last_run_at = NOW()
  WHERE id = agent_id;

  -- Also update usage
  PERFORM update_agent_usage(agent_id, api_calls_count);
END;
$$;
```

#### Function to Check Quota Limits

```sql
CREATE OR REPLACE FUNCTION check_agent_quota(agent_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_quotas JSONB;
  agent_usage JSONB;
  quotas_enabled BOOLEAN;
  daily_limit INT;
  monthly_limit INT;
  daily_used INT;
  monthly_used INT;
BEGIN
  -- Get quotas and usage
  SELECT quotas, usage INTO agent_quotas, agent_usage
  FROM scout_agents
  WHERE id = agent_id;

  -- Check if quotas are enabled
  quotas_enabled := COALESCE((agent_quotas->>'enabled')::BOOLEAN, false);

  IF NOT quotas_enabled THEN
    RETURN true; -- No quota limits
  END IF;

  -- Get limits
  daily_limit := COALESCE((agent_quotas->>'dailyExecutions')::INT, 999999);
  monthly_limit := COALESCE((agent_quotas->>'monthlyApiCalls')::INT, 999999);

  -- Get current usage
  daily_used := COALESCE((agent_usage->>'dailyExecutions')::INT, 0);
  monthly_used := COALESCE((agent_usage->>'monthlyApiCalls')::INT, 0);

  -- Check if within limits
  RETURN (daily_used < daily_limit) AND (monthly_used < monthly_limit);
END;
$$;
```

#### Function to Get Scheduled Agents

```sql
CREATE OR REPLACE FUNCTION get_scheduled_agents()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  agent_name TEXT,
  schedule JSONB,
  last_run_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.user_id,
    sa.agent_name,
    sa.schedule,
    sa.last_run_at
  FROM scout_agents sa
  WHERE
    sa.is_active = true
    AND (sa.schedule->>'enabled')::BOOLEAN = true
    AND (sa.schedule->>'frequency')::TEXT != 'manual'
    AND check_agent_quota(sa.id) = true;
END;
$$;
```

### 4. Create Scheduled Job (Cron)

For automated scheduling, you'll need to set up a cron job or use Supabase Edge Functions with cron triggers:

```sql
-- Using pg_cron (if available in your Supabase instance)
-- This would be configured in Supabase Dashboard or via SQL

-- Example: Run every hour to check for scheduled agents
-- SELECT cron.schedule(
--   'run-scheduled-agents',
--   '0 * * * *', -- Every hour
--   $$
--   SELECT run_scheduled_scout_agents();
--   $$
-- );
```

## Edge Function Updates

You'll need to update your `run-scout-agent` Edge Function to:

1. Check quota limits before execution
2. Record usage and metrics after execution
3. Handle scheduled vs manual executions

Example modifications:

```typescript
// In your run-scout-agent Edge Function

// Before execution
const canRun = await supabase
  .rpc('check_agent_quota', { agent_id: agentId });

if (!canRun.data) {
  return new Response(
    JSON.stringify({ error: 'Quota limit reached' }),
    { status: 429 }
  );
}

// After execution
const executionTime = Math.floor((Date.now() - startTime) / 1000);

await supabase.rpc('update_agent_metrics', {
  agent_id: agentId,
  execution_success: true,
  execution_time_seconds: executionTime,
  api_calls_count: apiCallsMade,
  properties_found_count: newProperties.length,
  estimated_cost_amount: estimatedCost
});
```

## Data Structure Examples

### Schedule Object
```json
{
  "enabled": true,
  "frequency": "daily",
  "timeOfDay": "09:00",
  "customHours": 24
}
```

### Quotas Object
```json
{
  "enabled": true,
  "dailyExecutions": 10,
  "monthlyApiCalls": 1000,
  "maxConcurrent": 3
}
```

### Usage Object
```json
{
  "dailyExecutions": 5,
  "monthlyApiCalls": 342,
  "lastResetDate": "2025-11-18"
}
```

### Metrics Object
```json
{
  "totalRuns": 25,
  "successfulRuns": 23,
  "failedRuns": 2,
  "averageExecutionTime": 45.5,
  "totalApiCalls": 1250,
  "estimatedCost": 12.50,
  "propertiesFound": 145,
  "successRate": 92.0,
  "trend": "up",
  "lastRunTime": "2025-11-18T14:30:00Z"
}
```

## Migration Script

Run this complete migration script in your Supabase SQL Editor:

```sql
-- Start transaction
BEGIN;

-- 1. Add new columns to scout_agents table
ALTER TABLE scout_agents
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{"enabled": false, "frequency": "manual"}'::jsonb,
ADD COLUMN IF NOT EXISTS quotas JSONB DEFAULT '{"enabled": false, "dailyExecutions": 10, "monthlyApiCalls": 1000, "maxConcurrent": 3}'::jsonb,
ADD COLUMN IF NOT EXISTS usage JSONB DEFAULT '{"dailyExecutions": 0, "monthlyApiCalls": 0, "lastResetDate": null}'::jsonb,
ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{"totalRuns": 0, "successfulRuns": 0, "failedRuns": 0, "averageExecutionTime": 0, "totalApiCalls": 0, "estimatedCost": 0, "propertiesFound": 0, "successRate": 0, "trend": "stable"}'::jsonb,
ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_scout_agents_schedule_enabled
ON scout_agents ((schedule->>'enabled'))
WHERE (schedule->>'enabled')::boolean = true;

CREATE INDEX IF NOT EXISTS idx_scout_agents_active_scheduled
ON scout_agents (is_active, ((schedule->>'enabled')::boolean));

CREATE INDEX IF NOT EXISTS idx_scout_agents_last_run_at
ON scout_agents (last_run_at);

-- Commit transaction
COMMIT;

-- Note: Add the functions separately as they are standalone objects
```

## Testing

After running the migration:

1. Verify columns exist:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'scout_agents';
   ```

2. Test the functions:
   ```sql
   -- Test quota check (replace with actual agent ID)
   SELECT check_agent_quota('your-agent-id-here');

   -- Test getting scheduled agents
   SELECT * FROM get_scheduled_agents();
   ```

3. Test updating metrics:
   ```sql
   SELECT update_agent_metrics(
     'your-agent-id-here',
     true,  -- execution_success
     30,    -- execution_time_seconds
     15,    -- api_calls_count
     5,     -- properties_found_count
     0.75   -- estimated_cost_amount
   );
   ```

## Rollback

If you need to rollback these changes:

```sql
-- Remove new columns
ALTER TABLE scout_agents
DROP COLUMN IF EXISTS schedule,
DROP COLUMN IF EXISTS quotas,
DROP COLUMN IF EXISTS usage,
DROP COLUMN IF EXISTS metrics,
DROP COLUMN IF EXISTS last_run_at;

-- Drop indexes
DROP INDEX IF EXISTS idx_scout_agents_schedule_enabled;
DROP INDEX IF EXISTS idx_scout_agents_active_scheduled;
DROP INDEX IF EXISTS idx_scout_agents_last_run_at;

-- Drop functions
DROP FUNCTION IF EXISTS update_agent_usage(UUID, INT);
DROP FUNCTION IF EXISTS update_agent_metrics(UUID, BOOLEAN, INT, INT, INT, DECIMAL);
DROP FUNCTION IF EXISTS check_agent_quota(UUID);
DROP FUNCTION IF EXISTS get_scheduled_agents();
```

## Next Steps

1. Run the migration script in Supabase SQL Editor
2. Create the database functions
3. Update your Edge Functions to use the new quota checking and metrics tracking
4. (Optional) Set up cron jobs for automated scheduling
5. Test the UI with the new features

## Notes

- All JSONB columns have sensible defaults, so existing agents will continue to work
- Quotas are disabled by default to maintain backward compatibility
- Metrics will start accumulating from zero for existing agents
- The scheduling system requires a separate cron job or Edge Function to execute

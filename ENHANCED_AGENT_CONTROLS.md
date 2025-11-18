# Enhanced Agent Controls

## Overview

This update significantly enhances the AI agent control system in the Win With Deeds platform by adding three major features:

1. **Scheduling System** - Automated agent execution on defined schedules
2. **Quota Management** - Resource limits and usage tracking
3. **Performance Metrics** - Execution statistics and cost tracking

## Features

### 1. Scheduling System

Agents can now run automatically on predefined schedules instead of just manual execution.

**Available Frequencies:**
- **Manual Only** - Traditional manual-only execution
- **Hourly** - Runs every hour
- **Every 4 Hours** - Runs every 4 hours
- **Every 12 Hours** - Runs every 12 hours
- **Daily** - Runs once per day at a specified time
- **Weekly** - Runs once per week at a specified time
- **Custom Interval** - Runs every X hours (user-defined)

**Features:**
- Enable/disable scheduling per agent
- Set specific time of day for daily/weekly schedules
- Visual indicators showing schedule status
- Schedule information displayed on agent cards

**UI Location:**
- Scout Agent form → "Advanced" tab → Scheduling section

### 2. Quota Management

Control resource usage and costs by setting limits on agent executions and API calls.

**Quota Types:**
- **Daily Executions** - Maximum number of times an agent can run per day
- **Monthly API Calls** - Maximum API calls allowed per month
- **Max Concurrent** - Maximum number of agents that can run simultaneously

**Features:**
- Enable/disable quotas per agent
- Real-time usage tracking with progress bars
- Visual warnings when approaching limits (>80% usage)
- Automatic quota enforcement (agents won't run if quota exceeded)
- Daily quota reset at midnight
- Usage statistics displayed on agent cards

**UI Location:**
- Scout Agent form → "Advanced" tab → Quota Management section

### 3. Performance Metrics

Track and analyze agent performance with comprehensive metrics and cost tracking.

**Metrics Tracked:**
- **Total Runs** - All-time execution count
- **Success Rate** - Percentage of successful executions
- **Average Runtime** - Average execution time in seconds
- **Estimated Cost** - Total API costs for the month
- **Execution Results** - Successful vs failed runs
- **Properties Found** - Total properties discovered
- **API Calls** - Total API calls made
- **Performance Trend** - Up, down, or stable
- **Efficiency Metrics** - Cost per property, properties per run, API calls per property

**Features:**
- Real-time metrics updates after each run
- Historical performance tracking
- Cost-effectiveness analysis
- Visual charts and progress indicators
- Metrics displayed in agent cards and admin dashboard

**UI Locations:**
- Scout Agent form → "Metrics" tab
- Admin AI Workforce → "Performance Metrics" tab

## User Interface Changes

### Scout Agent Page (`/scout-agent`)

**Agent Configuration Dialog:**
The agent configuration dialog now uses tabs for better organization:

1. **Basic Tab**
   - Agent name
   - Counties to search
   - Minimum opportunity score
   - Notification method (email/SMS)

2. **Advanced Tab**
   - **Scheduling configuration**
     - Enable/disable scheduling
     - Frequency selection
     - Time of day picker (for daily/weekly)
     - Custom interval input
   - **Quota management**
     - Enable/disable quotas
     - Daily execution limit
     - Monthly API call limit
     - Max concurrent agents
     - Usage progress bars

3. **Metrics Tab**
   - Overview stats (total runs, success rate, avg runtime, estimated cost)
   - Execution results (successful/failed runs, properties found)
   - Performance trend
   - Efficiency metrics (when data available)

**Agent Cards:**
Enhanced to show:
- Notification method
- Active schedule (if enabled)
- Success rate (if metrics available)
- Daily quota usage (if quotas enabled)

### Admin AI Workforce Page (`/admin/ai-workforce`)

**New Tabbed Interface:**

1. **Agent Status Tab**
   - Real-time status of all system agents
   - Run Now buttons for manual execution
   - Agent status indicators (Live/Inactive)

2. **Performance Metrics Tab**
   - System-wide metrics cards:
     - Total Agent Runs (all time)
     - Success Rate (last 30 days)
     - Properties Found (this month)
   - Performance overview (placeholder for future charts)

3. **Activity Log Tab**
   - Live activity feed
   - Recent agent operations
   - Timestamps for all activities

## Components Created

### New Components

1. **`AgentScheduler.jsx`** (`src/components/AgentScheduler.jsx`)
   - Scheduling configuration UI
   - Frequency selection
   - Time picker for daily/weekly schedules
   - Custom interval input
   - Visual schedule summary

2. **`AgentQuotaManager.jsx`** (`src/components/AgentQuotaManager.jsx`)
   - Quota configuration UI
   - Usage tracking with progress bars
   - Limit warnings
   - Real-time usage display

3. **`AgentPerformanceMetrics.jsx`** (`src/components/AgentPerformanceMetrics.jsx`)
   - Comprehensive metrics dashboard
   - Statistics cards
   - Execution results breakdown
   - Performance trends
   - Efficiency analysis

### New UI Components

4. **`Progress.jsx`** (`src/components/ui/progress.jsx`)
   - Radix UI progress bar component
   - Used for quota usage visualization

5. **`Alert.jsx`** (`src/components/ui/alert.jsx`)
   - Alert/notification component
   - Used for quota warnings

### Modified Components

6. **`ScoutAgent.jsx`** (`src/pages/ScoutAgent.jsx`)
   - Added tabbed interface to agent form
   - Integrated scheduling, quota, and metrics components
   - Enhanced agent cards with new information
   - Added state management for new features

7. **`AdminAIWorkforce.jsx`** (`src/pages/admin/AdminAIWorkforce.jsx`)
   - Added tabbed interface
   - Added performance metrics tab
   - Enhanced activity log display
   - Improved layout and organization

## Database Changes

The new features require database schema changes. See `DATABASE_MIGRATION_AGENT_CONTROLS.md` for:

- Table schema updates (new JSONB columns)
- Database functions for quota checking and metrics tracking
- Indexes for performance optimization
- Complete migration script
- Rollback instructions

**Key Database Additions:**
- `schedule` column (JSONB) - Scheduling configuration
- `quotas` column (JSONB) - Quota limits
- `usage` column (JSONB) - Current usage tracking
- `metrics` column (JSONB) - Performance statistics
- `last_run_at` column (TIMESTAMPTZ) - Last execution timestamp

## Backend Integration

To fully utilize these features, the following backend updates are needed:

### 1. Edge Function Updates

Update the `run-scout-agent` Edge Function to:

```typescript
// Before execution - Check quotas
const canRun = await supabase
  .rpc('check_agent_quota', { agent_id: agentId });

if (!canRun.data) {
  return new Response(
    JSON.stringify({ error: 'Quota limit reached' }),
    { status: 429 }
  );
}

// After execution - Update metrics
await supabase.rpc('update_agent_metrics', {
  agent_id: agentId,
  execution_success: success,
  execution_time_seconds: executionTime,
  api_calls_count: apiCallsMade,
  properties_found_count: newProperties.length,
  estimated_cost_amount: estimatedCost
});
```

### 2. Scheduled Execution (Optional)

For automatic scheduling, create a new Edge Function that:
- Runs on a cron schedule (e.g., every hour)
- Queries `get_scheduled_agents()` function
- Executes agents based on their schedule configuration
- Respects quota limits

Example using Supabase Edge Functions:

```typescript
// supabase/functions/run-scheduled-agents/index.ts
Deno.serve(async (req) => {
  const agents = await supabase
    .rpc('get_scheduled_agents');

  for (const agent of agents.data) {
    // Check if agent should run based on schedule
    if (shouldRunNow(agent.schedule, agent.last_run_at)) {
      // Execute agent
      await supabase.functions.invoke('run-scout-agent', {
        body: { agentId: agent.id }
      });
    }
  }

  return new Response(JSON.stringify({ processed: agents.data.length }));
});
```

Set up in Supabase Dashboard:
- Deploy the function
- Configure cron trigger (e.g., `0 * * * *` for hourly)

## Installation & Setup

### 1. Install Dependencies

The required dependencies should already be installed:
- `@radix-ui/react-progress`
- `class-variance-authority` (for Alert component)

If not, install them:
```bash
npm install @radix-ui/react-progress class-variance-authority
```

### 2. Run Database Migration

1. Open Supabase SQL Editor
2. Copy and execute the migration script from `DATABASE_MIGRATION_AGENT_CONTROLS.md`
3. Verify columns were created:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'scout_agents';
   ```

### 3. Create Database Functions

Copy and execute the database functions from `DATABASE_MIGRATION_AGENT_CONTROLS.md`:
- `update_agent_usage()`
- `update_agent_metrics()`
- `check_agent_quota()`
- `get_scheduled_agents()`

### 4. Update Edge Functions

Update your `run-scout-agent` Edge Function to:
- Check quotas before execution
- Record metrics after execution

### 5. (Optional) Set Up Scheduled Execution

Create and deploy the scheduled execution Edge Function for automated agent runs.

## Usage Guide

### For End Users

**Creating a Scheduled Agent:**

1. Navigate to `/scout-agent`
2. Click "Deploy New Agent"
3. Fill in basic information (name, counties, score threshold)
4. Switch to "Advanced" tab
5. Enable scheduling
6. Choose frequency (e.g., "Daily")
7. Set time of day
8. Configure quotas if desired
9. Save the agent

**Monitoring Agent Performance:**

1. Click the Edit button on any agent card
2. Switch to "Metrics" tab
3. View performance statistics:
   - Success rate
   - Average runtime
   - Cost estimates
   - Properties found
   - Efficiency metrics

**Managing Quotas:**

1. Edit an agent
2. Go to "Advanced" tab
3. Enable quota management
4. Set limits:
   - Daily executions (e.g., 10 per day)
   - Monthly API calls (e.g., 1000 per month)
   - Max concurrent agents (e.g., 3)
5. Monitor usage in real-time on agent cards

### For Administrators

**Viewing System Metrics:**

1. Navigate to `/admin/ai-workforce`
2. Switch to "Performance Metrics" tab
3. View system-wide statistics
4. Monitor overall agent performance

**Checking Activity:**

1. Navigate to `/admin/ai-workforce`
2. Switch to "Activity Log" tab
3. View real-time agent operations

## Data Persistence

All new features store data in the database:

- **Schedule configurations** are saved to `scout_agents.schedule`
- **Quota settings** are saved to `scout_agents.quotas`
- **Usage data** is tracked in `scout_agents.usage`
- **Metrics** are accumulated in `scout_agents.metrics`

Data persists across sessions and survives agent updates.

## Backward Compatibility

All changes are backward compatible:

- Existing agents continue to work without modification
- New columns have sensible defaults
- Quotas are disabled by default
- Scheduling defaults to "manual only"
- Metrics start at zero for existing agents

## Cost Management

The quota system helps manage API costs:

- Set monthly API call limits to control expenses
- Track estimated costs in the metrics dashboard
- Receive warnings when approaching quota limits
- Automatic enforcement prevents overspending

**Recommended Settings:**

For cost-conscious users:
- Daily executions: 5-10
- Monthly API calls: 500-1000
- Enable quota limits

For power users:
- Daily executions: 20-50
- Monthly API calls: 5000-10000
- Monitor metrics closely

## Troubleshooting

### Agent Won't Run

**Possible causes:**
1. Quota limit reached
   - Check "Advanced" tab → Quota usage
   - Increase limits or wait for daily/monthly reset
2. Agent is inactive
   - Ensure toggle switch is ON
3. Required API keys not configured
   - Check admin API keys page

### Metrics Not Updating

**Possible causes:**
1. Database functions not created
   - Run migration script
2. Edge function not updated
   - Update to call `update_agent_metrics()`
3. Agent hasn't run yet
   - Execute agent manually first

### Schedule Not Working

**Possible causes:**
1. Scheduling is disabled
   - Enable in "Advanced" tab
2. Cron job not set up
   - Deploy scheduled execution Edge Function
3. Quota limits blocking execution
   - Check and adjust quota settings

## Future Enhancements

Potential additions:

1. **Advanced Scheduling**
   - Day of week selection for weekly schedules
   - Multiple schedules per agent
   - Blackout periods

2. **Enhanced Metrics**
   - Graphical charts and trends
   - Comparative analytics across agents
   - Export metrics to CSV

3. **Smart Quotas**
   - Auto-adjusting quotas based on performance
   - Budget-based quota calculation
   - Cost predictions and recommendations

4. **Notifications**
   - Quota limit warnings via email/SMS
   - Performance degradation alerts
   - Schedule execution confirmations

5. **Agent Templates**
   - Pre-configured agent templates
   - Recommended settings based on use case
   - Quick-start configurations

## Support

For issues or questions:
- Check `DATABASE_MIGRATION_AGENT_CONTROLS.md` for database setup
- Review component documentation in source files
- Test database functions individually
- Verify Edge Function updates

## Summary

The enhanced agent controls provide a professional, enterprise-grade agent management system with:

✅ Flexible scheduling options
✅ Cost control via quotas
✅ Comprehensive performance tracking
✅ Intuitive UI with tabs organization
✅ Real-time usage monitoring
✅ Backward compatibility
✅ Extensive documentation

Users can now:
- Automate agent execution
- Control costs effectively
- Monitor performance metrics
- Optimize agent efficiency
- Make data-driven decisions

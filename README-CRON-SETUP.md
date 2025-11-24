# Tax Deed Auction Expiry Cron Job Setup

This document explains how to set up the automated auction expiry notification system.

## What This Does

The cron job automatically checks for upcoming tax deed auctions and creates notifications for your clients:
- **7 days before**: "Auction in 7 days" notification
- **3 days before**: "Auction in 3 days" notification
- **1 day before**: "URGENT: Auction tomorrow" notification

Currently runs **daily at 8:00 AM UTC** (configured in `vercel.json`).

## Setup Steps

### 1. Add Environment Variables to Vercel

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

```
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGFwcWZ1ZWdicXp0dWV0a3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTY4NTEsImV4cCI6MjA3NDQ5Mjg1MX0.mWkZO0jU64_U6JUug7IOhdQmRpiRunahy-QFTLfQCWY
```

**Optional (for better security):**
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
CRON_SECRET=your-random-secret-here
```

The service role key can be found in your Supabase dashboard under Settings → API.

### 2. Create the Notifications Table

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `supabase-notifications-table.sql`
4. Run the SQL

This creates a `notifications` table to store all auction reminders.

### 3. Deploy to Vercel

After adding the environment variables and creating the table:

```bash
git add .
git commit -m "Add auction expiry cron job"
git push
```

Vercel will automatically deploy and set up the cron job.

### 4. Verify It's Working

After deployment, you can test the endpoint manually:

```bash
curl -X POST https://your-app.vercel.app/api/cron/send/tx-deed/expiry/update
```

Or check the Vercel logs to see the cron job running daily.

## Current Status

✅ Cron job checks for upcoming auctions
✅ Creates notification records in database
✅ Categorizes by urgency (urgent/high/medium)
⏳ **TODO**: Integrate with SendGrid to send actual emails
⏳ **TODO**: Add user preferences for notification types

## Future Enhancements

- [ ] Send emails via SendGrid when notifications are created
- [ ] Allow users to customize notification preferences (7 days, 3 days, etc.)
- [ ] Add SMS notifications via Twilio
- [ ] Create in-app notification system
- [ ] Add user-property relationships for targeted notifications

## Cron Schedule

The cron job runs daily at 8:00 AM UTC. You can change this in `vercel.json`:

```json
"crons": [
  {
    "path": "/api/cron/send/tx-deed/expiry/update",
    "schedule": "0 8 * * *"  // Change this line
  }
]
```

Schedule format: `minute hour day-of-month month day-of-week`
- `0 8 * * *` = 8:00 AM UTC daily
- `0 */6 * * *` = Every 6 hours
- `0 12 * * 1` = Noon UTC every Monday

## Troubleshooting

### "Invalid connection URL" error
- Make sure environment variables are set in Vercel
- Redeploy after adding environment variables

### Cron job not running
- Check Vercel logs for errors
- Verify the cron configuration in `vercel.json`
- Ensure your Vercel plan supports cron jobs (Hobby plan has limits)

### Notifications not appearing
- Check if the notifications table was created successfully
- Verify RLS policies allow inserting records
- Check Supabase logs for errors

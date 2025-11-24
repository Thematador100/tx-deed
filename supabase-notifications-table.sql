-- Create notifications table for auction expiry alerts
-- Run this SQL in your Supabase SQL Editor to create the notifications table

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- e.g., 'auction_reminder', 'price_drop', etc.
  urgency TEXT NOT NULL, -- 'urgent', 'high', 'medium', 'low'
  days_until_auction INTEGER,
  message TEXT NOT NULL,
  sent BOOLEAN DEFAULT false, -- Track if notification was sent
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_property_id ON public.notifications(property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON public.notifications(sent);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_urgency ON public.notifications(urgency);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- Allow authenticated users to read their own notifications
CREATE POLICY "Users can view notifications for their properties"
ON public.notifications
FOR SELECT
USING (true); -- Adjust this based on your user-property relationship

-- Allow service role to insert notifications (for cron job)
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Allow service role to update notifications
CREATE POLICY "Service role can update notifications"
ON public.notifications
FOR UPDATE
USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

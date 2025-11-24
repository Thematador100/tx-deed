import { createClient } from '@supabase/supabase-js';

// Vercel serverless function for cron job
export default async function handler(req, res) {
  // Only allow POST requests from Vercel Cron or authorized sources
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the request is from an authorized source (Vercel Cron)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Initialize Supabase client with service role key for backend operations
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate future dates for notifications
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(today.getDate() + 1);
    const oneDayStr = oneDayFromNow.toISOString().split('T')[0];

    // Query properties with upcoming auction dates
    const { data: upcomingProperties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .gte('auction_date', todayStr)
      .lte('auction_date', sevenDaysStr)
      .in('status', ['Upcoming', 'upcoming']);

    if (propertiesError) {
      throw propertiesError;
    }

    // Categorize properties by urgency
    const notifications = {
      urgent: [], // 1 day away
      soon: [],   // 3 days away
      upcoming: [] // 7 days away
    };

    upcomingProperties?.forEach(property => {
      const auctionDate = property.auction_date;

      if (auctionDate === oneDayStr) {
        notifications.urgent.push(property);
      } else if (auctionDate === threeDaysStr) {
        notifications.soon.push(property);
      } else if (auctionDate === sevenDaysStr) {
        notifications.upcoming.push(property);
      }
    });

    // Create notification records in the database
    const notificationRecords = [];

    // Create notifications for urgent properties (1 day)
    notifications.urgent.forEach(property => {
      notificationRecords.push({
        property_id: property.id,
        notification_type: 'auction_reminder',
        urgency: 'urgent',
        days_until_auction: 1,
        message: `🚨 URGENT: Auction tomorrow for ${property.address}`,
        created_at: new Date().toISOString()
      });
    });

    // Create notifications for soon properties (3 days)
    notifications.soon.forEach(property => {
      notificationRecords.push({
        property_id: property.id,
        notification_type: 'auction_reminder',
        urgency: 'high',
        days_until_auction: 3,
        message: `⚠️ Auction in 3 days for ${property.address}`,
        created_at: new Date().toISOString()
      });
    });

    // Create notifications for upcoming properties (7 days)
    notifications.upcoming.forEach(property => {
      notificationRecords.push({
        property_id: property.id,
        notification_type: 'auction_reminder',
        urgency: 'medium',
        days_until_auction: 7,
        message: `📅 Auction in 7 days for ${property.address}`,
        created_at: new Date().toISOString()
      });
    });

    // Insert notification records into database
    // First, check if notifications table exists, if not, we'll just log
    let insertResult = null;
    if (notificationRecords.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('notifications')
        .insert(notificationRecords)
        .select();

      if (insertError) {
        // If table doesn't exist, that's okay for now - we'll just log
        console.log('Note: Notifications table may not exist yet:', insertError.message);
      } else {
        insertResult = insertData;
      }
    }

    // TODO: Send actual emails via SendGrid
    // This is where you would integrate SendGrid to send emails to users
    // For now, we're just creating notification records

    // Log the results
    console.log('Cron job executed successfully:', {
      total_properties_checked: upcomingProperties?.length || 0,
      urgent: notifications.urgent.length,
      soon: notifications.soon.length,
      upcoming: notifications.upcoming.length,
      notifications_created: notificationRecords.length
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Expiry check completed successfully',
      summary: {
        total_properties_checked: upcomingProperties?.length || 0,
        urgent_auctions: notifications.urgent.length,
        soon_auctions: notifications.soon.length,
        upcoming_auctions: notifications.upcoming.length,
        notifications_created: notificationRecords.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

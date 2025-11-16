# Real-Time Notifications System

A comprehensive real-time notification system for Win With Deeds platform, built with Supabase real-time subscriptions and React.

## Features

- **Real-time notifications** - Instant push notifications using Supabase real-time subscriptions
- **Notification bell dropdown** - Quick access to recent notifications with unread count badge
- **Full notifications page** - Dedicated page to view, filter, and manage all notifications
- **Notification types** - Support for multiple notification types (property, auction, deal, system, message, payment, alert)
- **Mark as read/unread** - Individual and bulk read/unread actions
- **Delete notifications** - Individual and bulk delete actions
- **Sound notifications** - Optional audio notification on new notifications
- **Persistent storage** - All notifications stored in Supabase database
- **Row Level Security** - Users can only access their own notifications
- **Mobile responsive** - Optimized for all screen sizes

## Setup Instructions

### 1. Database Setup

Apply the database migration to create the notifications table:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard at https://supabase.com
2. Navigate to the **SQL Editor**
3. Open the file `supabase/migrations/001_create_notifications.sql`
4. Copy and paste the entire SQL content into the SQL Editor
5. Click **Run** to execute the migration
6. Verify the table was created by navigating to **Table Editor** and checking for the `notifications` table

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### 2. Verify Database Setup

After applying the migration, verify that:

1. The `notifications` table exists with the following columns:
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `type` (VARCHAR)
   - `title` (VARCHAR)
   - `message` (TEXT)
   - `link` (VARCHAR, nullable)
   - `read` (BOOLEAN, default false)
   - `created_at` (TIMESTAMP)
   - `metadata` (JSONB)

2. Row Level Security (RLS) policies are enabled
3. Indexes are created for optimal performance

### 3. Test the System

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Login to your account** or create a new account

3. **Test notifications:**
   - Navigate to the Member Dashboard (`/member-dashboard`)
   - Click the **Test Notification** button in the Premium Toolkit section
   - You should see:
     - A toast notification appear
     - The notification bell icon update with an unread count badge
     - The notification appear in the bell dropdown
     - (Optional) A sound notification play

4. **Test notification interactions:**
   - Click the bell icon to open the notification dropdown
   - Click on a notification to mark it as read and navigate to its link
   - Click "Mark all read" to mark all notifications as read
   - Click "Clear all" to delete all notifications
   - Navigate to `/notifications` to see the full notifications page

## Architecture

### Components

1. **NotificationContext** (`src/contexts/NotificationContext.jsx`)
   - Manages notification state and real-time subscriptions
   - Provides hooks for notification CRUD operations
   - Handles real-time updates via Supabase channels

2. **NotificationCenter** (`src/components/NotificationCenter.jsx`)
   - Dropdown component displayed in the navbar
   - Shows recent notifications with unread badge
   - Quick actions: mark as read, delete, view all

3. **Notifications Page** (`src/pages/Notifications.jsx`)
   - Full-page view of all notifications
   - Filter by type (all, unread, property, auction, deal, system)
   - Bulk actions (mark all read, clear all)
   - Detailed notification cards with timestamps

4. **Notification Service** (`src/lib/notificationService.js`)
   - Centralized service for creating notifications
   - Pre-built notification templates
   - Bulk notification support
   - Role-based notification sending

### Database Schema

```sql
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  link VARCHAR(500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
)
```

### Real-time Flow

1. **Notification Creation:**
   ```javascript
   notificationService.sendNotification(userId, {
     type: 'property',
     title: 'New Property Available',
     message: 'Check out this new property...',
     link: '/property/123'
   });
   ```

2. **Database Insert:**
   - Notification inserted into `notifications` table
   - Database trigger fires `notify_new_notification()` function

3. **Real-time Broadcast:**
   - Supabase broadcasts insert event to subscribed clients
   - NotificationContext receives the event

4. **Client Update:**
   - New notification added to local state
   - Unread count updated
   - Toast notification displayed
   - Audio notification played (optional)

## Usage Examples

### Using NotificationService

```javascript
import notificationService from '@/lib/notificationService';

// Send a simple notification
await notificationService.sendNotification(userId, {
  type: 'system',
  title: 'Welcome!',
  message: 'Thanks for joining our platform',
  link: '/dashboard'
});

// Send a property notification
await notificationService.notifyNewProperty(userId, {
  id: 'property-123',
  address: '123 Main St, Austin, TX'
});

// Send auction notification
await notificationService.notifyAuction(userId, {
  id: 'auction-456',
  address: '456 Oak Ave',
  message: 'Auction starting in 1 hour!'
});

// Send to all users with a role
await notificationService.sendToRole('admin', {
  type: 'system',
  title: 'Admin Alert',
  message: 'New admin features available'
});

// Send to all users
await notificationService.sendToAllUsers({
  type: 'system',
  title: 'Platform Update',
  message: 'We have released new features!'
});
```

### Using NotificationContext Hook

```javascript
import { useNotifications } from '@/contexts/NotificationContext';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createNotification,
  } = useNotifications();

  // Mark a notification as read
  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  // Delete a notification
  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.title}
        </div>
      ))}
    </div>
  );
}
```

## Notification Types

The system supports the following notification types:

| Type | Icon | Use Case | Example |
|------|------|----------|---------|
| `property` | 🏠 | New properties, property updates | "New property matching your criteria" |
| `auction` | ⚖️ | Auction alerts, bidding updates | "Auction starting in 1 hour" |
| `deal` | 💼 | Deal updates, pipeline changes | "Deal moved to closing stage" |
| `system` | 🔔 | System messages, announcements | "Welcome to the platform" |
| `message` | 💬 | New messages, chat notifications | "You have a new message" |
| `payment` | 💳 | Payment confirmations, billing | "Payment successful" |
| `alert` | ⚠️ | Urgent alerts, warnings | "Action required on your account" |

## Adding Notification Triggers

### Example: Property Added

```javascript
// In your property creation logic
const handleAddProperty = async (propertyData) => {
  // Create the property
  const { data: property, error } = await supabase
    .from('properties')
    .insert(propertyData)
    .select()
    .single();

  if (error) return;

  // Send notification to interested users
  const interestedUsers = await findInterestedUsers(property);

  for (const userId of interestedUsers) {
    await notificationService.notifyPropertyMatch(userId, {
      id: property.id,
      address: property.address,
      matchScore: 95
    });
  }
};
```

### Example: Auction Ending Soon

```javascript
// In a scheduled job or cron task
const checkAuctionsEndingSoon = async () => {
  const endingSoonAuctions = await getAuctionsEndingInOneHour();

  for (const auction of endingSoonAuctions) {
    // Get users watching this auction
    const watchers = await getAuctionWatchers(auction.id);

    for (const userId of watchers) {
      await notificationService.notifyAuctionEnding(userId, {
        id: auction.id,
        propertyId: auction.property_id,
        address: auction.address,
        timeRemaining: '1 hour',
        endsAt: auction.ends_at
      });
    }
  }
};
```

## Customization

### Customize Notification Sound

Edit the `playNotificationSound()` function in `NotificationContext.jsx`:

```javascript
const playNotificationSound = () => {
  try {
    // Use a custom audio file
    const audio = new Audio('/path/to/your/notification-sound.mp3');
    audio.volume = 0.5; // Adjust volume (0.0 to 1.0)
    audio.play().catch(() => {});
  } catch (error) {
    // Silently fail
  }
};
```

### Customize Notification Appearance

Edit the notification card in `NotificationCenter.jsx` or `Notifications.jsx`:

```javascript
// Change colors, styles, layout, etc.
<div className={cn(
  'block p-3 hover:bg-accent transition-colors',
  !notification.read && 'bg-purple-50' // Change unread color
)}>
  {/* Notification content */}
</div>
```

### Add Auto-dismiss for Toasts

In `NotificationContext.jsx`, modify the toast call:

```javascript
toast({
  title: newNotification.title,
  description: newNotification.message,
  duration: 3000, // Auto-dismiss after 3 seconds
});
```

## Performance Considerations

- **Limit notifications per user:** The NotificationCenter dropdown shows only the 50 most recent notifications
- **Pagination:** Implement pagination on the Notifications page for users with many notifications
- **Cleanup:** Implement a cleanup job to delete old read notifications after a certain period
- **Indexes:** Database indexes are created on `user_id`, `created_at`, and `read` columns for optimal query performance

## Security

- **Row Level Security (RLS):** Users can only view, update, and delete their own notifications
- **Insert policy:** System can insert notifications for any user (needed for the service)
- **Authentication required:** All notification operations require an authenticated user

## Troubleshooting

### Notifications not appearing in real-time

1. Check that the Supabase real-time subscription is active
2. Verify that the database migration was applied correctly
3. Check browser console for WebSocket connection errors
4. Ensure the user is authenticated

### Notifications database table not found

1. Verify that the migration was applied successfully
2. Check the Supabase dashboard Table Editor to confirm the table exists
3. Try running the migration SQL manually in the SQL Editor

### Notification sound not playing

1. Some browsers block autoplay audio - this is expected behavior
2. The sound will only play after user interaction with the page
3. Check that the audio data URL is valid

## Future Enhancements

- [ ] Push notifications for mobile devices (PWA)
- [ ] Email notifications for important events
- [ ] Notification preferences/settings page
- [ ] Notification categories and filtering
- [ ] Scheduled notifications
- [ ] Notification templates editor
- [ ] Analytics and notification metrics
- [ ] Notification history export

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify database setup in Supabase dashboard
3. Review the code comments in the implementation files
4. Create an issue in the project repository

---

Built with ❤️ using React, Supabase, and Tailwind CSS

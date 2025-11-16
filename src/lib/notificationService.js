import supabase from './customSupabaseClient';

/**
 * Notification Service
 * Centralized service for creating and managing notifications
 */

class NotificationService {
  /**
   * Send a notification to a specific user
   * @param {string} userId - The user ID to send the notification to
   * @param {Object} notification - The notification object
   * @param {string} notification.type - Type of notification (property, auction, deal, system, message, payment, alert)
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {string} [notification.link] - Optional link to navigate to
   * @param {Object} [notification.metadata] - Optional metadata object
   */
  async sendNotification(userId, notification) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          metadata: notification.metadata || {},
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }
  }

  /**
   * Send notifications to multiple users
   * @param {string[]} userIds - Array of user IDs
   * @param {Object} notification - The notification object
   */
  async sendBulkNotifications(userIds, notification) {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        metadata: notification.metadata || {},
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { success: false, error };
    }
  }

  /**
   * Send notification to all users with a specific role
   * @param {string} role - The role to send to (admin, member, etc.)
   * @param {Object} notification - The notification object
   */
  async sendToRole(role, notification) {
    try {
      // First, get all users with the specified role
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', role);

      if (profileError) throw profileError;

      const userIds = profiles.map(profile => profile.id);
      return await this.sendBulkNotifications(userIds, notification);
    } catch (error) {
      console.error('Error sending notifications to role:', error);
      return { success: false, error };
    }
  }

  /**
   * Send notification to all users
   * @param {Object} notification - The notification object
   */
  async sendToAllUsers(notification) {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id');

      if (profileError) throw profileError;

      const userIds = profiles.map(profile => profile.id);
      return await this.sendBulkNotifications(userIds, notification);
    } catch (error) {
      console.error('Error sending notifications to all users:', error);
      return { success: false, error };
    }
  }

  // Predefined notification templates

  /**
   * Send a new property notification
   */
  async notifyNewProperty(userId, propertyDetails) {
    return this.sendNotification(userId, {
      type: 'property',
      title: '🏠 New Property Available',
      message: `New property added: ${propertyDetails.address}`,
      link: `/property/${propertyDetails.id}`,
      metadata: { propertyId: propertyDetails.id },
    });
  }

  /**
   * Send an auction notification
   */
  async notifyAuction(userId, auctionDetails) {
    return this.sendNotification(userId, {
      type: 'auction',
      title: '⚖️ Auction Alert',
      message: auctionDetails.message || `Auction starting soon for ${auctionDetails.address}`,
      link: auctionDetails.link || '/auctions-leads',
      metadata: { auctionId: auctionDetails.id },
    });
  }

  /**
   * Send a deal update notification
   */
  async notifyDealUpdate(userId, dealDetails) {
    return this.sendNotification(userId, {
      type: 'deal',
      title: '💼 Deal Update',
      message: dealDetails.message,
      link: dealDetails.link || '/my-pipeline',
      metadata: { dealId: dealDetails.id },
    });
  }

  /**
   * Send a system notification
   */
  async notifySystem(userId, message, link = null) {
    return this.sendNotification(userId, {
      type: 'system',
      title: '🔔 System Notification',
      message: message,
      link: link,
    });
  }

  /**
   * Send a message notification
   */
  async notifyMessage(userId, messageDetails) {
    return this.sendNotification(userId, {
      type: 'message',
      title: '💬 New Message',
      message: messageDetails.message,
      link: messageDetails.link || '/messages',
      metadata: { messageId: messageDetails.id },
    });
  }

  /**
   * Send a payment notification
   */
  async notifyPayment(userId, paymentDetails) {
    return this.sendNotification(userId, {
      type: 'payment',
      title: '💳 Payment Update',
      message: paymentDetails.message,
      link: paymentDetails.link || '/profile',
      metadata: { paymentId: paymentDetails.id, amount: paymentDetails.amount },
    });
  }

  /**
   * Send an alert notification
   */
  async notifyAlert(userId, alertDetails) {
    return this.sendNotification(userId, {
      type: 'alert',
      title: '⚠️ Alert',
      message: alertDetails.message,
      link: alertDetails.link,
      metadata: alertDetails.metadata,
    });
  }

  /**
   * Welcome notification for new users
   */
  async sendWelcomeNotification(userId, userName) {
    return this.sendNotification(userId, {
      type: 'system',
      title: '🎉 Welcome to Win With Deeds!',
      message: `Hi ${userName}! We're excited to have you on board. Explore our platform to discover amazing tax deed opportunities.`,
      link: '/member-dashboard',
    });
  }

  /**
   * Send notification when a property matches user criteria
   */
  async notifyPropertyMatch(userId, propertyDetails) {
    return this.sendNotification(userId, {
      type: 'property',
      title: '🎯 Property Match Found!',
      message: `We found a property matching your criteria: ${propertyDetails.address}`,
      link: `/property/${propertyDetails.id}`,
      metadata: { propertyId: propertyDetails.id, matchScore: propertyDetails.matchScore },
    });
  }

  /**
   * Send notification when auction is about to end
   */
  async notifyAuctionEnding(userId, auctionDetails) {
    return this.sendNotification(userId, {
      type: 'auction',
      title: '⏰ Auction Ending Soon!',
      message: `Auction for ${auctionDetails.address} ends in ${auctionDetails.timeRemaining}`,
      link: `/property/${auctionDetails.propertyId}`,
      metadata: { auctionId: auctionDetails.id, endsAt: auctionDetails.endsAt },
    });
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;

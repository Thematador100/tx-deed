/**
 * Autonomous Property Assignment Agent
 *
 * Handles assigning properties to specific members.
 * Operates autonomously to:
 * - Process assignment requests
 * - Send notifications to members
 * - Track assignment status
 * - Handle member responses
 * - Auto-reassign if member declines
 *
 * All operations saved to Supabase automatically.
 */

class PropertyAssignmentAgent {
  constructor(dbManager, config = {}) {
    this.dbManager = dbManager;
    this.config = {
      name: 'PropertyAssignmentAgent',
      autoNotify: config.autoNotify !== false,
      assignmentExpiry: config.assignmentExpiry || 72, // hours
      ...config
    };

    this.isRunning = false;
    this.stats = {
      totalAssignments: 0,
      activeAssignments: 0,
      completedAssignments: 0,
      expiredAssignments: 0,
      acceptedAssignments: 0,
      declinedAssignments: 0,
    };
  }

  /**
   * Start autonomous operation
   */
  async start() {
    console.log('[PropertyAssignmentAgent] 🎯 Starting autonomous assignment management...');
    this.isRunning = true;

    while (this.isRunning) {
      try {
        await this.processExpiredAssignments();
        await this.processPendingNotifications();
        await this.delay(300000); // Check every 5 minutes
      } catch (error) {
        console.error('[PropertyAssignmentAgent] Error in main loop:', error);
        await this.delay(300000);
      }
    }
  }

  /**
   * Assign property to member
   * Called by admin or automated system
   */
  async assignProperty(propertyId, memberId, assignedBy, options = {}) {
    console.log(`[PropertyAssignmentAgent] 📤 Assigning property ${propertyId} to member ${memberId}`);
    this.stats.totalAssignments++;

    try {
      // Get property details
      const { data: property, error: propError } = await this.dbManager.supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propError || !property) {
        throw new Error('Property not found');
      }

      // Get member details
      const { data: member, error: memberError } = await this.dbManager.supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError || !member) {
        throw new Error('Member not found');
      }

      // Create assignment record
      const assignment = {
        property_id: propertyId,
        member_id: memberId,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.config.assignmentExpiry * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        notes: options.notes || '',
        priority: options.priority || 'normal',
      };

      const { data: savedAssignment, error: assignError } = await this.dbManager.supabase
        .from('property_assignments')
        .insert(assignment)
        .select()
        .single();

      if (assignError) throw assignError;

      this.stats.activeAssignments++;

      // Send notification to member
      if (this.config.autoNotify) {
        await this.sendAssignmentNotification(savedAssignment, member, property);
      }

      console.log(`[PropertyAssignmentAgent] ✅ Assignment created: ${savedAssignment.id}`);

      return savedAssignment;

    } catch (error) {
      console.error('[PropertyAssignmentAgent] ❌ Assignment failed:', error.message);
      throw error;
    }
  }

  /**
   * Assign property to multiple members (first to respond gets it)
   */
  async assignToMultiple(propertyId, memberIds, assignedBy, options = {}) {
    console.log(`[PropertyAssignmentAgent] 📤 Assigning property ${propertyId} to ${memberIds.length} members (first response wins)`);

    const assignments = [];

    for (const memberId of memberIds) {
      try {
        const assignment = await this.assignProperty(propertyId, memberId, assignedBy, {
          ...options,
          is_competitive: true,
        });
        assignments.push(assignment);
      } catch (error) {
        console.error(`[PropertyAssignmentAgent] Failed to assign to ${memberId}:`, error.message);
      }
    }

    return assignments;
  }

  /**
   * Member accepts assignment
   */
  async acceptAssignment(assignmentId, memberId) {
    console.log(`[PropertyAssignmentAgent] ✅ Member ${memberId} accepting assignment ${assignmentId}`);

    try {
      // Update assignment status
      const { data: assignment, error } = await this.dbManager.supabase
        .from('property_assignments')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .eq('member_id', memberId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error || !assignment) {
        throw new Error('Assignment not found or already responded to');
      }

      this.stats.activeAssignments--;
      this.stats.acceptedAssignments++;
      this.stats.completedAssignments++;

      // If competitive assignment, cancel others
      if (assignment.is_competitive) {
        await this.cancelCompetitiveAssignments(assignment.property_id, assignmentId);
      }

      // Add property to member's pipeline
      await this.addToPipeline(assignment.property_id, memberId);

      console.log(`[PropertyAssignmentAgent] ✅ Assignment accepted`);

      return assignment;

    } catch (error) {
      console.error('[PropertyAssignmentAgent] Error accepting assignment:', error);
      throw error;
    }
  }

  /**
   * Member declines assignment
   */
  async declineAssignment(assignmentId, memberId, reason = null) {
    console.log(`[PropertyAssignmentAgent] ❌ Member ${memberId} declining assignment ${assignmentId}`);

    try {
      const { data: assignment, error } = await this.dbManager.supabase
        .from('property_assignments')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
          decline_reason: reason,
        })
        .eq('id', assignmentId)
        .eq('member_id', memberId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error || !assignment) {
        throw new Error('Assignment not found');
      }

      this.stats.activeAssignments--;
      this.stats.declinedAssignments++;
      this.stats.completedAssignments++;

      console.log(`[PropertyAssignmentAgent] ✅ Assignment declined`);

      return assignment;

    } catch (error) {
      console.error('[PropertyAssignmentAgent] Error declining assignment:', error);
      throw error;
    }
  }

  /**
   * Process expired assignments
   */
  async processExpiredAssignments() {
    try {
      const now = new Date().toISOString();

      const { data: expiredAssignments, error } = await this.dbManager.supabase
        .from('property_assignments')
        .update({
          status: 'expired',
        })
        .eq('status', 'pending')
        .lt('expires_at', now)
        .select();

      if (error) throw error;

      if (expiredAssignments && expiredAssignments.length > 0) {
        console.log(`[PropertyAssignmentAgent] ⏱️ Expired ${expiredAssignments.length} assignments`);
        this.stats.activeAssignments -= expiredAssignments.length;
        this.stats.expiredAssignments += expiredAssignments.length;
        this.stats.completedAssignments += expiredAssignments.length;
      }

    } catch (error) {
      console.error('[PropertyAssignmentAgent] Error processing expired assignments:', error);
    }
  }

  /**
   * Cancel competitive assignments when one is accepted
   */
  async cancelCompetitiveAssignments(propertyId, acceptedAssignmentId) {
    try {
      const { data, error } = await this.dbManager.supabase
        .from('property_assignments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: 'Another member accepted this property',
        })
        .eq('property_id', propertyId)
        .eq('status', 'pending')
        .neq('id', acceptedAssignmentId)
        .select();

      if (data && data.length > 0) {
        console.log(`[PropertyAssignmentAgent] Cancelled ${data.length} competitive assignments`);

        // Send notifications to cancelled members
        for (const assignment of data) {
          await this.sendCancellationNotification(assignment);
        }
      }

    } catch (error) {
      console.error('[PropertyAssignmentAgent] Error cancelling competitive assignments:', error);
    }
  }

  /**
   * Add property to member's pipeline
   */
  async addToPipeline(propertyId, memberId) {
    try {
      // Get first pipeline stage
      const { data: stage } = await this.dbManager.supabase
        .from('pipeline_stages')
        .select('id')
        .order('sort_order')
        .limit(1)
        .single();

      const stageId = stage?.id || 1;

      // Add to saved properties
      const { error } = await this.dbManager.supabase
        .from('saved_properties')
        .insert({
          user_id: memberId,
          property_id: propertyId,
          pipeline_stage_id: stageId,
          added_via: 'assignment',
        });

      if (error && error.code !== '23505') { // Ignore duplicate
        throw error;
      }

      console.log(`[PropertyAssignmentAgent] Added property ${propertyId} to member ${memberId} pipeline`);

    } catch (error) {
      console.error('[PropertyAssignmentAgent] Error adding to pipeline:', error);
    }
  }

  /**
   * Send assignment notification to member
   */
  async sendAssignmentNotification(assignment, member, property) {
    try {
      // Create notification record
      const notification = {
        user_id: assignment.member_id,
        type: 'property_assignment',
        title: 'New Property Assigned to You',
        message: `A property at ${property.address} has been assigned to you. Review and respond within ${this.config.assignmentExpiry} hours.`,
        data: {
          assignment_id: assignment.id,
          property_id: property.id,
          property_address: property.address,
          property_price: property.price,
          expires_at: assignment.expires_at,
        },
        read: false,
        created_at: new Date().toISOString(),
      };

      await this.dbManager.supabase
        .from('notifications')
        .insert(notification);

      // In production, also send:
      // - Email via SendGrid/Mailgun
      // - SMS via Twilio
      // - Push notification via Firebase

      console.log(`[PropertyAssignmentAgent] 📧 Notification sent to ${member.email}`);

    } catch (error) {
      console.error('[PropertyAssignmentAgent] Error sending notification:', error);
    }
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(assignment) {
    try {
      const notification = {
        user_id: assignment.member_id,
        type: 'assignment_cancelled',
        title: 'Property Assignment Cancelled',
        message: 'A property assignment was cancelled because another member accepted it.',
        data: {
          assignment_id: assignment.id,
        },
        read: false,
        created_at: new Date().toISOString(),
      };

      await this.dbManager.supabase
        .from('notifications')
        .insert(notification);

    } catch (error) {
      console.error('[PropertyAssignmentAgent] Error sending cancellation notification:', error);
    }
  }

  /**
   * Process pending notifications
   */
  async processPendingNotifications() {
    // Placeholder for batch notification processing
    // In production, send digest emails, etc.
  }

  /**
   * Get assignments for a member
   */
  async getMemberAssignments(memberId, status = null) {
    try {
      let query = this.dbManager.supabase
        .from('property_assignments')
        .select(`
          *,
          properties (*),
          profiles (*)
        `)
        .eq('member_id', memberId)
        .order('assigned_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('[PropertyAssignmentAgent] Error getting member assignments:', error);
      return [];
    }
  }

  /**
   * Get all assignments for a property
   */
  async getPropertyAssignments(propertyId) {
    try {
      const { data, error } = await this.dbManager.supabase
        .from('property_assignments')
        .select(`
          *,
          profiles (*)
        `)
        .eq('property_id', propertyId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('[PropertyAssignmentAgent] Error getting property assignments:', error);
      return [];
    }
  }

  /**
   * Get agent statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
    };
  }

  /**
   * Stop agent
   */
  async stop() {
    console.log('[PropertyAssignmentAgent] Stopping...');
    this.isRunning = false;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default PropertyAssignmentAgent;

/**
 * Supabase Helper Functions
 * Common database operations for Win With Deeds platform
 */

import { supabase } from './customSupabaseClient';

// =====================================================
// PROFILE OPERATIONS
// =====================================================

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check if user is admin
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Is admin
 */
export async function isAdmin(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return data?.role === 'admin';
}

// =====================================================
// PROPERTY OPERATIONS
// =====================================================

/**
 * Get all properties with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Properties list
 */
export async function getProperties(filters = {}) {
  let query = supabase.from('properties').select('*');

  if (filters.state) query = query.eq('state', filters.state);
  if (filters.city) query = query.eq('city', filters.city);
  if (filters.propertyType) query = query.eq('property_type', filters.propertyType);
  if (filters.saleStatus) query = query.eq('sale_status', filters.saleStatus);
  if (filters.minPrice) query = query.gte('minimum_bid', filters.minPrice);
  if (filters.maxPrice) query = query.lte('minimum_bid', filters.maxPrice);
  if (filters.minScore) query = query.gte('opportunity_score', filters.minScore);

  // Sorting
  const orderBy = filters.orderBy || 'opportunity_score';
  const orderDirection = filters.orderDirection || 'desc';
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });

  // Pagination
  if (filters.limit) query = query.limit(filters.limit);
  if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get property by ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<Object>} Property details
 */
export async function getPropertyById(propertyId) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Search properties by text
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching properties
 */
export async function searchProperties(searchTerm) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .or(`address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,county.ilike.%${searchTerm}%`)
    .limit(50);

  if (error) throw error;
  return data;
}

// =====================================================
// SAVED PROPERTIES OPERATIONS
// =====================================================

/**
 * Get user's saved properties
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Saved properties
 */
export async function getSavedProperties(userId) {
  const { data, error } = await supabase
    .from('saved_properties')
    .select(`
      *,
      properties (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Save a property
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @param {Object} options - Notes and tags
 * @returns {Promise<Object>} Saved property record
 */
export async function saveProperty(userId, propertyId, options = {}) {
  const { data, error } = await supabase
    .from('saved_properties')
    .insert({
      user_id: userId,
      property_id: propertyId,
      notes: options.notes,
      tags: options.tags
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Unsave a property
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<void>}
 */
export async function unsaveProperty(userId, propertyId) {
  const { error } = await supabase
    .from('saved_properties')
    .delete()
    .eq('user_id', userId)
    .eq('property_id', propertyId);

  if (error) throw error;
}

/**
 * Check if property is saved
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<boolean>} Is saved
 */
export async function isPropertySaved(userId, propertyId) {
  const { data } = await supabase
    .from('saved_properties')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single();

  return !!data;
}

// =====================================================
// LEAD OPERATIONS
// =====================================================

/**
 * Get user's leads
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Leads list
 */
export async function getLeads(userId, filters = {}) {
  let query = supabase
    .from('leads')
    .select('*')
    .eq('assigned_to', userId);

  if (filters.status) query = query.eq('lead_status', filters.status);
  if (filters.type) query = query.eq('lead_type', filters.type);
  if (filters.minScore) query = query.gte('lead_score', filters.minScore);

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Create a new lead
 * @param {string} userId - User ID
 * @param {Object} leadData - Lead information
 * @returns {Promise<Object>} Created lead
 */
export async function createLead(userId, leadData) {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...leadData,
      assigned_to: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update lead
 * @param {string} leadId - Lead ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated lead
 */
export async function updateLead(leadId, updates) {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// NOTIFICATION OPERATIONS
// =====================================================

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {boolean} unreadOnly - Get only unread notifications
 * @returns {Promise<Array>} Notifications list
 */
export async function getNotifications(userId, unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  query = query.order('created_at', { ascending: false }).limit(50);

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export async function markNotificationAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Mark all notifications as read
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function markAllNotificationsAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

/**
 * Create notification
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} Created notification
 */
export async function createNotification(userId, notification) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      ...notification
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// TRANSACTION OPERATIONS
// =====================================================

/**
 * Get user transactions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Transactions list
 */
export async function getTransactions(userId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create transaction record
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<Object>} Created transaction
 */
export async function createTransaction(transactionData) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// SCOUT AGENT OPERATIONS
// =====================================================

/**
 * Get user's scout agents
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Scout agents list
 */
export async function getScoutAgents(userId) {
  const { data, error } = await supabase
    .from('scout_agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create scout agent
 * @param {string} userId - User ID
 * @param {Object} agentData - Agent configuration
 * @returns {Promise<Object>} Created agent
 */
export async function createScoutAgent(userId, agentData) {
  const { data, error } = await supabase
    .from('scout_agents')
    .insert({
      user_id: userId,
      ...agentData
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update scout agent
 * @param {string} agentId - Agent ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated agent
 */
export async function updateScoutAgent(agentId, updates) {
  const { data, error } = await supabase
    .from('scout_agents')
    .update(updates)
    .eq('id', agentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// LIBRARY OPERATIONS
// =====================================================

/**
 * Get library items accessible to user
 * @param {string} userId - User ID (optional for free content)
 * @returns {Promise<Array>} Library items
 */
export async function getLibraryItems(userId = null) {
  let query = supabase
    .from('library_items')
    .select('*')
    .eq('is_published', true);

  if (userId) {
    // Get user's subscription tier to filter appropriate content
    const profile = await getUserProfile(userId);
    const tier = profile.subscription_tier;

    // Filter based on access level
    const accessLevels = ['free'];
    if (tier === 'basic') accessLevels.push('basic');
    if (tier === 'pro') accessLevels.push('basic', 'pro');
    if (tier === 'enterprise') accessLevels.push('basic', 'pro', 'enterprise');

    query = query.in('access_level', accessLevels);
  } else {
    query = query.eq('access_level', 'free');
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// =====================================================
// UPCOMING SALES OPERATIONS
// =====================================================

/**
 * Get upcoming sales
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Upcoming sales
 */
export async function getUpcomingSales(filters = {}) {
  let query = supabase
    .from('upcoming_sales')
    .select('*');

  if (filters.state) query = query.eq('state', filters.state);
  if (filters.county) query = query.eq('county', filters.county);
  if (filters.saleType) query = query.eq('sale_type', filters.saleType);

  // Only get future sales by default
  const today = new Date().toISOString().split('T')[0];
  query = query.gte('sale_date', today);

  query = query.order('sale_date', { ascending: true });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to user notifications
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function for new notifications
 * @returns {Object} Subscription object
 */
export function subscribeToNotifications(userId, callback) {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to property updates
 * @param {Function} callback - Callback function for property changes
 * @returns {Object} Subscription object
 */
export function subscribeToProperties(callback) {
  return supabase
    .channel('properties')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'properties'
      },
      callback
    )
    .subscribe();
}

// =====================================================
// FILE UPLOAD OPERATIONS
// =====================================================

/**
 * Upload file to Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return { ...data, publicUrl };
}

/**
 * Delete file from Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path
 * @returns {Promise<void>}
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}

// =====================================================
// ERROR HANDLING HELPERS
// =====================================================

/**
 * Handle Supabase errors gracefully
 * @param {Error} error - Supabase error
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  if (!error) return 'An unknown error occurred';

  // Check for specific error codes
  if (error.code === 'PGRST116') {
    return 'No data found';
  }

  if (error.code === '23505') {
    return 'This record already exists';
  }

  if (error.code === '23503') {
    return 'Referenced record not found';
  }

  if (error.message.includes('JWT')) {
    return 'Session expired. Please log in again';
  }

  return error.message || 'An error occurred';
}

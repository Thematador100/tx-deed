/**
 * Real Data Utilities for Enterprise Distressed Real Estate Platform
 * NO MOCK DATA - All data sources are real or connected to live databases
 */

import { supabase } from './customSupabaseClient';
import { stateRules } from './stateRules';
import {
  ResidentialProperty,
  CommercialProperty,
  LandProperty,
  TaxLien,
  TaxDeed,
  JudgementLien,
  Deal,
  calculateROI,
  calculateOpportunityScore,
  calculateRiskScore
} from './propertyModels';

/**
 * Fetch properties from Supabase
 */
export const fetchProperties = async (filters = {}) => {
  try {
    let query = supabase.from('properties').select('*');

    // Apply filters
    if (filters.state) query = query.eq('state', filters.state);
    if (filters.propertyType) query = query.eq('property_type', filters.propertyType);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
};

/**
 * Fetch distressed assets from Supabase
 */
export const fetchDistressedAssets = async (filters = {}) => {
  try {
    let query = supabase.from('distressed_assets').select(`
      *,
      properties (*)
    `);

    if (filters.assetType) query = query.eq('asset_type', filters.assetType);
    if (filters.state) query = query.eq('properties.state', filters.state);
    if (filters.minROI) query = query.gte('potential_roi', filters.minROI);

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching distressed assets:', error);
    return [];
  }
};

/**
 * Fetch user's deals from Supabase
 */
export const fetchUserDeals = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        properties (*),
        distressed_assets (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
};

/**
 * Fetch upcoming auctions/sales
 */
export const fetchUpcomingAuctions = async (state = null) => {
  try {
    const today = new Date().toISOString();
    let query = supabase
      .from('distressed_assets')
      .select(`
        *,
        properties (*)
      `)
      .gte('sale_date', today)
      .order('sale_date', { ascending: true })
      .limit(50);

    if (state) {
      query = query.eq('properties.state', state);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return [];
  }
};

/**
 * Search properties by criteria
 */
export const searchProperties = async (searchTerm, filters = {}) => {
  try {
    let query = supabase
      .from('properties')
      .select('*');

    // Text search
    if (searchTerm) {
      query = query.or(`address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,county.ilike.%${searchTerm}%`);
    }

    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.limit(100);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error searching properties:', error);
    return [];
  }
};

/**
 * Get property details with all related data
 */
export const getPropertyDetails = async (propertyId) => {
  try {
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propError) throw propError;

    // Fetch related distressed assets
    const { data: assets, error: assetsError } = await supabase
      .from('distressed_assets')
      .select('*')
      .eq('property_id', propertyId);

    if (assetsError) throw assetsError;

    // Fetch entitlements
    const { data: entitlements, error: entError } = await supabase
      .from('entitlements')
      .select('*')
      .eq('property_id', propertyId);

    if (entError) throw entError;

    return {
      property,
      distressedAssets: assets || [],
      entitlements: entitlements || []
    };
  } catch (error) {
    console.error('Error fetching property details:', error);
    return null;
  }
};

/**
 * Save property to user's pipeline
 */
export const savePropertyToPipeline = async (userId, propertyId, stage = 'lead') => {
  try {
    const { data, error } = await supabase
      .from('saved_properties')
      .insert({
        user_id: userId,
        property_id: propertyId,
        stage,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error saving property:', error);
    throw error;
  }
};

/**
 * Create new deal
 */
export const createDeal = async (dealData) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .insert(dealData)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
};

/**
 * Update deal stage
 */
export const updateDealStage = async (dealId, stage) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .update({
        stage,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating deal stage:', error);
    throw error;
  }
};

/**
 * Get state-specific opportunities
 */
export const getStateOpportunities = async (stateAbbr) => {
  const stateInfo = stateRules[stateAbbr];
  if (!stateInfo) return null;

  try {
    const { data, error } = await supabase
      .from('distressed_assets')
      .select(`
        *,
        properties!inner (*)
      `)
      .eq('properties.state', stateAbbr)
      .eq('status', 'active')
      .order('sale_date', { ascending: true })
      .limit(20);

    if (error) throw error;

    return {
      stateRules: stateInfo,
      opportunities: data || []
    };
  } catch (error) {
    console.error('Error fetching state opportunities:', error);
    return {
      stateRules: stateInfo,
      opportunities: []
    };
  }
};

/**
 * Calculate deal metrics
 */
export const calculateDealMetrics = (property, distressedAsset) => {
  const purchasePrice = distressedAsset.total_due || distressedAsset.minimum_bid || 0;
  const estimatedValue = distressedAsset.estimated_value || property.market_value || 0;
  const profit = estimatedValue - purchasePrice;
  const roi = calculateROI(profit, purchasePrice);
  const opportunityScore = calculateOpportunityScore(property, distressedAsset);
  const riskScore = calculateRiskScore(distressedAsset);

  return {
    purchasePrice,
    estimatedValue,
    profit,
    roi: parseFloat(roi),
    opportunityScore,
    riskScore,
    netScore: opportunityScore - riskScore
  };
};

/**
 * Get user statistics
 */
export const getUserStats = async (userId) => {
  try {
    // Get deals count by stage
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('stage')
      .eq('user_id', userId);

    if (dealsError) throw dealsError;

    // Get saved properties count
    const { count: savedCount, error: savedError } = await supabase
      .from('saved_properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (savedError) throw savedError;

    // Calculate totals
    const dealsByStage = (deals || []).reduce((acc, deal) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1;
      return acc;
    }, {});

    return {
      totalDeals: deals?.length || 0,
      dealsByStage,
      savedProperties: savedCount || 0,
      activeDeals: dealsByStage.due_diligence || 0,
      wonDeals: dealsByStage.won || 0
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalDeals: 0,
      dealsByStage: {},
      savedProperties: 0,
      activeDeals: 0,
      wonDeals: 0
    };
  }
};

/**
 * Get market analytics for a state
 */
export const getStateMarketAnalytics = async (stateAbbr) => {
  try {
    const { data, error } = await supabase
      .from('distressed_assets')
      .select(`
        *,
        properties!inner (*)
      `)
      .eq('properties.state', stateAbbr);

    if (error) throw error;

    const assets = data || [];

    // Calculate analytics
    const totalProperties = assets.length;
    const avgROI = assets.reduce((sum, a) => sum + (a.potential_roi || 0), 0) / totalProperties || 0;
    const avgBid = assets.reduce((sum, a) => sum + (a.minimum_bid || 0), 0) / totalProperties || 0;
    const avgValue = assets.reduce((sum, a) => sum + (a.estimated_value || 0), 0) / totalProperties || 0;

    // Count by type
    const byType = assets.reduce((acc, asset) => {
      acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalProperties,
      avgROI: avgROI.toFixed(2),
      avgBid: Math.round(avgBid),
      avgValue: Math.round(avgValue),
      byType,
      stateRules: stateRules[stateAbbr]
    };
  } catch (error) {
    console.error('Error fetching market analytics:', error);
    return null;
  }
};

/**
 * Get top opportunities across all states
 */
export const getTopOpportunities = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('distressed_assets')
      .select(`
        *,
        properties (*)
      `)
      .eq('status', 'active')
      .gte('opportunity_score', 70)
      .order('opportunity_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching top opportunities:', error);
    return [];
  }
};

/**
 * Real-time subscription to new properties
 */
export const subscribeToNewProperties = (callback) => {
  const subscription = supabase
    .channel('new-properties')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'properties'
      },
      callback
    )
    .subscribe();

  return subscription;
};

/**
 * Real-time subscription to deal updates
 */
export const subscribeToDeals = (userId, callback) => {
  const subscription = supabase
    .channel(`deals-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'deals',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return subscription;
};

export default {
  fetchProperties,
  fetchDistressedAssets,
  fetchUserDeals,
  fetchUpcomingAuctions,
  searchProperties,
  getPropertyDetails,
  savePropertyToPipeline,
  createDeal,
  updateDealStage,
  getStateOpportunities,
  calculateDealMetrics,
  getUserStats,
  getStateMarketAnalytics,
  getTopOpportunities,
  subscribeToNewProperties,
  subscribeToDeals
};

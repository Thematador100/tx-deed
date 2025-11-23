// =====================================================
// API SERVICES - Edge Function Integrations
// Real API calls to Supabase Edge Functions
// =====================================================

import { supabase } from '@/lib/customSupabaseClient';

const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL;

// =====================================================
// COUNTY SCRAPER
// =====================================================

export async function runCountyScraper(countyId) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${EDGE_FUNCTION_URL}/functions/v1/county-scraper`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ county_id: countyId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Scraper failed');
  }

  return await response.json();
}

// =====================================================
// SKIP TRACING
// =====================================================

export async function performSkipTrace(propertyId) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${EDGE_FUNCTION_URL}/functions/v1/skip-trace`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ property_id: propertyId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Skip trace failed');
  }

  return await response.json();
}

// =====================================================
// AI PROPERTY ANALYSIS
// =====================================================

export async function analyzeProperty(propertyId) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${EDGE_FUNCTION_URL}/functions/v1/ai-analysis`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ property_id: propertyId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI analysis failed');
  }

  return await response.json();
}

// =====================================================
// SMS OUTREACH (TELNYX)
// =====================================================

export async function sendSMS({ campaignId, propertyId, toPhone, message, mediaUrls }) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${EDGE_FUNCTION_URL}/functions/v1/send-sms`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      property_id: propertyId,
      to_phone: toPhone,
      message,
      media_urls: mediaUrls
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'SMS send failed');
  }

  return await response.json();
}

// =====================================================
// EMAIL OUTREACH (RESEND)
// =====================================================

export async function sendEmail({ campaignId, propertyId, toEmail, toName, subject, htmlContent, textContent, templateId, variables }) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${EDGE_FUNCTION_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      property_id: propertyId,
      to_email: toEmail,
      to_name: toName,
      subject,
      html_content: htmlContent,
      text_content: textContent,
      template_id: templateId,
      variables
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Email send failed');
  }

  return await response.json();
}

// =====================================================
// BUYER MATCHING
// =====================================================

export async function matchBuyers(propertyId, maxMatches = 20) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${EDGE_FUNCTION_URL}/functions/v1/buyer-match`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      property_id: propertyId,
      max_matches: maxMatches
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Buyer matching failed');
  }

  return await response.json();
}

// =====================================================
// PROPERTY QUERIES
// =====================================================

export async function getProperties(filters = {}) {
  let query = supabase
    .from('properties')
    .select('*')
    .order('opportunity_score', { ascending: false, nullsFirst: false });

  if (filters.county) {
    query = query.eq('county', filters.county);
  }

  if (filters.state) {
    query = query.eq('state', filters.state);
  }

  if (filters.minPrice) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.minScore) {
    query = query.gte('opportunity_score', filters.minScore);
  }

  if (filters.propertyType) {
    query = query.in('property_type', Array.isArray(filters.propertyType) ? filters.propertyType : [filters.propertyType]);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getPropertyById(id) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getUpcomingAuctions() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'Active')
    .gte('auction_date', new Date().toISOString().split('T')[0])
    .order('auction_date', { ascending: true })
    .limit(50);

  if (error) throw error;
  return data || [];
}

// =====================================================
// SCOUT AGENTS
// =====================================================

export async function getScoutAgents(userId) {
  const { data, error } = await supabase
    .from('scout_agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createScoutAgent(agentData) {
  const { data, error } = await supabase
    .from('scout_agents')
    .insert(agentData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

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

export async function deleteScoutAgent(agentId) {
  const { error } = await supabase
    .from('scout_agents')
    .delete()
    .eq('id', agentId);

  if (error) throw error;
  return true;
}

// =====================================================
// SAVED PROPERTIES / PIPELINE
// =====================================================

export async function saveProperty(userId, propertyId, pipelineStage = 'Researching') {
  const { data, error } = await supabase
    .from('saved_properties')
    .insert({
      user_id: userId,
      property_id: propertyId,
      pipeline_stage: pipelineStage
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePropertyStage(savedPropertyId, newStage) {
  const { data, error } = await supabase
    .from('saved_properties')
    .update({ pipeline_stage: newStage })
    .eq('id', savedPropertyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSavedProperties(userId) {
  const { data, error } = await supabase
    .from('saved_properties')
    .select('*, properties(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

// =====================================================
// MARKETPLACE
// =====================================================

export async function createMarketplaceListing(listingData) {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert(listingData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMarketplaceListings(filters = {}) {
  let query = supabase
    .from('marketplace_listings')
    .select('*, properties(*), seller:profiles!seller_id(*)')
    .eq('status', 'active')
    .eq('visibility', 'public');

  if (filters.maxPrice) {
    query = query.lte('asking_price', filters.maxPrice);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function createOffer(offerData) {
  const { data, error } = await supabase
    .from('offers')
    .insert(offerData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// COUNTIES
// =====================================================

export async function getCounties(filters = {}) {
  let query = supabase
    .from('us_counties')
    .select('*')
    .eq('enabled', true);

  if (filters.state) {
    query = query.eq('state_code', filters.state);
  }

  const { data, error } = await query.order('state_code').order('county_name');

  if (error) throw error;
  return data || [];
}

export async function getScraperConfig(countyId) {
  const { data, error } = await supabase
    .from('scraper_configs')
    .select('*, us_counties(*)')
    .eq('county_id', countyId)
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// ANALYTICS
// =====================================================

export async function getUserStats(userId) {
  // Get properties saved
  const { count: savedCount } = await supabase
    .from('saved_properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get properties acquired
  const { count: acquiredCount } = await supabase
    .from('saved_properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('pipeline_stage', 'Acquired');

  // Get active scout agents
  const { count: agentCount } = await supabase
    .from('scout_agents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  return {
    savedProperties: savedCount || 0,
    acquiredProperties: acquiredCount || 0,
    activeAgents: agentCount || 0
  };
}

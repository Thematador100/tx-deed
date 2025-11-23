// =====================================================
// AI BUYER MATCHING - Vector Embeddings
// Match properties to buyers using semantic similarity
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BuyerMatchRequest {
  property_id: string;
  max_matches?: number;
}

interface BuyerMatch {
  buyer_id: string;
  user_id: string;
  buyer_name: string;
  buyer_email: string;
  match_score: number;
  matching_criteria: string[];
  investment_strategy: string[];
  proof_of_funds_verified: boolean;
}

// =====================================================
// BUYER MATCHING ENGINE
// =====================================================

class BuyerMatcher {
  private openai: OpenAI;
  private supabase: any;

  constructor(openaiKey: string, supabase: any) {
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.supabase = supabase;
  }

  async matchBuyers(property: any, maxMatches: number = 20): Promise<BuyerMatch[]> {
    console.log(`🔍 Finding top ${maxMatches} buyers for property: ${property.address}`);

    // Generate property embedding
    const propertyEmbedding = await this.generatePropertyEmbedding(property);

    // Find similar buyer profiles using vector similarity
    const { data: buyerProfiles, error } = await this.supabase.rpc(
      'match_buyers_to_property',
      {
        property_embedding: JSON.stringify(propertyEmbedding),
        property_price: property.price || property.starting_bid,
        property_type: property.property_type,
        property_state: property.state,
        property_county: property.county,
        match_limit: maxMatches
      }
    );

    if (error) {
      console.error('Error matching buyers:', error);
      // Fall back to rule-based matching
      return await this.ruleBasedMatching(property, maxMatches);
    }

    // Fetch full buyer details
    const matches: BuyerMatch[] = [];

    for (const profile of buyerProfiles || []) {
      const { data: user } = await this.supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', profile.user_id)
        .single();

      if (user) {
        matches.push({
          buyer_id: profile.id,
          user_id: profile.user_id,
          buyer_name: user.full_name || 'Anonymous Buyer',
          buyer_email: user.email,
          match_score: profile.similarity_score || this.calculateMatchScore(property, profile),
          matching_criteria: this.getMatchingCriteria(property, profile),
          investment_strategy: profile.investment_strategy || [],
          proof_of_funds_verified: profile.proof_of_funds_verified || false
        });
      }
    }

    // Sort by match score descending
    matches.sort((a, b) => b.match_score - a.match_score);

    console.log(`✅ Found ${matches.length} matching buyers`);

    return matches.slice(0, maxMatches);
  }

  private async generatePropertyEmbedding(property: any): Promise<number[]> {
    // Create rich text description for embedding
    const description = this.createPropertyDescription(property);

    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: description,
    });

    return response.data[0].embedding;
  }

  private createPropertyDescription(property: any): string {
    return `
Property Type: ${property.property_type || 'Unknown'}
Location: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
County: ${property.county}
Price: $${property.price || property.starting_bid || 0}
Estimated Value: $${property.estimated_value || 0}
ROI: ${property.roi || 0}%
Bedrooms: ${property.bedrooms || 'N/A'}
Bathrooms: ${property.bathrooms || 'N/A'}
Square Feet: ${property.sqft || 'N/A'}
Year Built: ${property.year_built || 'N/A'}
Lot Size: ${property.lot_size || 'N/A'}
Neighborhood: Median Income $${property.median_income || 'N/A'}, School Rating ${property.school_rating || 'N/A'}/10
Deal Stage: ${property.deal_stage || 'Auction'}
Opportunity Score: ${property.opportunity_score || 0}/100
Investment Potential: ${property.roi > 50 ? 'High' : property.roi > 25 ? 'Medium' : 'Standard'} return potential
Best For: ${this.suggestStrategy(property)}
    `.trim();
  }

  private suggestStrategy(property: any): string {
    const strategies = [];

    if (property.roi > 50) strategies.push('fix-and-flip');
    if (property.property_type === 'Single Family' || property.property_type === 'Multi-Family') {
      strategies.push('buy-and-hold rental');
    }
    if (property.roi > 30 && property.price < 100000) strategies.push('wholesale');
    if (property.property_type === 'Land' || property.property_type === 'Lot') {
      strategies.push('land development');
    }

    return strategies.join(', ') || 'investment opportunity';
  }

  private calculateMatchScore(property: any, buyer: any): number {
    let score = 0;

    // Price match (30 points)
    const price = property.price || property.starting_bid || 0;
    if (price >= buyer.min_price && price <= buyer.max_price) {
      score += 30;
    } else if (price <= buyer.max_price * 1.1) {
      score += 20; // Within 10% of max
    }

    // Property type match (25 points)
    if (buyer.preferred_property_types?.includes(property.property_type)) {
      score += 25;
    }

    // Location match (20 points)
    if (buyer.preferred_states?.includes(property.state)) {
      score += 10;
    }
    if (buyer.preferred_counties?.includes(property.county)) {
      score += 10;
    }

    // ROI match (15 points)
    if (property.roi >= buyer.min_roi) {
      score += 15;
    }

    // Experience level (10 points)
    if (buyer.deals_completed >= 5 && property.roi < 30) {
      score += 10; // Experienced buyers get harder deals
    } else if (buyer.deals_completed < 5 && property.roi >= 50) {
      score += 10; // New buyers get easy wins
    }

    return Math.min(100, score);
  }

  private getMatchingCriteria(property: any, buyer: any): string[] {
    const criteria = [];

    const price = property.price || property.starting_bid || 0;
    if (price >= buyer.min_price && price <= buyer.max_price) {
      criteria.push('Price match');
    }

    if (buyer.preferred_property_types?.includes(property.property_type)) {
      criteria.push(`Seeks ${property.property_type}`);
    }

    if (buyer.preferred_states?.includes(property.state)) {
      criteria.push(`Active in ${property.state}`);
    }

    if (property.roi >= buyer.min_roi) {
      criteria.push(`Meets ROI target (${property.roi}% >= ${buyer.min_roi}%)`);
    }

    if (buyer.investment_strategy?.includes('fix_flip') && property.roi > 40) {
      criteria.push('Strong fix-and-flip candidate');
    }

    if (buyer.investment_strategy?.includes('buy_hold') && property.property_type === 'Single Family') {
      criteria.push('Good rental property');
    }

    return criteria;
  }

  private async ruleBasedMatching(property: any, maxMatches: number): Promise<BuyerMatch[]> {
    console.log('Using rule-based matching fallback');

    const price = property.price || property.starting_bid || 0;

    const { data: buyers, error } = await this.supabase
      .from('buyer_profiles')
      .select('*, profiles!inner(id, full_name, email)')
      .lte('min_price', price * 1.2) // Within 20% of their max
      .gte('max_price', price * 0.8) // Within 20% of their min
      .limit(maxMatches);

    if (error || !buyers) {
      return [];
    }

    return buyers.map((buyer: any) => ({
      buyer_id: buyer.id,
      user_id: buyer.user_id,
      buyer_name: buyer.profiles.full_name || 'Anonymous Buyer',
      buyer_email: buyer.profiles.email,
      match_score: this.calculateMatchScore(property, buyer),
      matching_criteria: this.getMatchingCriteria(property, buyer),
      investment_strategy: buyer.investment_strategy || [],
      proof_of_funds_verified: buyer.proof_of_funds_verified || false
    }));
  }
}

// =====================================================
// EDGE FUNCTION HANDLER
// =====================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { property_id, max_matches = 20 }: BuyerMatchRequest = await req.json();

    if (!property_id) {
      throw new Error('property_id is required');
    }

    // Fetch property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      throw new Error('Property not found');
    }

    // Get OpenAI API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key_encrypted')
      .eq('service_name', 'OpenAI')
      .eq('is_global', true)
      .single();

    if (!apiKeyData) {
      throw new Error('OpenAI API key not configured');
    }

    // Run buyer matching
    const matcher = new BuyerMatcher(apiKeyData.api_key_encrypted, supabase);
    const matches = await matcher.matchBuyers(property, max_matches);

    return new Response(
      JSON.stringify({
        success: true,
        property: {
          id: property.id,
          address: property.address,
          price: property.price || property.starting_bid
        },
        total_matches: matches.length,
        top_matches: matches
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Buyer matching error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for the property in multiple tables
    const normalizedAddress = address.toUpperCase().trim();

    // Search in properties table
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*')
      .ilike('address', `%${normalizedAddress}%`)
      .limit(5);

    // Search in tax_delinquent_leads table
    const { data: taxDelinquent, error: taxError } = await supabase
      .from('tax_delinquent_leads')
      .select('*')
      .ilike('address', `%${normalizedAddress}%`)
      .limit(5);

    // Search in redeemable_deeds table
    const { data: redeemable, error: redeemError } = await supabase
      .from('redeemable_deeds')
      .select('*')
      .ilike('address', `%${normalizedAddress}%`)
      .limit(5);

    const allResults = [
      ...(properties || []).map(p => ({ ...p, source: 'properties' })),
      ...(taxDelinquent || []).map(p => ({ ...p, source: 'tax_delinquent' })),
      ...(redeemable || []).map(p => ({ ...p, source: 'redeemable' })),
    ];

    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({
          found: false,
          message: 'Property not found in our database',
          address,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the best match (exact or closest)
    const bestMatch = allResults[0];

    // Generate AI analysis (placeholder - could integrate with OpenAI/Anthropic)
    const aiAnalysis = generateAIAnalysis(bestMatch);

    return new Response(
      JSON.stringify({
        found: true,
        property: bestMatch,
        aiAnalysis,
        relatedProperties: allResults.slice(1, 4),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in property-lookup function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateAIAnalysis(property: any): string {
  // This is a placeholder - in production, this would call an AI API
  let analysis = `## Property Analysis\n\n`;

  if (property.source === 'tax_delinquent') {
    analysis += `This property is currently **tax delinquent** with an outstanding amount of $${property.delinquent_amount?.toLocaleString() || 'unknown'}.\n\n`;
    analysis += `**Opportunity:** This could be a good opportunity to contact the owner about a potential sale or to participate in the tax sale if it goes to auction.\n\n`;

    if (property.status === 'Final Notice') {
      analysis += `⚠️ **Status:** Final Notice - Act quickly as this property may be going to auction soon.\n\n`;
    }
  } else if (property.source === 'redeemable') {
    analysis += `This is a **redeemable deed** property, meaning it was recently sold at a tax sale.\n\n`;

    if (property.redemption_date) {
      const redemptionDate = new Date(property.redemption_date);
      const daysUntilRedemption = Math.ceil((redemptionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysUntilRedemption > 0) {
        analysis += `**Redemption Period:** ${daysUntilRedemption} days remaining. The original owner still has time to redeem the property.\n\n`;
      } else {
        analysis += `**Redemption Period:** Expired. The new owner likely has full rights to the property.\n\n`;
      }
    }

    if (property.sale_price && property.estimated_value) {
      const equity = property.estimated_value - property.sale_price;
      const roi = ((equity / property.sale_price) * 100).toFixed(2);
      analysis += `**Potential Equity:** $${equity.toLocaleString()} (${roi}% ROI if original owner redeems)\n\n`;
    }
  } else {
    analysis += `This property is listed in our auction database.\n\n`;

    if (property.starting_bid && property.estimated_value) {
      const potential = property.estimated_value - property.starting_bid;
      const roi = ((potential / property.starting_bid) * 100).toFixed(2);
      analysis += `**Investment Potential:** Starting bid is $${property.starting_bid.toLocaleString()} with an estimated value of $${property.estimated_value.toLocaleString()}. Potential profit: $${potential.toLocaleString()} (${roi}% ROI)\n\n`;
    }

    if (property.auction_date) {
      const auctionDate = new Date(property.auction_date);
      const daysUntilAuction = Math.ceil((auctionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysUntilAuction > 0) {
        analysis += `**Auction Date:** ${auctionDate.toLocaleDateString()} (in ${daysUntilAuction} days)\n\n`;
      }
    }
  }

  analysis += `**Location:** ${property.address}, ${property.city || property.county}, ${property.state}\n\n`;

  if (property.property_type) {
    analysis += `**Property Type:** ${property.property_type}\n\n`;
  }

  if (property.red_flags && property.red_flags.length > 0) {
    analysis += `⚠️ **Red Flags:**\n`;
    property.red_flags.forEach((flag: string) => {
      analysis += `- ${flag}\n`;
    });
    analysis += `\n`;
  }

  analysis += `**Recommendation:** ${getRecommendation(property)}`;

  return analysis;
}

function getRecommendation(property: any): string {
  if (property.source === 'tax_delinquent') {
    if (property.status === 'Final Notice') {
      return 'Act quickly to research this opportunity. Consider reaching out to the owner or preparing for the tax sale.';
    }
    return 'Good lead for direct-to-owner marketing. The owner may be motivated to sell.';
  } else if (property.source === 'redeemable') {
    const redemptionDate = new Date(property.redemption_date);
    const daysUntilRedemption = Math.ceil((redemptionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysUntilRedemption > 180) {
      return 'Still early in redemption period. Monitor this property and prepare to contact the certificate holder if not redeemed.';
    } else if (daysUntilRedemption > 0) {
      return 'Redemption period ending soon. Good time to contact the certificate holder about purchasing the certificate.';
    } else {
      return 'Redemption period expired. Research the current ownership status and consider reaching out about acquisition.';
    }
  } else {
    if (property.roi && property.roi > 50) {
      return 'Strong investment opportunity with high ROI potential. Conduct thorough due diligence.';
    }
    return 'Moderate opportunity. Research thoroughly before bidding.';
  }
}

// =====================================================
// AI PROPERTY ANALYSIS - Claude API Integration
// Real-time property analysis, deal scoring, risk assessment
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyAnalysisRequest {
  property_id: string;
  analysis_type?: 'full' | 'deal_score' | 'risk_assessment' | 'pricing';
}

interface DealAnalysis {
  opportunity_score: number;
  estimated_profit: number;
  roi: number;
  red_flags: string[];
  strengths: string[];
  recommended_bid: number;
  market_insights: string;
  risk_level: 'low' | 'medium' | 'high';
  investment_strategy: string[];
  exit_strategies: string[];
}

// =====================================================
// AI ANALYSIS ENGINE
// =====================================================

class PropertyAIAnalyzer {
  private client: Anthropic;
  private property: any;

  constructor(apiKey: string, property: any) {
    this.client = new Anthropic({ apiKey });
    this.property = property;
  }

  async analyzeProperty(): Promise<DealAnalysis> {
    const prompt = this.buildAnalysisPrompt();

    const message = await this.client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      temperature: 0.3, // Lower temperature for more consistent analysis
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    return this.parseAnalysisResponse(responseText);
  }

  private buildAnalysisPrompt(): string {
    return `You are an expert real estate investor and tax deed specialist. Analyze this property and provide a comprehensive investment analysis.

PROPERTY DETAILS:
- Address: ${this.property.address}, ${this.property.city}, ${this.property.state} ${this.property.zip_code}
- Parcel ID: ${this.property.parcel_id}
- Property Type: ${this.property.property_type}
- Bedrooms: ${this.property.bedrooms || 'N/A'}
- Bathrooms: ${this.property.bathrooms || 'N/A'}
- Sqft: ${this.property.sqft || 'N/A'}
- Lot Size: ${this.property.lot_size || 'N/A'}
- Year Built: ${this.property.year_built || 'N/A'}

FINANCIAL DATA:
- Starting Bid / Purchase Price: $${this.property.starting_bid || this.property.price || 'N/A'}
- Assessed Value: $${this.property.assessed_value || 'N/A'}
- Estimated Market Value: $${this.property.estimated_value || this.property.market_value || 'N/A'}
- Delinquent Amount: $${this.property.delinquent_amount || 'N/A'}
- Delinquent Years: ${this.property.delinquent_years || 'N/A'}

LOCATION DATA:
- Median Income: $${this.property.median_income || 'N/A'}
- School Rating: ${this.property.school_rating || 'N/A'}/10
- Population Density: ${this.property.population_density || 'N/A'}
- Flood Zone: ${this.property.flood_zone || 'Unknown'}

AUCTION INFO:
- Auction Date: ${this.property.auction_date || 'N/A'}
- Auction Type: ${this.property.auction_type || 'N/A'}
- Current Status: ${this.property.status}

Provide your analysis in the following JSON format:
{
  "opportunity_score": <0-100>,
  "estimated_profit": <number>,
  "roi": <percentage>,
  "recommended_bid": <number>,
  "risk_level": "low|medium|high",
  "red_flags": [<list of concerns>],
  "strengths": [<list of positives>],
  "market_insights": "<analysis of the local market>",
  "investment_strategy": [<suggested strategies like "fix-and-flip", "buy-and-hold", "wholesale">],
  "exit_strategies": [<recommended exit plans>],
  "key_risks": "<summary of main risks>",
  "due_diligence_checklist": [<critical items to verify before bidding>]
}

Focus on:
1. Deal quality and profit potential
2. Market conditions in ${this.property.city}, ${this.property.state}
3. Property condition based on available data
4. Neighborhood quality and appreciation potential
5. Tax deed specific risks (redemption, liens, title issues)
6. Optimal investment strategy for this property
7. Realistic profit scenarios

Be honest and data-driven. If this is a bad deal, say so.`;
  }

  private parseAnalysisResponse(response: string): DealAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        opportunity_score: Math.min(100, Math.max(0, parsed.opportunity_score || 50)),
        estimated_profit: parsed.estimated_profit || 0,
        roi: parsed.roi || 0,
        red_flags: parsed.red_flags || [],
        strengths: parsed.strengths || [],
        recommended_bid: parsed.recommended_bid || 0,
        market_insights: parsed.market_insights || '',
        risk_level: parsed.risk_level || 'medium',
        investment_strategy: parsed.investment_strategy || [],
        exit_strategies: parsed.exit_strategies || []
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback to basic calculation
      return this.calculateBasicScore();
    }
  }

  private calculateBasicScore(): DealAnalysis {
    const price = this.property.starting_bid || this.property.price || 0;
    const value = this.property.estimated_value || this.property.market_value || 0;
    const profit = value - price;
    const roi = price > 0 ? (profit / price) * 100 : 0;

    let opportunityScore = 50;
    if (roi >= 100) opportunityScore = 90;
    else if (roi >= 50) opportunityScore = 80;
    else if (roi >= 25) opportunityScore = 70;
    else if (roi >= 10) opportunityScore = 60;

    const redFlags: string[] = [];
    if (this.property.flood_zone && this.property.flood_zone !== 'X') {
      redFlags.push('Property in flood zone');
    }
    if (!this.property.bedrooms || this.property.bedrooms < 2) {
      redFlags.push('Limited bedrooms may affect marketability');
    }
    if (this.property.year_built && this.property.year_built < 1970) {
      redFlags.push('Older property may have deferred maintenance');
    }

    return {
      opportunity_score: opportunityScore,
      estimated_profit: profit,
      roi: roi,
      red_flags: redFlags,
      strengths: ['Good equity position', 'Tax deed opportunity'],
      recommended_bid: Math.round(value * 0.6), // 60% of market value
      market_insights: `Property in ${this.property.city}, ${this.property.state}`,
      risk_level: roi > 50 ? 'low' : roi > 25 ? 'medium' : 'high',
      investment_strategy: ['fix-and-flip', 'buy-and-hold'],
      exit_strategies: ['Retail sale', 'Rental property']
    };
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

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { property_id }: PropertyAnalysisRequest = await req.json();

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

    // Get Claude API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key_encrypted')
      .eq('service_name', 'Anthropic')
      .eq('is_global', true)
      .single();

    if (!apiKeyData) {
      throw new Error('Anthropic API key not configured');
    }

    console.log(`🤖 Analyzing property: ${property.address}`);

    // Run AI analysis
    const analyzer = new PropertyAIAnalyzer(apiKeyData.api_key_encrypted, property);
    const analysis = await analyzer.analyzeProperty();

    // Update property with analysis results
    await supabase
      .from('properties')
      .update({
        opportunity_score: analysis.opportunity_score,
        roi: analysis.roi,
        estimated_profit: analysis.estimated_profit,
        red_flags: analysis.red_flags,
        price: analysis.recommended_bid
      })
      .eq('id', property_id);

    console.log(`✅ Analysis complete: Score ${analysis.opportunity_score}/100, ROI ${analysis.roi}%`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        property_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('AI analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

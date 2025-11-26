import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DossierRequest {
  propertyId: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { propertyId, userId } = await req.json() as DossierRequest;

    if (!propertyId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Property ID and User ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch property details
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate comprehensive deal dossier with AI analysis
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    let aiAnalysis = null;

    if (openAIKey) {
      try {
        const prompt = `Analyze this tax deed property and provide a comprehensive deal dossier:

Property Details:
- Address: ${property.address}
- County: ${property.county}, ${property.state}
- Assessed Value: $${property.assessed_value}
- Tax Lien Amount: $${property.amount_owed}
- Auction Date: ${property.auction_date || 'TBD'}
- Property Type: ${property.property_type}
- Square Footage: ${property.sqft || 'N/A'}
- Lot Size: ${property.lot_size || 'N/A'}

Please provide:
1. Investment Potential Score (1-10)
2. Key Risks and Opportunities
3. Market Analysis for the area
4. Recommended Strategy (hold, flip, wholesale, etc.)
5. Estimated ROI
6. Timeline to profit
7. Key action items for due diligence`;

        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are an expert tax deed investment analyst.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (openAIResponse.ok) {
          const openAIData = await openAIResponse.json();
          aiAnalysis = openAIData.choices[0]?.message?.content || null;
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
        // Continue without AI analysis if it fails
      }
    }

    // Create deal dossier record
    const dossier = {
      property_id: propertyId,
      user_id: userId,
      property_data: property,
      ai_analysis: aiAnalysis,
      market_data: {
        comparable_properties: [],
        median_home_value: null,
        market_trend: 'stable'
      },
      risk_assessment: {
        title_issues: 'Unknown - requires title search',
        environmental_concerns: 'Unknown - requires inspection',
        legal_status: 'Unknown - requires legal review'
      },
      financial_projections: {
        estimated_roi: aiAnalysis ? 'See AI Analysis' : 'Calculate manually',
        holding_costs: property.amount_owed ? property.amount_owed * 0.1 : 0,
        renovation_estimate: null
      },
      action_items: [
        'Order title search',
        'Schedule property inspection',
        'Research local market comps',
        'Review county tax records',
        'Check zoning regulations',
        'Verify redemption period'
      ],
      created_at: new Date().toISOString()
    };

    // Save to database (if deal_dossiers table exists)
    const { data: savedDossier, error: saveError } = await supabaseClient
      .from('deal_dossiers')
      .insert(dossier)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving dossier:', saveError);
      // Return dossier even if save fails
      return new Response(
        JSON.stringify({ dossier, warning: 'Dossier generated but not saved to database' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ dossier: savedDossier || dossier }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating dossier:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

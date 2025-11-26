import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DealDossierRequest {
  property_id: string
  include_comps?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { property_id, include_comps = true } = await req.json() as DealDossierRequest

    if (!property_id) {
      throw new Error('property_id is required')
    }

    // Get property details
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propError || !property) {
      throw new Error('Property not found')
    }

    // Get OpenAI API key
    const { data: openAIKeyData } = await supabase
      .from('api_keys')
      .select('encrypted_api_key')
      .eq('service_name', 'openai')
      .single()

    const openAIApiKey = openAIKeyData?.encrypted_api_key

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Get Google Maps API key for location analysis
    const { data: mapsKeyData } = await supabase
      .from('api_keys')
      .select('encrypted_api_key')
      .eq('service_name', 'google_maps')
      .single()

    const googleMapsApiKey = mapsKeyData?.encrypted_api_key

    const dossier: any = {
      property_summary: {},
      title_analysis: {},
      risk_assessment: {},
      market_analysis: {},
      investment_scorecard: {},
      due_diligence_checklist: [],
      comparable_sales: [],
      neighborhood_insights: {},
      red_flags: [],
      green_flags: []
    }

    // Get property location insights
    if (googleMapsApiKey && property.latitude && property.longitude) {
      try {
        // Get nearby places and crime data
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${property.latitude},${property.longitude}&radius=1000&key=${googleMapsApiKey}`
        const placesResponse = await fetch(placesUrl)
        const placesData = await placesResponse.json()

        if (placesData.results) {
          const schools = placesData.results.filter((p: any) => p.types.includes('school'))
          const parks = placesData.results.filter((p: any) => p.types.includes('park'))
          const stores = placesData.results.filter((p: any) => p.types.includes('store') || p.types.includes('shopping_mall'))

          dossier.neighborhood_insights = {
            schools_nearby: schools.length,
            parks_nearby: parks.length,
            retail_nearby: stores.length,
            walkability_score: Math.min(100, (schools.length + parks.length + stores.length) * 5)
          }
        }
      } catch (geoError) {
        console.error('Geocoding error:', geoError)
      }
    }

    // Find comparable sales if requested
    if (include_comps) {
      const { data: comps, error: compsError } = await supabase
        .from('properties')
        .select('address, price, estimated_value, bedrooms, bathrooms, sqft, sale_date')
        .eq('city', property.city)
        .eq('property_type', property.property_type)
        .neq('id', property_id)
        .order('sale_date', { ascending: false })
        .limit(5)

      if (!compsError && comps) {
        dossier.comparable_sales = comps
      }
    }

    // Generate comprehensive AI analysis
    const dossierPrompt = `You are a real estate due diligence expert. Create a comprehensive Deal Dossier for this property:

PROPERTY DETAILS:
Address: ${property.address}
Type: ${property.property_type || 'Not specified'}
Purchase Price: $${property.price?.toLocaleString()}
Estimated ARV: $${property.estimated_value?.toLocaleString()}
Bedrooms: ${property.bedrooms || 'N/A'}
Bathrooms: ${property.bathrooms || 'N/A'}
Square Feet: ${property.sqft || 'N/A'}
Year Built: ${property.year_built || 'N/A'}
Lot Size: ${property.lot_size || 'N/A'}
Location: ${property.city}, ${property.state}, ${property.county} County
Opportunity Score: ${property.opportunity_score || 'Not rated'}

${dossier.comparable_sales.length > 0 ? `COMPARABLE SALES:
${dossier.comparable_sales.map((c: any, i: number) => `${i+1}. ${c.address} - $${c.price?.toLocaleString()}`).join('\n')}` : ''}

Provide a comprehensive analysis:

1. **Title & Liens Analysis**: Identify potential title issues, liens, encumbrances to investigate
2. **Risk Assessment**: Rate overall risk (low/medium/high) with specific concerns
3. **Market Analysis**: Assess the local market strength and property positioning
4. **Investment Scorecard**: Score out of 100 for: Deal Quality, Location, Profit Potential, Exit Strategy
5. **Due Diligence Checklist**: 8-10 critical items to verify before closing
6. **Red Flags**: 3-5 specific concerns to investigate
7. **Green Flags**: 3-5 positive indicators for this deal

Format as JSON:
{
  "title_analysis": {
    "concerns": ["string"],
    "recommended_actions": ["string"]
  },
  "risk_assessment": {
    "overall_risk": "low|medium|high",
    "risk_factors": [{"factor": "string", "severity": "low|medium|high"}],
    "mitigation_strategies": ["string"]
  },
  "market_analysis": {
    "market_strength": "weak|moderate|strong",
    "days_on_market_estimate": number,
    "demand_level": "low|medium|high",
    "analysis": "string"
  },
  "investment_scorecard": {
    "deal_quality": number,
    "location_score": number,
    "profit_potential": number,
    "exit_strategy": number,
    "overall_score": number
  },
  "due_diligence_checklist": [
    {"item": "string", "priority": "high|medium|low", "status": "pending"}
  ],
  "red_flags": [
    {"flag": "string", "severity": "high|medium|low"}
  ],
  "green_flags": [
    {"flag": "string", "impact": "high|medium|low"}
  ],
  "executive_summary": "string"
}`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert real estate due diligence analyst. Provide thorough, realistic, and actionable analysis.'
          },
          {
            role: 'user',
            content: dossierPrompt
          }
        ],
        temperature: 0.6,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      })
    })

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.statusText}`)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from AI')
    }

    const analysis = JSON.parse(content)

    // Merge AI analysis with dossier
    Object.assign(dossier, analysis)

    // Store the dossier
    const { error: storeError } = await supabase
      .from('deal_dossiers')
      .insert({
        property_id: property_id,
        dossier: dossier,
        created_at: new Date().toISOString()
      })

    if (storeError) {
      console.error('Failed to store deal dossier:', storeError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        property: {
          id: property.id,
          address: property.address,
          price: property.price
        },
        dossier: dossier,
        message: 'Deal dossier generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Deal dossier error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate deal dossier'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

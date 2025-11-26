import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DealRescueRequest {
  property_id: string
  days_on_market?: number
  initial_price?: number
  current_asking_price?: number
  view_count?: number
  inquiry_count?: number
  additional_context?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const requestData = await req.json() as DealRescueRequest

    const { property_id } = requestData

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

    // Calculate days on market if not provided
    const daysOnMarket = requestData.days_on_market ||
      Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24))

    // Build comprehensive analysis prompt
    const prompt = `You are a real estate wholesale deal rescue expert. Analyze this stalled property deal and provide actionable recommendations.

PROPERTY DETAILS:
- Address: ${property.address}
- Type: ${property.property_type || 'Not specified'}
- Listed Price: $${property.price?.toLocaleString()}
- Estimated Value: $${property.estimated_value?.toLocaleString()}
- ROI Potential: ${property.roi || 'Not calculated'}%
- Opportunity Score: ${property.opportunity_score || 'Not rated'}/100
- Days on Market: ${daysOnMarket}
- View Count: ${requestData.view_count || 0}
- Inquiry Count: ${requestData.inquiry_count || 0}
${requestData.additional_context ? `\nAdditional Context: ${requestData.additional_context}` : ''}

ANALYSIS REQUIRED:
1. Identify why this deal might be stalling (pricing, marketing, property issues, etc.)
2. Suggest 3 specific pricing strategies with exact price points
3. Identify a new buyer persona that might be interested
4. Create 3 objection-handling scripts for common concerns
5. Recommend 3 immediate action steps to revive the deal

Respond in JSON format:
{
  "diagnosis": {
    "primary_issue": "string",
    "contributing_factors": ["string"],
    "urgency_level": "low|medium|high|critical"
  },
  "pricing_strategies": [
    {
      "strategy": "string",
      "suggested_price": number,
      "reasoning": "string",
      "expected_outcome": "string"
    }
  ],
  "new_buyer_persona": {
    "description": "string",
    "why_theyll_be_interested": "string",
    "where_to_find_them": "string"
  },
  "objection_scripts": [
    {
      "objection": "string",
      "response": "string"
    }
  ],
  "action_steps": [
    {
      "step": "string",
      "priority": "high|medium|low",
      "estimated_time": "string"
    }
  ],
  "success_probability": number
}`

    // Call OpenAI for analysis
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
            content: 'You are an expert real estate wholesaler and deal rescuer. Provide detailed, actionable, and realistic advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    // Get alternative buyers using buyer-match
    let alternativeBuyers = []
    try {
      const buyerMatchResponse = await fetch(
        `${supabaseUrl}/functions/v1/buyer-match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            property_id: property_id,
            limit: 10
          })
        }
      )

      if (buyerMatchResponse.ok) {
        const buyerData = await buyerMatchResponse.json()
        alternativeBuyers = buyerData.buyers || []
      }
    } catch (buyerError) {
      console.error('Buyer match error:', buyerError)
    }

    // Store rescue analysis
    const { error: rescueError } = await supabase
      .from('deal_rescue_analyses')
      .insert({
        property_id: property_id,
        days_on_market: daysOnMarket,
        analysis: analysis,
        alternative_buyers_count: alternativeBuyers.length,
        created_at: new Date().toISOString()
      })

    if (rescueError) {
      console.error('Failed to store rescue analysis:', rescueError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        property: {
          id: property.id,
          address: property.address,
          price: property.price,
          days_on_market: daysOnMarket
        },
        analysis: analysis,
        alternative_buyers: alternativeBuyers.slice(0, 5),
        message: 'Deal rescue analysis complete'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Deal rescue error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to analyze deal'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PropertyInput {
  id?: string
  address: string
  city?: string
  state?: string
  price?: number
  estimated_value?: number
  original_price?: number
  days_on_market?: number
  views?: number
  inquiries?: number
  property_type?: string
  description?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { property } = await req.json() as { property: PropertyInput }

    if (!property) {
      throw new Error('Property details required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    const result: any = {
      property,
      analysis_date: new Date().toISOString(),
      diagnosis: {},
      rescue_strategies: [],
      new_buyer_profiles: [],
      revised_pricing: {},
      outreach_scripts: {}
    }

    // 1. DIAGNOSE THE PROBLEM
    const diagnosisPrompt = `Analyze why this property deal has stalled:

Property: ${property.address}, ${property.city}, ${property.state}
Current Price: $${property.price?.toLocaleString()}
${property.original_price ? `Original Price: $${property.original_price.toLocaleString()}` : ''}
${property.estimated_value ? `Estimated Value: $${property.estimated_value.toLocaleString()}` : ''}
Days on Market: ${property.days_on_market || 'Unknown'}
Views: ${property.views || 0}
Inquiries: ${property.inquiries || 0}

Provide a diagnosis with:
1. Primary issue (overpriced/poor marketing/wrong buyers/property issues/market timing)
2. Secondary factors (3-5 bullet points)
3. Urgency level (High/Medium/Low)
4. Estimated time to sell if we fix these issues

Format as JSON: {
  "primary_issue": "...",
  "secondary_factors": ["...", "..."],
  "urgency": "High|Medium|Low",
  "estimated_fix_time": "...",
  "diagnosis_summary": "..."
}`

    const diagnosisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert real estate deal analyzer. Provide honest, actionable diagnoses.'
          },
          {
            role: 'user',
            content: diagnosisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    })

    if (diagnosisResponse.ok) {
      const diagnosisData = await diagnosisResponse.json()
      const content = diagnosisData.choices[0]?.message?.content

      if (content) {
        try {
          result.diagnosis = JSON.parse(content)
        } catch {
          result.diagnosis = { diagnosis_summary: content }
        }
      }
    }

    // 2. REVISED PRICING STRATEGY
    const pricingPrompt = `Based on the stalled deal, recommend a new pricing strategy:

Property: ${property.address}
Current Price: $${property.price?.toLocaleString()}
Original Price: $${property.original_price?.toLocaleString() || 'Same'}
Estimated Value: $${property.estimated_value?.toLocaleString() || 'Unknown'}
Days on Market: ${property.days_on_market || 'Unknown'}
Issue: ${result.diagnosis.primary_issue || 'Stalled'}

Provide:
1. New suggested price (be aggressive to move the deal)
2. Pricing rationale (why this price will work)
3. Alternative pricing tactics (auction, lease option, etc.)
4. Price anchoring strategy

Format as JSON: {
  "new_price": number,
  "price_reduction_percent": number,
  "rationale": "...",
  "alternative_tactics": ["...", "..."],
  "anchoring_strategy": "..."
}`

    const pricingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate pricing strategist focused on moving stalled deals.'
          },
          {
            role: 'user',
            content: pricingPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    })

    if (pricingResponse.ok) {
      const pricingData = await pricingResponse.json()
      const content = pricingData.choices[0]?.message?.content

      if (content) {
        try {
          result.revised_pricing = JSON.parse(content)
        } catch {
          result.revised_pricing = { rationale: content }
        }
      }
    }

    // 3. NEW BUYER TARGETING
    const buyerPrompt = `Identify new buyer profiles for this stalled deal:

Property: ${property.address}
Type: ${property.property_type || 'Single Family'}
Price: $${property.price?.toLocaleString()}

Create 3-5 new buyer personas who might be interested but weren't targeted before:
- Demographics
- Investment strategy
- Why they'd want this specific property
- How to reach them

Format as JSON: {
  "buyer_profiles": [
    {
      "profile_name": "...",
      "demographics": "...",
      "investment_strategy": "...",
      "appeal_factors": ["...", "..."],
      "reach_channels": ["...", "..."]
    }
  ]
}`

    const buyerResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate marketing expert who identifies untapped buyer segments.'
          },
          {
            role: 'user',
            content: buyerPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 600
      })
    })

    if (buyerResponse.ok) {
      const buyerData = await buyerResponse.json()
      const content = buyerData.choices[0]?.message?.content

      if (content) {
        try {
          const parsed = JSON.parse(content)
          result.new_buyer_profiles = parsed.buyer_profiles || []
        } catch {
          result.new_buyer_profiles = []
        }
      }
    }

    // 4. OBJECTION-HANDLING SCRIPTS
    const objectionPrompt = `Create objection-handling scripts for common buyer concerns about this property:

Property: ${property.address}
Price: $${property.price?.toLocaleString()}
${property.estimated_value ? `Value: $${property.estimated_value.toLocaleString()}` : ''}
Issue: ${result.diagnosis.primary_issue || 'Stalled deal'}

Create responses for these common objections:
1. "The price is too high"
2. "I'm concerned about [issue from diagnosis]"
3. "I need to think about it"
4. "I found a better deal"
5. "The numbers don't work"

Format as JSON: {
  "scripts": [
    {
      "objection": "...",
      "response": "...",
      "follow_up": "..."
    }
  ]
}`

    const objectionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a sales expert who handles objections effectively and closes deals.'
          },
          {
            role: 'user',
            content: objectionPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })

    if (objectionResponse.ok) {
      const objectionData = await objectionResponse.json()
      const content = objectionData.choices[0]?.message?.content

      if (content) {
        try {
          result.outreach_scripts = JSON.parse(content)
        } catch {
          result.outreach_scripts = { scripts: [] }
        }
      }
    }

    // 5. RESCUE STRATEGIES (combine everything)
    result.rescue_strategies = [
      {
        strategy: 'Aggressive Price Reduction',
        action: `Drop price to $${result.revised_pricing.new_price?.toLocaleString() || 'TBD'}`,
        priority: result.diagnosis.urgency === 'High' ? 1 : 2,
        estimated_impact: 'High',
        implementation: 'Immediate'
      },
      {
        strategy: 'New Buyer Targeting',
        action: `Reach out to ${result.new_buyer_profiles.length} new buyer segments`,
        priority: 2,
        estimated_impact: 'Medium',
        implementation: '1-2 days'
      },
      {
        strategy: 'Enhanced Marketing',
        action: 'Create new microsite and outreach campaign',
        priority: 3,
        estimated_impact: 'Medium',
        implementation: '2-3 days'
      },
      {
        strategy: 'Alternative Deal Structures',
        action: result.revised_pricing.alternative_tactics?.[0] || 'Consider creative financing',
        priority: 4,
        estimated_impact: 'Low-Medium',
        implementation: '3-5 days'
      }
    ].sort((a, b) => a.priority - b.priority)

    // Save rescue analysis to database
    await supabase.from('deal_rescues').insert({
      property_id: property.id,
      address: property.address,
      diagnosis: result.diagnosis,
      revised_pricing: result.revised_pricing,
      buyer_profiles: result.new_buyer_profiles,
      rescue_strategies: result.rescue_strategies,
      outreach_scripts: result.outreach_scripts,
      created_at: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        success: true,
        result
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
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DispoCopilotRequest {
  property_id: string
  action: 'price_recommendation' | 'generate_microsite' | 'create_outreach' | 'all'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { property_id, action = 'all' } = await req.json() as DispoCopilotRequest

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

    const results: any = {}

    // Price Recommendation
    if (action === 'price_recommendation' || action === 'all') {
      const pricePrompt = `You are a real estate wholesaling expert. Analyze this property and recommend an optimal wholesale price.

Property: ${property.address}
Type: ${property.property_type || 'Not specified'}
Current Price: $${property.price?.toLocaleString()}
Estimated ARV: $${property.estimated_value?.toLocaleString()}
Bedrooms: ${property.bedrooms || 'N/A'}
Bathrooms: ${property.bathrooms || 'N/A'}
Square Feet: ${property.sqft || 'N/A'}
Year Built: ${property.year_built || 'N/A'}
Location: ${property.city}, ${property.state}

Provide:
1. Recommended wholesale price (aggressive, moderate, conservative)
2. Assignment fee range
3. Reasoning for each price point
4. Expected buyer response

Format as JSON:
{
  "aggressive": {"price": number, "assignment_fee": number, "reasoning": "string"},
  "moderate": {"price": number, "assignment_fee": number, "reasoning": "string"},
  "conservative": {"price": number, "assignment_fee": number, "reasoning": "string"},
  "recommended_strategy": "string"
}`

      const priceResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a real estate wholesaling pricing expert.' },
            { role: 'user', content: pricePrompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        })
      })

      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        const content = priceData.choices[0]?.message?.content
        if (content) {
          results.price_recommendation = JSON.parse(content)
        }
      }
    }

    // Generate Microsite Content
    if (action === 'generate_microsite' || action === 'all') {
      const micrositePrompt = `Create compelling marketing copy for a deal microsite for this property:

Property: ${property.address}
Type: ${property.property_type}
Price: $${property.price?.toLocaleString()}
ARV: $${property.estimated_value?.toLocaleString()}
ROI: ${property.roi}%
Beds/Baths: ${property.bedrooms}/${property.bathrooms}
Sqft: ${property.sqft}
Year Built: ${property.year_built}

Create:
1. Attention-grabbing headline
2. 3-paragraph property description highlighting investment potential
3. 5 key selling points
4. Strong call-to-action
5. NDA gate message

Format as JSON:
{
  "headline": "string",
  "description": "string",
  "key_points": ["string"],
  "cta": "string",
  "nda_message": "string",
  "meta_description": "string"
}`

      const micrositeResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert real estate copywriter specializing in wholesale deal marketing.' },
            { role: 'user', content: micrositePrompt }
          ],
          temperature: 0.8,
          max_tokens: 1200,
          response_format: { type: 'json_object' }
        })
      })

      if (micrositeResponse.ok) {
        const micrositeData = await micrositeResponse.json()
        const content = micrositeData.choices[0]?.message?.content
        if (content) {
          results.microsite_content = JSON.parse(content)

          // Generate a unique slug for the microsite
          const slug = property.address
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

          results.microsite_content.slug = slug
          results.microsite_content.url = `https://deals.winwithdeeds.com/${slug}`
        }
      }
    }

    // Create Outreach Sequences
    if (action === 'create_outreach' || action === 'all') {
      const outreachPrompt = `Create compliant outreach sequences (email and SMS) for this wholesale deal:

Property: ${property.address}
Price: $${property.price?.toLocaleString()}
ARV: $${property.estimated_value?.toLocaleString()}
Type: ${property.property_type}

Create:
1. Initial email outreach (subject + body)
2. Follow-up email (3-5 days later)
3. SMS sequence (3 messages, compliant with 10DLC)
4. Include STOP instructions and quiet hours notice

Format as JSON:
{
  "email_sequence": [
    {"subject": "string", "body": "string", "timing": "string"}
  ],
  "sms_sequence": [
    {"message": "string", "timing": "string", "character_count": number}
  ],
  "compliance_notes": "string"
}`

      const outreachResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a compliance-focused real estate marketing expert. All messages must be 10DLC compliant.' },
            { role: 'user', content: outreachPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        })
      })

      if (outreachResponse.ok) {
        const outreachData = await outreachResponse.json()
        const content = outreachData.choices[0]?.message?.content
        if (content) {
          results.outreach_sequences = JSON.parse(content)
        }
      }
    }

    // Store the dispo copilot results
    const { error: storeError } = await supabase
      .from('dispo_copilot_results')
      .insert({
        property_id: property_id,
        action: action,
        results: results,
        created_at: new Date().toISOString()
      })

    if (storeError) {
      console.error('Failed to store dispo copilot results:', storeError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        property: {
          id: property.id,
          address: property.address,
          price: property.price
        },
        results: results,
        message: 'Dispo Copilot analysis complete'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Dispo copilot error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate dispo content'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

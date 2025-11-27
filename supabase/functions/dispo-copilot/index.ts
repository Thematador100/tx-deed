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
  county?: string
  price?: number
  estimated_value?: number
  bedrooms?: number
  bathrooms?: number
  sqft?: number
  property_type?: string
  description?: string
  image_url?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { property, action } = await req.json() as { property: PropertyInput, action: 'analyze' | 'generate_microsite' | 'generate_outreach' }

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
      generated_at: new Date().toISOString()
    }

    // 1. PRICE RECOMMENDATION
    if (action === 'analyze' || !action) {
      // Get comparable properties
      const { data: comps } = await supabase
        .from('properties')
        .select('*')
        .eq('city', property.city || '')
        .eq('property_type', property.property_type || 'Single Family')
        .neq('id', property.id || '')
        .not('price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)

      const avgPrice = comps && comps.length > 0
        ? comps.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / comps.length
        : property.price || 100000

      // AI-generated pricing strategy
      const pricingPrompt = `As a real estate pricing expert, analyze this property and provide a pricing recommendation:

Property: ${property.address}, ${property.city}, ${property.state}
Current Price: $${property.price?.toLocaleString() || 'Not set'}
Estimated Value: $${property.estimated_value?.toLocaleString() || 'Unknown'}
Type: ${property.property_type || 'Single Family'}
Beds/Baths: ${property.bedrooms || 'N/A'}/${property.bathrooms || 'N/A'}
Size: ${property.sqft ? property.sqft.toLocaleString() + ' sqft' : 'Unknown'}

Market comps average: $${avgPrice.toLocaleString()}

Provide a pricing recommendation with:
1. Suggested list price
2. Minimum acceptable price
3. Pricing strategy (2-3 sentences)
4. Expected timeline to sell

Format as JSON: {
  "suggested_price": number,
  "min_price": number,
  "max_price": number,
  "strategy": "...",
  "expected_timeline": "...",
  "market_position": "Competitive|Below Market|Above Market"
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
              content: 'You are an expert real estate pricing strategist. Provide data-driven pricing recommendations.'
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
            result.pricing_recommendation = JSON.parse(content)
          } catch {
            result.pricing_recommendation = { strategy: content }
          }
        }
      }
    }

    // 2. MICROSITE GENERATION
    if (action === 'generate_microsite' || !action) {
      const micrositePrompt = `Create compelling marketing copy for a real estate investment property microsite:

Property: ${property.address}, ${property.city}, ${property.state}
Price: $${property.price?.toLocaleString()}
${property.estimated_value ? `Estimated Value: $${property.estimated_value.toLocaleString()}` : ''}
Type: ${property.property_type || 'Single Family'}
Beds/Baths: ${property.bedrooms || 'N/A'}/${property.bathrooms || 'N/A'}
Size: ${property.sqft ? property.sqft.toLocaleString() + ' sqft' : 'Unknown'}

Generate:
1. Catchy headline (8-12 words)
2. Property tagline (5-8 words)
3. Hero description (2-3 sentences highlighting investment potential)
4. Key features list (5-7 bullet points)
5. Investment highlights (3-4 bullet points focused on ROI)
6. Call-to-action text (compelling, urgent)

Format as JSON: {
  "headline": "...",
  "tagline": "...",
  "hero_description": "...",
  "key_features": ["...", "..."],
  "investment_highlights": ["...", "..."],
  "cta_text": "..."
}`

      const micrositeResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: 'You are an expert copywriter specializing in real estate investment properties. Write compelling, benefit-focused copy.'
            },
            {
              role: 'user',
              content: micrositePrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 500
        })
      })

      if (micrositeResponse.ok) {
        const micrositeData = await micrositeResponse.json()
        const content = micrositeData.choices[0]?.message?.content

        if (content) {
          try {
            result.microsite = JSON.parse(content)

            // Generate a unique slug for the microsite
            const slug = `${property.address.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
            result.microsite.slug = slug
            result.microsite.url = `${supabaseUrl}/microsite/${slug}`

            // Save microsite to database
            await supabase.from('microsites').insert({
              property_id: property.id,
              slug,
              address: property.address,
              headline: result.microsite.headline,
              content: result.microsite,
              is_active: true
            })
          } catch (e) {
            console.error('Microsite parse error:', e)
          }
        }
      }
    }

    // 3. OUTREACH SEQUENCE GENERATION
    if (action === 'generate_outreach' || !action) {
      const outreachPrompt = `Create a compliant outreach sequence for selling this investment property:

Property: ${property.address}, ${property.city}, ${property.state}
Price: $${property.price?.toLocaleString()}
Type: ${property.property_type || 'Single Family'}

Generate a 5-touch outreach sequence:
1. Initial email (subject + body)
2. Follow-up email Day 3 (subject + body)
3. SMS message (160 chars max, compliant)
4. Follow-up email Day 7 (subject + body)
5. Final follow-up SMS (160 chars max)

Each email should:
- Be professional and benefit-focused
- Include property highlights
- Have a clear CTA
- Be CAN-SPAM compliant

SMS must:
- Include STOP opt-out
- Be under 160 characters
- Not be sent before 8 AM or after 9 PM local time

Format as JSON: {
  "sequence": [
    {
      "day": number,
      "channel": "email|sms",
      "subject": "..." (email only),
      "body": "...",
      "timing": "Morning|Afternoon|Evening"
    }
  ]
}`

      const outreachResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: 'You are an expert in compliant real estate marketing. Create effective, legal outreach sequences.'
            },
            {
              role: 'user',
              content: outreachPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      })

      if (outreachResponse.ok) {
        const outreachData = await outreachResponse.json()
        const content = outreachData.choices[0]?.message?.content

        if (content) {
          try {
            result.outreach_sequence = JSON.parse(content)
          } catch (e) {
            console.error('Outreach parse error:', e)
          }
        }
      }
    }

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
    console.error('Dispo copilot error:', error)
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

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PropertyInput {
  address: string
  parcel_id?: string
  owner?: string
  assessed_value?: number
  price?: number
  auction_date?: string
  county?: string
  city?: string
  state?: string
  zip?: string
  bedrooms?: number
  bathrooms?: number
  sqft?: number
  year_built?: number
  property_type?: string
}

interface PropertyAnalysis {
  address: string
  latitude?: number
  longitude?: number
  estimated_value?: number
  roi?: number
  risk_score?: number
  market_analysis?: string
  neighborhood_score?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { properties } = await req.json() as { properties: PropertyInput[] }

    if (!properties || !Array.isArray(properties)) {
      throw new Error('Invalid request: properties array required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Google Maps API key from database
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('encrypted_api_key')
      .eq('service_name', 'google_maps')
      .single()

    const googleMapsApiKey = apiKeyData?.encrypted_api_key

    // Get OpenAI API key for property analysis
    const { data: openAIKeyData } = await supabase
      .from('api_keys')
      .select('encrypted_api_key')
      .eq('service_name', 'openai')
      .single()

    const openAIApiKey = openAIKeyData?.encrypted_api_key

    const analyzedProperties = []
    const errors = []

    for (const property of properties) {
      try {
        const analysis: PropertyAnalysis = {
          address: property.address
        }

        // Geocode address using Google Maps API
        if (googleMapsApiKey && property.address) {
          try {
            const fullAddress = `${property.address}, ${property.city || ''}, ${property.state || 'FL'} ${property.zip || ''}`
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleMapsApiKey}`
            const geocodeResponse = await fetch(geocodeUrl)
            const geocodeData = await geocodeResponse.json()

            if (geocodeData.results && geocodeData.results.length > 0) {
              const location = geocodeData.results[0].geometry.location
              analysis.latitude = location.lat
              analysis.longitude = location.lng

              // Get place details for neighborhood analysis
              const placeId = geocodeData.results[0].place_id
              if (placeId) {
                const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleMapsApiKey}`
                const placeResponse = await fetch(placeDetailsUrl)
                const placeData = await placeResponse.json()

                if (placeData.result) {
                  // Calculate neighborhood score based on available data
                  const rating = placeData.result.rating || 0
                  analysis.neighborhood_score = Math.round(rating * 20) // Convert to 0-100 scale
                }
              }
            }
          } catch (geocodeError) {
            console.error('Geocoding error:', geocodeError)
          }
        }

        // Calculate ROI if we have price and value data
        if (property.price && property.assessed_value) {
          const potentialProfit = property.assessed_value - property.price
          analysis.roi = Math.round((potentialProfit / property.price) * 100)
        }

        // AI-powered property analysis using OpenAI
        if (openAIApiKey && property.address) {
          try {
            const prompt = `Analyze this property for investment potential:
Address: ${property.address}
${property.county ? `County: ${property.county}` : ''}
${property.price ? `Purchase Price: $${property.price}` : ''}
${property.assessed_value ? `Assessed Value: $${property.assessed_value}` : ''}
${property.bedrooms ? `Bedrooms: ${property.bedrooms}` : ''}
${property.bathrooms ? `Bathrooms: ${property.bathrooms}` : ''}
${property.sqft ? `Square Feet: ${property.sqft}` : ''}
${property.year_built ? `Year Built: ${property.year_built}` : ''}

Provide a brief market analysis (2-3 sentences) and a risk score from 0-100 (0 = lowest risk, 100 = highest risk).
Format: {"market_analysis": "...", "risk_score": number}`

            const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    content: 'You are a real estate investment analyst. Provide concise, data-driven analysis.'
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 200
              })
            })

            if (aiResponse.ok) {
              const aiData = await aiResponse.json()
              const content = aiData.choices[0]?.message?.content

              if (content) {
                try {
                  const aiAnalysis = JSON.parse(content)
                  analysis.market_analysis = aiAnalysis.market_analysis
                  analysis.risk_score = aiAnalysis.risk_score
                } catch {
                  // If parsing fails, use the raw content as market analysis
                  analysis.market_analysis = content
                }
              }
            }
          } catch (aiError) {
            console.error('AI analysis error:', aiError)
          }
        }

        // Store analyzed property in database
        const propertyRecord = {
          ...property,
          ...analysis,
          status: 'analyzed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Check if property already exists
        const { data: existingProperty } = await supabase
          .from('properties')
          .select('id')
          .eq('address', property.address)
          .maybeSingle()

        if (existingProperty) {
          // Update existing property
          const { data, error } = await supabase
            .from('properties')
            .update({
              ...propertyRecord,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProperty.id)
            .select()

          if (error) {
            errors.push({ address: property.address, error: error.message })
          } else {
            analyzedProperties.push(data[0])
          }
        } else {
          // Insert new property
          const { data, error } = await supabase
            .from('properties')
            .insert(propertyRecord)
            .select()

          if (error) {
            errors.push({ address: property.address, error: error.message })
          } else {
            analyzedProperties.push(data[0])
          }
        }
      } catch (propertyError) {
        console.error('Property analysis error:', propertyError)
        errors.push({ address: property.address, error: String(propertyError) })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analyzed: analyzedProperties.length,
        errors: errors.length > 0 ? errors : undefined,
        properties: analyzedProperties
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Analysis error:', error)
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

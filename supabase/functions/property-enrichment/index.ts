// Property Enrichment Agent - Auto-enriches property data
// Triggered when new property is inserted
// Deploy: supabase functions deploy property-enrichment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { propertyId } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch property
    const { data: property, error } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (error || !property) {
      throw new Error('Property not found')
    }

    console.log(`Enriching property: ${property.address}`)

    // Enrich data from multiple sources
    const enrichedData: any = {}

    // 1. Get demographics from Census API
    if (property.latitude && property.longitude) {
      try {
        const demographics = await getCensusDemographics(property.latitude, property.longitude)
        enrichedData.median_income = demographics.median_income
        enrichedData.population_density = demographics.population_density
      } catch (error) {
        console.error('Census API failed:', error)
      }
    }

    // 2. Get school ratings
    try {
      const schoolRating = await getSchoolRating(property.address, property.state)
      enrichedData.school_rating = schoolRating
    } catch (error) {
      console.error('School rating failed:', error)
    }

    // 3. Calculate opportunity score with AI
    try {
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      const score = await calculateOpportunityScore(property, enrichedData, openaiKey)
      enrichedData.opportunity_score = score.score
      enrichedData.red_flags = score.red_flags
    } catch (error) {
      console.error('Opportunity score failed:', error)
    }

    // 4. Get comparable sales
    try {
      const comps = await getComparableSales(property)
      enrichedData.comparable_sales = comps
      // Update estimated_value based on comps
      if (comps.length > 0) {
        const avgPrice = comps.reduce((sum: number, c: any) => sum + c.price, 0) / comps.length
        enrichedData.estimated_value = Math.round(avgPrice)
      }
    } catch (error) {
      console.error('Comps failed:', error)
    }

    // 5. Check environmental risks
    try {
      const risks = await checkEnvironmentalRisks(property.address, property.state)
      enrichedData.environmental_risks = risks
    } catch (error) {
      console.error('Environmental check failed:', error)
    }

    // Update property with enriched data
    const { error: updateError } = await supabaseClient
      .from('properties')
      .update({
        ...enrichedData,
        enriched_at: new Date().toISOString()
      })
      .eq('id', propertyId)

    if (updateError) {
      throw updateError
    }

    console.log(`✅ Property enriched: ${property.address}`)

    return new Response(
      JSON.stringify({
        success: true,
        propertyId,
        enrichedData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Get demographics from Census API
async function getCensusDemographics(lat: number, lng: number) {
  // Use Census Geocoding API
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`

  const response = await fetch(url)
  const data = await response.json()

  // Extract tract/block for detailed data
  const tract = data.result?.geographies?.['Census Tracts']?.[0]?.TRACT

  if (!tract) {
    return { median_income: null, population_density: null }
  }

  // Get detailed demographics (would need API key)
  // For now, return mock data
  return {
    median_income: 65000 + Math.random() * 50000,
    population_density: 1000 + Math.random() * 5000
  }
}

// Get school ratings (would use GreatSchools API)
async function getSchoolRating(address: string, state: string) {
  // Mock implementation
  // Real: Use GreatSchools API or similar
  return Math.floor(Math.random() * 5) + 5 // 5-10 rating
}

// Calculate opportunity score using AI
async function calculateOpportunityScore(property: any, enrichedData: any, apiKey: string) {
  const prompt = `
Analyze this tax deed property and calculate an opportunity score (0-100) and identify red flags.

Property Details:
- Address: ${property.address}
- Price: $${property.price}
- Estimated Value: $${property.estimated_value || 'Unknown'}
- Property Type: ${property.property_type}
- Year Built: ${property.year_built || 'Unknown'}
- Bedrooms: ${property.bedrooms || 'Unknown'}
- Bathrooms: ${property.bathrooms || 'Unknown'}
- Square Feet: ${property.sqft || 'Unknown'}
- Median Income: $${enrichedData.median_income || 'Unknown'}
- School Rating: ${enrichedData.school_rating || 'Unknown'}/10
- Auction Date: ${property.auction_date}

Calculate:
1. Opportunity Score (0-100): Higher = better investment
2. Red Flags: Any concerns or risks

Return JSON:
{
  "score": number,
  "reasoning": string,
  "red_flags": array of strings,
  "strengths": array of strings,
  "estimated_roi": number (percentage)
}
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a real estate investment analyst expert in tax deed properties.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    const analysis = JSON.parse(data.choices[0].message.content)

    return analysis
  } catch (error) {
    console.error('AI scoring failed:', error)
    return {
      score: 50,
      red_flags: [],
      reasoning: 'Auto-scoring unavailable'
    }
  }
}

// Get comparable sales (mock - would use real API)
async function getComparableSales(property: any) {
  // Would use Zillow, Redfin, or MLS APIs
  // Mock implementation
  return [
    { address: 'Near property 1', price: property.estimated_value * 0.95, date: '2024-09-15' },
    { address: 'Near property 2', price: property.estimated_value * 1.05, date: '2024-10-01' },
    { address: 'Near property 3', price: property.estimated_value * 0.98, date: '2024-10-20' }
  ]
}

// Check environmental risks
async function checkEnvironmentalRisks(address: string, state: string) {
  // Would use EPA APIs, flood maps, etc.
  // Mock implementation
  const risks = []

  if (Math.random() > 0.8) risks.push('Flood Zone')
  if (Math.random() > 0.9) risks.push('Superfund Site Nearby')
  if (Math.random() > 0.85) risks.push('High Radon Area')

  return risks
}

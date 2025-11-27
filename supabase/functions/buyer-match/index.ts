import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PropertyDetails {
  id: string
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
  latitude?: number
  longitude?: number
}

interface BuyerProfile {
  id: string
  name: string
  email?: string
  phone?: string
  preferred_counties?: string[]
  preferred_property_types?: string[]
  min_price?: number
  max_price?: number
  min_roi?: number
  avg_purchase_price?: number
  total_purchases?: number
  last_purchase_date?: string
  purchase_history?: any[]
}

interface BuyerMatch {
  buyer: BuyerProfile
  match_score: number
  reasons: string[]
  confidence: 'high' | 'medium' | 'low'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { property } = await req.json() as { property: PropertyDetails }

    if (!property) {
      throw new Error('Property details required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all buyer profiles with their purchase history
    const { data: buyers, error: buyersError } = await supabase
      .from('buyer_profiles')
      .select(`
        *,
        buyer_purchases (
          property_id,
          purchase_price,
          purchase_date,
          properties (address, city, county, state, property_type, bedrooms, bathrooms, sqft)
        )
      `)
      .eq('is_active', true)

    if (buyersError) {
      console.error('Error fetching buyers:', buyersError)
      // Continue with empty buyers array if table doesn't exist yet
    }

    const buyerProfiles: BuyerProfile[] = buyers || []

    // Calculate match scores for each buyer
    const matches: BuyerMatch[] = []

    for (const buyer of buyerProfiles) {
      const reasons: string[] = []
      let matchScore = 0

      // 1. Geographic match (25 points)
      if (property.county && buyer.preferred_counties?.includes(property.county)) {
        matchScore += 25
        reasons.push(`Active buyer in ${property.county} County`)
      } else if (property.state && buyer.preferred_counties?.some(c => c.includes(property.state))) {
        matchScore += 15
        reasons.push(`Buys in ${property.state}`)
      }

      // Check purchase history for geographic patterns
      const purchaseHistory = buyer.buyer_purchases || []
      const countySimilarity = purchaseHistory.filter((p: any) =>
        p.properties?.county === property.county
      ).length

      if (countySimilarity > 0) {
        matchScore += Math.min(countySimilarity * 5, 20)
        reasons.push(`Purchased ${countySimilarity} properties in this county`)
      }

      // 2. Property type match (20 points)
      if (property.property_type && buyer.preferred_property_types?.includes(property.property_type)) {
        matchScore += 20
        reasons.push(`Prefers ${property.property_type} properties`)
      }

      const propertyTypeSimilarity = purchaseHistory.filter((p: any) =>
        p.properties?.property_type === property.property_type
      ).length

      if (propertyTypeSimilarity > 0) {
        matchScore += Math.min(propertyTypeSimilarity * 3, 15)
        reasons.push(`Bought ${propertyTypeSimilarity} ${property.property_type} properties`)
      }

      // 3. Price range match (20 points)
      if (property.price) {
        if (buyer.min_price && buyer.max_price) {
          if (property.price >= buyer.min_price && property.price <= buyer.max_price) {
            matchScore += 20
            reasons.push(`Property price fits buyer's budget ($${buyer.min_price.toLocaleString()} - $${buyer.max_price.toLocaleString()})`)
          }
        }

        // Check if price is similar to buyer's average purchase price
        if (buyer.avg_purchase_price) {
          const priceDiff = Math.abs(property.price - buyer.avg_purchase_price) / buyer.avg_purchase_price
          if (priceDiff < 0.3) {
            matchScore += 15
            reasons.push(`Price aligns with buyer's typical purchases (~$${buyer.avg_purchase_price.toLocaleString()})`)
          }
        }
      }

      // 4. ROI potential match (15 points)
      if (property.price && property.estimated_value) {
        const roi = ((property.estimated_value - property.price) / property.price) * 100
        if (buyer.min_roi && roi >= buyer.min_roi) {
          matchScore += 15
          reasons.push(`ROI of ${roi.toFixed(1)}% exceeds buyer's minimum (${buyer.min_roi}%)`)
        } else if (roi > 50) {
          matchScore += 10
          reasons.push(`Strong ROI potential (${roi.toFixed(1)}%)`)
        }
      }

      // 5. Size similarity (10 points)
      if (property.sqft && purchaseHistory.length > 0) {
        const avgSqft = purchaseHistory.reduce((sum: number, p: any) =>
          sum + (p.properties?.sqft || 0), 0
        ) / purchaseHistory.length

        if (avgSqft > 0) {
          const sqftDiff = Math.abs(property.sqft - avgSqft) / avgSqft
          if (sqftDiff < 0.2) {
            matchScore += 10
            reasons.push(`Property size (${property.sqft} sqft) matches buyer's preferences`)
          }
        }
      }

      // 6. Recent activity bonus (10 points)
      if (buyer.last_purchase_date) {
        const daysSinceLastPurchase = (Date.now() - new Date(buyer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLastPurchase < 90) {
          matchScore += 10
          reasons.push(`Recently active (purchased ${Math.floor(daysSinceLastPurchase)} days ago)`)
        } else if (daysSinceLastPurchase < 180) {
          matchScore += 5
          reasons.push(`Active buyer (last purchase ${Math.floor(daysSinceLastPurchase)} days ago)`)
        }
      }

      // 7. Purchase volume bonus (10 points)
      if (buyer.total_purchases && buyer.total_purchases > 0) {
        const volumeScore = Math.min(buyer.total_purchases * 2, 10)
        matchScore += volumeScore
        reasons.push(`Experienced investor (${buyer.total_purchases} purchases)`)
      }

      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low'
      if (matchScore >= 70) {
        confidence = 'high'
      } else if (matchScore >= 40) {
        confidence = 'medium'
      } else {
        confidence = 'low'
      }

      // Only include buyers with at least some match
      if (matchScore > 0 || reasons.length > 0) {
        matches.push({
          buyer: {
            ...buyer,
            purchase_history: purchaseHistory
          },
          match_score: Math.min(matchScore, 100),
          reasons,
          confidence
        })
      }
    }

    // Sort by match score (highest first) and take top 20
    const topMatches = matches
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 20)

    // Get OpenAI API key for AI-enhanced matching insights
    const { data: openAIKeyData } = await supabase
      .from('api_keys')
      .select('encrypted_api_key')
      .eq('service_name', 'openai')
      .single()

    let aiInsights = null

    // Add AI insights for top 3 matches if OpenAI is configured
    if (openAIKeyData?.encrypted_api_key && topMatches.length > 0) {
      try {
        const topBuyers = topMatches.slice(0, 3).map(m => ({
          name: m.buyer.name,
          match_score: m.match_score,
          reasons: m.reasons,
          purchase_count: m.buyer.total_purchases
        }))

        const prompt = `Property: ${property.address}, ${property.city}, ${property.state}
Price: $${property.price?.toLocaleString()}
Type: ${property.property_type}

Top 3 buyer matches:
${topBuyers.map((b, i) => `${i + 1}. ${b.name} (Score: ${b.match_score}/100, ${b.purchase_count} purchases)\nReasons: ${b.reasons.join(', ')}`).join('\n\n')}

Provide a brief (2-3 sentences) strategic insight on how to approach these buyers and maximize the sale potential.`

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIKeyData.encrypted_api_key}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a real estate sales strategist. Provide actionable advice on selling properties to investors.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 150
          })
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          aiInsights = aiData.choices[0]?.message?.content
        }
      } catch (aiError) {
        console.error('AI insights error:', aiError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        property: property,
        matches: topMatches,
        total_buyers_analyzed: buyerProfiles.length,
        ai_insights: aiInsights
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Buyer match error:', error)
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

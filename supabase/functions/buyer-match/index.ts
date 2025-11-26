import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BuyerMatchRequest {
  property_id?: string
  address?: string
  city?: string
  state?: string
  county?: string
  property_type?: string
  price?: number
  limit?: number
}

interface Buyer {
  id: string
  name: string
  email?: string
  phone?: string
  purchase_count: number
  avg_purchase_price: number
  preferred_property_types: string[]
  active_counties: string[]
  match_score: number
  match_reasons: string[]
  last_purchase_date?: string
  total_invested: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const {
      property_id,
      address,
      city,
      state,
      county,
      property_type,
      price,
      limit = 20
    } = await req.json() as BuyerMatchRequest

    // Get property details if property_id provided
    let propertyData: any = {
      address,
      city,
      state,
      county,
      property_type,
      price
    }

    if (property_id) {
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', property_id)
        .single()

      if (property) {
        propertyData = property
      }
    }

    // Get OpenAI API key for intelligent matching
    const { data: openAIKeyData } = await supabase
      .from('api_keys')
      .select('encrypted_api_key')
      .eq('service_name', 'openai')
      .single()

    const openAIApiKey = openAIKeyData?.encrypted_api_key

    // Query transactions to find active buyers in the area
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select(`
        *,
        user:profiles!transactions_user_id_fkey(
          id,
          email,
          full_name,
          phone
        ),
        property:properties(
          id,
          address,
          city,
          state,
          county,
          property_type,
          price
        )
      `)
      .eq('status', 'completed')
      .eq('product_type', 'lead_purchase')
      .order('created_at', { ascending: false })
      .limit(500)

    if (txError) {
      console.error('Transaction query error:', txError)
    }

    // Aggregate buyer statistics
    const buyerStats = new Map<string, any>()

    if (transactions) {
      for (const tx of transactions) {
        if (!tx.user || !tx.property) continue

        const userId = tx.user.id
        if (!buyerStats.has(userId)) {
          buyerStats.set(userId, {
            id: userId,
            name: tx.user.full_name || tx.user.email,
            email: tx.user.email,
            phone: tx.user.phone,
            purchase_count: 0,
            total_invested: 0,
            property_types: new Set<string>(),
            counties: new Set<string>(),
            states: new Set<string>(),
            prices: [] as number[],
            last_purchase_date: tx.created_at,
          })
        }

        const buyer = buyerStats.get(userId)
        buyer.purchase_count++
        buyer.total_invested += Number(tx.amount || 0)

        if (tx.property.property_type) {
          buyer.property_types.add(tx.property.property_type)
        }
        if (tx.property.county) {
          buyer.counties.add(tx.property.county)
        }
        if (tx.property.state) {
          buyer.states.add(tx.property.state)
        }
        if (tx.property.price) {
          buyer.prices.push(Number(tx.property.price))
        }

        if (new Date(tx.created_at) > new Date(buyer.last_purchase_date)) {
          buyer.last_purchase_date = tx.created_at
        }
      }
    }

    // Calculate match scores
    const rankedBuyers: Buyer[] = []

    for (const [_, stats] of buyerStats) {
      let matchScore = 0
      const matchReasons: string[] = []

      const avgPrice = stats.prices.length > 0
        ? stats.prices.reduce((a: number, b: number) => a + b, 0) / stats.prices.length
        : 0

      // Geographic match (40 points max)
      if (propertyData.county && stats.counties.has(propertyData.county)) {
        matchScore += 25
        matchReasons.push(`Active in ${propertyData.county} County`)
      } else if (propertyData.state && stats.states.has(propertyData.state)) {
        matchScore += 15
        matchReasons.push(`Invests in ${propertyData.state}`)
      }

      // Property type match (25 points max)
      if (propertyData.property_type && stats.property_types.has(propertyData.property_type)) {
        matchScore += 25
        matchReasons.push(`Buys ${propertyData.property_type} properties`)
      }

      // Price range match (20 points max)
      if (propertyData.price && avgPrice > 0) {
        const priceDiff = Math.abs(propertyData.price - avgPrice) / avgPrice
        if (priceDiff < 0.2) {
          matchScore += 20
          matchReasons.push(`Target price range ($${Math.round(avgPrice).toLocaleString()})`)
        } else if (priceDiff < 0.5) {
          matchScore += 10
          matchReasons.push(`Similar price range`)
        }
      }

      // Activity level (15 points max)
      if (stats.purchase_count >= 10) {
        matchScore += 15
        matchReasons.push(`Highly active buyer (${stats.purchase_count} purchases)`)
      } else if (stats.purchase_count >= 5) {
        matchScore += 10
        matchReasons.push(`Active buyer (${stats.purchase_count} purchases)`)
      } else if (stats.purchase_count >= 2) {
        matchScore += 5
        matchReasons.push(`${stats.purchase_count} purchases`)
      }

      // Recency bonus (10 points max)
      const daysSinceLastPurchase = (Date.now() - new Date(stats.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastPurchase < 30) {
        matchScore += 10
        matchReasons.push('Recently active (last 30 days)')
      } else if (daysSinceLastPurchase < 90) {
        matchScore += 5
        matchReasons.push('Active in last 90 days')
      }

      // Only include buyers with meaningful match scores
      if (matchScore >= 20) {
        rankedBuyers.push({
          id: stats.id,
          name: stats.name,
          email: stats.email,
          phone: stats.phone,
          purchase_count: stats.purchase_count,
          avg_purchase_price: Math.round(avgPrice),
          preferred_property_types: Array.from(stats.property_types),
          active_counties: Array.from(stats.counties),
          match_score: Math.round(matchScore),
          match_reasons: matchReasons,
          last_purchase_date: stats.last_purchase_date,
          total_invested: Math.round(stats.total_invested),
        })
      }
    }

    // Sort by match score
    rankedBuyers.sort((a, b) => b.match_score - a.match_score)

    // Use AI to enhance match reasoning for top buyers
    const topBuyers = rankedBuyers.slice(0, limit)

    if (openAIApiKey && topBuyers.length > 0) {
      try {
        const prompt = `You are a real estate matchmaker. Analyze why these buyers are good matches for this property:

Property: ${propertyData.address || 'Address not provided'}
Type: ${propertyData.property_type || 'Not specified'}
Price: $${propertyData.price?.toLocaleString() || 'Not specified'}
Location: ${propertyData.city || ''}, ${propertyData.state || ''} ${propertyData.county ? `(${propertyData.county} County)` : ''}

Top 5 Buyers:
${topBuyers.slice(0, 5).map((b, i) => `${i + 1}. ${b.name} - ${b.purchase_count} purchases, avg $${b.avg_purchase_price.toLocaleString()}`).join('\n')}

Provide a brief (1-2 sentence) compelling pitch for why each of the top 5 buyers should be contacted. Format as JSON array: [{"buyer_index": 0, "pitch": "..."}]`

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
                content: 'You are a real estate wholesaling expert. Create compelling, personalized buyer pitches.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.8,
            max_tokens: 500
          })
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const content = aiData.choices[0]?.message?.content

          if (content) {
            try {
              const pitches = JSON.parse(content)
              pitches.forEach((p: any) => {
                if (topBuyers[p.buyer_index]) {
                  topBuyers[p.buyer_index].ai_pitch = p.pitch
                }
              })
            } catch (parseError) {
              console.error('AI pitch parsing error:', parseError)
            }
          }
        }
      } catch (aiError) {
        console.error('AI enhancement error:', aiError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        property: propertyData,
        total_buyers: topBuyers.length,
        buyers: topBuyers,
        message: topBuyers.length > 0
          ? `Found ${topBuyers.length} potential buyers for this property`
          : 'No strong buyer matches found. Try expanding your search or building your buyer network.'
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
        error: error.message || 'Failed to match buyers'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

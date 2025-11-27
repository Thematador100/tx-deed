import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DossierRequest {
  address: string
  city?: string
  state?: string
  county?: string
  parcel_id?: string
}

interface TitleRecord {
  date: string
  type: string
  grantor?: string
  grantee?: string
  amount?: number
  document_number?: string
}

interface LienRecord {
  type: string
  amount: number
  filed_date: string
  creditor?: string
  status: 'active' | 'satisfied' | 'released'
}

interface CourtRecord {
  case_number: string
  case_type: string
  filed_date: string
  status: string
  parties?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address, city, state, county, parcel_id } = await req.json() as DossierRequest

    if (!address) {
      throw new Error('Property address is required')
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

    // Initialize result object
    const dossier = {
      address,
      city,
      state,
      county,
      parcel_id,
      analysis_date: new Date().toISOString(),
      title_records: [] as TitleRecord[],
      liens: [] as LienRecord[],
      court_records: [] as CourtRecord[],
      red_flags: [] as string[],
      overall_score: 0,
      title_status: 'Unknown',
      recommendation: '',
      detailed_analysis: ''
    }

    // 1. Check existing property records in our database
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('*')
      .eq('address', address)
      .maybeSingle()

    if (existingProperty) {
      // Use existing data
      if (existingProperty.red_flags) {
        dossier.red_flags = existingProperty.red_flags
      }
    }

    // 2. Search for title records (simulated - in production would call county records API)
    // In a real implementation, this would call county clerk APIs or services like:
    // - PropStream
    // - DataTree
    // - County recorder APIs
    const titleRecords: TitleRecord[] = []

    // For demonstration, we'll check if there's historical data
    const { data: transactions } = await supabase
      .from('property_transactions')
      .select('*')
      .eq('address', address)
      .order('transaction_date', { ascending: false })
      .limit(10)

    if (transactions && transactions.length > 0) {
      titleRecords.push(...transactions.map((t: any) => ({
        date: t.transaction_date,
        type: t.transaction_type || 'Sale',
        grantor: t.seller_name,
        grantee: t.buyer_name,
        amount: t.sale_price,
        document_number: t.document_number
      })))
    }

    dossier.title_records = titleRecords

    // 3. Search for liens (would call county tax assessor/clerk in production)
    const liens: LienRecord[] = []

    // Check for tax delinquency
    const { data: taxDelinquent } = await supabase
      .from('tax_delinquent_leads')
      .select('*')
      .eq('address', address)
      .maybeSingle()

    if (taxDelinquent && taxDelinquent.delinquent_amount) {
      liens.push({
        type: 'Tax Lien',
        amount: taxDelinquent.delinquent_amount,
        filed_date: taxDelinquent.created_at,
        creditor: `${county || state || ''} Tax Collector`,
        status: 'active'
      })
      dossier.red_flags.push(`Property has unpaid taxes: $${taxDelinquent.delinquent_amount.toLocaleString()}`)
    }

    // Check lien_records table if it exists
    const { data: lienRecords } = await supabase
      .from('lien_records')
      .select('*')
      .eq('address', address)
      .order('filed_date', { ascending: false })

    if (lienRecords && lienRecords.length > 0) {
      liens.push(...lienRecords.map((l: any) => ({
        type: l.lien_type || 'General Lien',
        amount: l.amount || 0,
        filed_date: l.filed_date,
        creditor: l.creditor_name,
        status: l.status || 'active'
      })))

      const activeLiens = lienRecords.filter((l: any) => l.status === 'active')
      if (activeLiens.length > 0) {
        dossier.red_flags.push(`${activeLiens.length} active lien(s) found`)
      }
    }

    dossier.liens = liens

    // 4. Search court records (would call county court API in production)
    const courtRecords: CourtRecord[] = []

    const { data: courtCases } = await supabase
      .from('court_records')
      .select('*')
      .eq('property_address', address)
      .order('filed_date', { ascending: false })
      .limit(10)

    if (courtCases && courtCases.length > 0) {
      courtRecords.push(...courtCases.map((c: any) => ({
        case_number: c.case_number,
        case_type: c.case_type,
        filed_date: c.filed_date,
        status: c.status,
        parties: c.parties
      })))

      const activeCases = courtCases.filter((c: any) => c.status === 'Active' || c.status === 'Pending')
      if (activeCases.length > 0) {
        dossier.red_flags.push(`${activeCases.length} active court case(s) found`)
      }
    }

    dossier.court_records = courtRecords

    // 5. Environmental and zoning checks
    if (existingProperty) {
      if (existingProperty.environmental_risks && existingProperty.environmental_risks.length > 0) {
        existingProperty.environmental_risks.forEach((risk: string) => {
          dossier.red_flags.push(`Environmental concern: ${risk}`)
        })
      }
    }

    // 6. Calculate overall score (0-100)
    let score = 100

    // Deductions
    score -= liens.length * 10 // -10 per lien
    score -= courtRecords.filter(c => c.status === 'Active').length * 15 // -15 per active case
    score -= dossier.red_flags.length * 5 // -5 per red flag

    // Ensure score doesn't go below 0
    score = Math.max(0, score)
    dossier.overall_score = score

    // 7. Determine title status
    if (liens.filter(l => l.status === 'active').length === 0 && courtRecords.length === 0) {
      dossier.title_status = 'Clear'
    } else if (liens.filter(l => l.status === 'active').length > 0 && liens.filter(l => l.status === 'active').length < 3) {
      dossier.title_status = 'Encumbered'
    } else {
      dossier.title_status = 'Clouded'
    }

    // 8. Use AI to generate comprehensive analysis and recommendation
    if (openAIApiKey) {
      try {
        const prompt = `Analyze this property due diligence report and provide a comprehensive investment recommendation:

Property: ${address}, ${city}, ${state} ${county ? `(${county} County)` : ''}

Title Records: ${titleRecords.length} records found
- Most recent: ${titleRecords[0] ? titleRecords[0].date : 'N/A'}

Liens: ${liens.length} total (${liens.filter(l => l.status === 'active').length} active)
${liens.slice(0, 3).map(l => `- ${l.type}: $${l.amount.toLocaleString()} (${l.status})`).join('\n')}

Court Records: ${courtRecords.length} cases
${courtRecords.slice(0, 3).map(c => `- ${c.case_type}: ${c.status}`).join('\n')}

Red Flags: ${dossier.red_flags.length}
${dossier.red_flags.slice(0, 5).map(f => `- ${f}`).join('\n')}

Title Status: ${dossier.title_status}
Overall Score: ${score}/100

Provide:
1. A brief overall recommendation (2-3 sentences)
2. Key action items for the investor (3-5 bullet points)
3. Risk level assessment (Low/Medium/High)

Format as JSON: {"recommendation": "...", "action_items": ["...", "..."], "risk_level": "Low|Medium|High", "detailed_analysis": "..."}`

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
                content: 'You are an expert real estate due diligence analyst and attorney. Provide thorough, legally-informed analysis.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const content = aiData.choices[0]?.message?.content

          if (content) {
            try {
              const aiAnalysis = JSON.parse(content)
              dossier.recommendation = aiAnalysis.recommendation
              dossier.detailed_analysis = aiAnalysis.detailed_analysis || aiAnalysis.recommendation

              // Add AI insights to the result
              Object.assign(dossier, {
                action_items: aiAnalysis.action_items || [],
                risk_level: aiAnalysis.risk_level || 'Medium'
              })
            } catch {
              // If parsing fails, use raw content
              dossier.recommendation = content
              dossier.detailed_analysis = content
            }
          }
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError)
      }
    }

    // Default recommendation if AI didn't provide one
    if (!dossier.recommendation) {
      if (score >= 80) {
        dossier.recommendation = 'This property appears to be a solid investment opportunity with clear title and minimal issues. Proceed with standard due diligence.'
      } else if (score >= 50) {
        dossier.recommendation = 'This property has some concerns that should be addressed. Consult with a title attorney before proceeding.'
      } else {
        dossier.recommendation = 'This property has significant issues. Exercise extreme caution and seek professional legal advice before investing.'
      }
    }

    // 9. Save dossier to database for future reference
    const { error: saveError } = await supabase
      .from('deal_dossiers')
      .insert({
        address,
        city,
        state,
        county,
        parcel_id,
        title_status: dossier.title_status,
        overall_score: dossier.overall_score,
        liens_count: liens.length,
        court_records_count: courtRecords.length,
        red_flags: dossier.red_flags,
        recommendation: dossier.recommendation,
        dossier_data: dossier,
        created_at: new Date().toISOString()
      })

    if (saveError) {
      console.error('Error saving dossier:', saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        dossier
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
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

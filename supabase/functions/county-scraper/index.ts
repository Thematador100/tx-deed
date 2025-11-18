// County Tax Sale Scraper - Auto-updates upcoming_sales table
// Runs daily at 3:00 AM via cron
// Deploy: supabase functions deploy county-scraper

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// County websites to scrape (example list - expand to 3,000+)
const COUNTIES_TO_SCRAPE = [
  {
    state: 'California',
    county: 'Los Angeles County',
    url: 'https://ttc.lacounty.gov/schedule-of-upcoming-auctions/',
    type: 'structured' // has table/json
  },
  {
    state: 'Florida',
    county: 'Miami-Dade County',
    url: 'https://www.miamidade.gov/pa/tax_deed.asp',
    type: 'structured'
  },
  {
    state: 'Texas',
    county: 'Harris County',
    url: 'https://hctax.net',
    type: 'unstructured' // needs AI parsing
  },
  // ... add 2,997 more counties
]

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    const results = {
      success: [],
      failed: [],
      total: COUNTIES_TO_SCRAPE.length
    }

    // Scrape each county
    for (const county of COUNTIES_TO_SCRAPE) {
      try {
        console.log(`Scraping ${county.county}, ${county.state}...`)

        // Fetch county website
        const response = await fetch(county.url, {
          headers: {
            'User-Agent': 'WinWithDeeds-Bot/1.0 (Tax Sale Aggregator)'
          }
        })

        const html = await response.text()

        let saleData

        if (county.type === 'structured') {
          // Parse structured data (tables, JSON)
          saleData = parseStructuredHTML(html, county)
        } else {
          // Use AI to extract from unstructured content
          saleData = await extractWithAI(html, county, openaiKey)
        }

        if (saleData) {
          // Upsert to database
          const { error } = await supabaseClient
            .from('upcoming_sales')
            .upsert({
              state: county.state,
              county: county.county,
              sale_date: saleData.sale_date,
              properties_count: saleData.properties_count,
              sale_type: saleData.sale_type || 'Tax Deed',
              registration_deadline: saleData.registration_deadline,
              deposit_required: saleData.deposit_required,
              sale_location: saleData.sale_location,
              sale_time: saleData.sale_time,
              contact_phone: saleData.contact_phone,
              website_url: county.url,
              notes: saleData.notes,
              redemption_period: saleData.redemption_period,
              minimum_bid_type: saleData.minimum_bid_type,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'state,county,sale_date' // Update if exists
            })

          if (error) {
            console.error(`Error upserting ${county.county}:`, error)
            results.failed.push({ county: county.county, error: error.message })
          } else {
            results.success.push(county.county)
          }
        } else {
          results.failed.push({ county: county.county, error: 'No data extracted' })
        }

        // Rate limit - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error scraping ${county.county}:`, error)
        results.failed.push({ county: county.county, error: error.message })
      }
    }

    // Log results
    console.log(`Scraping complete: ${results.success.length}/${results.total} successful`)

    // Send alert if too many failures
    if (results.failed.length > results.total * 0.1) {
      await sendAlert(supabaseClient, {
        title: '⚠️ High Scraper Failure Rate',
        message: `${results.failed.length} of ${results.total} counties failed to scrape`,
        details: results.failed
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        results
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

// Parse structured HTML (tables, lists)
function parseStructuredHTML(html: string, county: any) {
  // Example: Extract from HTML table
  const dateMatch = html.match(/sale[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i)
  const propertiesMatch = html.match(/(\d+)\s+properties/i)

  if (dateMatch && propertiesMatch) {
    return {
      sale_date: convertToISODate(dateMatch[1]),
      properties_count: parseInt(propertiesMatch[1]),
      sale_type: 'Tax Deed',
      // ... extract more fields
    }
  }

  return null
}

// Use OpenAI to extract data from unstructured content
async function extractWithAI(html: string, county: any, apiKey: string) {
  const prompt = `
Extract tax sale information from this county website HTML:

County: ${county.county}, ${county.state}
HTML: ${html.substring(0, 5000)} // First 5000 chars

Extract and return JSON:
{
  "sale_date": "YYYY-MM-DD",
  "properties_count": number,
  "sale_type": "Tax Deed" or "Tax Lien Certificate",
  "registration_deadline": "YYYY-MM-DD" or null,
  "deposit_required": string or null,
  "sale_location": string,
  "sale_time": string,
  "contact_phone": string or null,
  "notes": string,
  "redemption_period": string or null,
  "minimum_bid_type": string or null
}

If no sale found, return null.
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cheaper model for extraction
        messages: [
          { role: 'system', content: 'You are a data extraction expert. Extract structured data from HTML.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    const extracted = JSON.parse(data.choices[0].message.content)

    return extracted
  } catch (error) {
    console.error('AI extraction failed:', error)
    return null
  }
}

// Convert MM/DD/YYYY to YYYY-MM-DD
function convertToISODate(dateStr: string) {
  const [month, day, year] = dateStr.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Send alert to admin
async function sendAlert(supabase: any, alert: any) {
  await supabase.from('admin_alerts').insert({
    title: alert.title,
    message: alert.message,
    details: alert.details,
    severity: 'warning',
    created_at: new Date().toISOString()
  })
}

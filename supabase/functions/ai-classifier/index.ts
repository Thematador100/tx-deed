// AI Classification Engine - Determines where data should go
// Used when admin uploads files or pastes data
// Deploy: supabase functions deploy ai-classifier

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
    const { data, dataType, filename } = await req.json()

    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    // Analyze data with AI
    const classification = await classifyData(data, dataType, filename, openaiKey)

    return new Response(
      JSON.stringify({
        success: true,
        classification
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

async function classifyData(data: any, dataType: string, filename: string, apiKey: string) {
  // Prepare data sample for AI
  let sample = ''

  if (dataType === 'csv' || dataType === 'excel') {
    // Take first few rows
    sample = Array.isArray(data) ? JSON.stringify(data.slice(0, 5)) : data.substring(0, 2000)
  } else if (dataType === 'text') {
    sample = data.substring(0, 2000)
  } else if (dataType === 'pdf') {
    sample = data.text?.substring(0, 2000) || ''
  }

  const prompt = `
You are a data classification expert for a tax deed investment platform. Analyze this data and determine:
1. What type of data is this?
2. Where should it be stored in the database?
3. What fields can be extracted?

Data Type: ${dataType}
Filename: ${filename || 'unknown'}
Sample Data:
${sample}

Possible classifications:
- "upcoming_sales" - Tax sale auction announcements
- "properties" - Property listings with details
- "tax_delinquent_leads" - Properties with delinquent taxes
- "marketplace_leads" - Leads for peer-to-peer trading
- "buyer_database" - Information about buyers/investors
- "library_content" - Educational content/resources
- "unknown" - Cannot determine

Return JSON:
{
  "classification": string (one of above),
  "confidence": number (0-1),
  "table_name": string (database table),
  "extracted_fields": object (key-value pairs of detected fields),
  "record_count": number (how many records detected),
  "suggested_action": string (what admin should do),
  "warnings": array of strings (any issues detected)
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
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert data classifier for real estate investment platforms.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      })
    })

    const result = await response.json()
    const classification = JSON.parse(result.choices[0].message.content)

    // Add additional metadata
    classification.filename = filename
    classification.dataType = dataType
    classification.timestamp = new Date().toISOString()

    return classification
  } catch (error) {
    console.error('Classification failed:', error)
    return {
      classification: 'unknown',
      confidence: 0,
      error: error.message,
      suggested_action: 'Manual review required'
    }
  }
}

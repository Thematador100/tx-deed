import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileContent, fileName, fileType, userId } = await req.json() as {
      fileContent: string
      fileName: string
      fileType: string
      userId: string
    }

    if (!fileContent || !fileName) {
      throw new Error('File content and name required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get OpenAI API key for intelligent parsing
    const { data: openAIKeyData } = await supabase
      .from('api_keys')
      .select('encrypted_api_key')
      .eq('service_name', 'openai')
      .single()

    const openAIApiKey = openAIKeyData?.encrypted_api_key

    let properties: any[] = []

    // Parse based on file type
    if (fileType === 'csv' || fileName.endsWith('.csv')) {
      properties = await parseCSV(fileContent, openAIApiKey)
    } else if (fileType === 'pdf' || fileName.endsWith('.pdf')) {
      properties = await parsePDF(fileContent, openAIApiKey)
    } else if (fileType === 'xlsx' || fileType === 'xls' || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      properties = await parseExcel(fileContent, openAIApiKey)
    } else {
      throw new Error('Unsupported file type. Please upload CSV, PDF, XLS, or XLSX files.')
    }

    // Enrich properties with additional data
    const enrichedProperties = await enrichProperties(properties, supabase, openAIApiKey)

    // Insert properties into database
    const insertResults = []
    for (const property of enrichedProperties) {
      const { data, error } = await supabase
        .from('properties')
        .upsert({
          ...property,
          listing_type: 'uploaded',
          deal_stage: 'Lead',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'address',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error('Insert error:', error)
      } else if (data) {
        insertResults.push(data[0])
      }
    }

    // Update upload record
    await supabase.from('lead_uploads').insert({
      user_id: userId,
      file_name: fileName,
      file_format: fileType,
      status: 'completed',
      leads_found: insertResults.length,
      created_at: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        success: true,
        properties_found: properties.length,
        properties_saved: insertResults.length,
        properties: insertResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Upload processing error:', error)
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

async function parseCSV(content: string, openAIApiKey?: string): Promise<any[]> {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV file must have header and data rows')
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const properties: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const property: any = {}

    // Map common column names to our schema
    headers.forEach((header, index) => {
      const value = values[index]
      if (!value) return

      // Address variations
      if (header.includes('address') || header === 'street' || header === 'location') {
        property.address = value
      }
      // City
      else if (header.includes('city')) {
        property.city = value
      }
      // State
      else if (header.includes('state') || header === 'st') {
        property.state = value
      }
      // County
      else if (header.includes('county')) {
        property.county = value
      }
      // Zip
      else if (header.includes('zip') || header === 'postal') {
        property.zip_code = value
      }
      // Price
      else if (header.includes('price') || header.includes('amount') || header === 'bid') {
        property.price = parseFloat(value.replace(/[$,]/g, ''))
      }
      // Value
      else if (header.includes('value') || header.includes('apprais')) {
        property.estimated_value = parseFloat(value.replace(/[$,]/g, ''))
      }
      // Parcel
      else if (header.includes('parcel') || header.includes('apn') || header.includes('tax id')) {
        property.parcel_id = value
      }
      // Owner
      else if (header.includes('owner') || header.includes('seller')) {
        property.owner = value
      }
      // Date
      else if (header.includes('date') || header.includes('auction')) {
        property.auction_date = value
      }
      // Property type
      else if (header.includes('type') || header.includes('category')) {
        property.property_type = value
      }
      // Bedrooms
      else if (header.includes('bed') || header === 'br') {
        property.bedrooms = parseInt(value)
      }
      // Bathrooms
      else if (header.includes('bath') || header === 'ba') {
        property.bathrooms = parseFloat(value)
      }
      // Square feet
      else if (header.includes('sqft') || header.includes('sq ft') || header.includes('area')) {
        property.sqft = parseInt(value.replace(/,/g, ''))
      }
    })

    if (property.address) {
      properties.push(property)
    }
  }

  // Use AI to clean and standardize if available
  if (openAIApiKey && properties.length > 0) {
    const sample = properties.slice(0, 5)
    const prompt = `Clean and standardize these property records. Fix addresses, ensure consistent formatting:
${JSON.stringify(sample, null, 2)}

Return cleaned JSON array with same structure.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 1000
        })
      })

      if (response.ok) {
        const data = await response.json()
        const cleaned = JSON.parse(data.choices[0]?.message?.content || '[]')
        // Apply cleaning patterns to all properties
        // For now, just return original
      }
    } catch (e) {
      console.error('AI cleaning failed:', e)
    }
  }

  return properties
}

async function parsePDF(base64Content: string, openAIApiKey?: string): Promise<any[]> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key required for PDF parsing')
  }

  // Decode base64 PDF
  const pdfContent = atob(base64Content)

  // Use OpenAI to extract structured data from PDF text
  const prompt = `Extract property information from this PDF content. Find all properties with their:
- Address
- City, State, Zip
- County
- Price/Amount
- Assessed Value
- Parcel Number
- Owner Name
- Auction Date
- Property Type

PDF Content (partial):
${pdfContent.substring(0, 5000)}

Return a JSON array of properties with these fields.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    throw new Error('Failed to parse PDF with AI')
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || '[]'

  try {
    let jsonStr = content
    if (content.includes('```')) {
      jsonStr = content.split('```')[1]
      if (jsonStr.startsWith('json')) jsonStr = jsonStr.substring(4)
    }
    return JSON.parse(jsonStr)
  } catch {
    return []
  }
}

async function parseExcel(content: string, openAIApiKey?: string): Promise<any[]> {
  // Excel parsing would require a library like xlsx
  // For now, treat similar to CSV
  return parseCSV(content, openAIApiKey)
}

async function enrichProperties(properties: any[], supabase: any, openAIApiKey?: string): Promise<any[]> {
  const enriched = []

  for (const property of properties) {
    // Calculate ROI if we have price and value
    if (property.price && property.estimated_value) {
      property.roi = Math.round(((property.estimated_value - property.price) / property.price) * 100)
    }

    // Calculate opportunity score (0-100)
    let score = 50 // Base score
    if (property.roi) {
      if (property.roi > 100) score += 30
      else if (property.roi > 50) score += 20
      else if (property.roi > 25) score += 10
    }
    if (property.price && property.price < 100000) score += 10
    if (property.property_type === 'Single Family') score += 10

    property.opportunity_score = Math.min(100, score)

    // Set status
    property.status = property.auction_date ? 'Upcoming Auction' : 'Available'

    enriched.push(property)
  }

  return enriched
}

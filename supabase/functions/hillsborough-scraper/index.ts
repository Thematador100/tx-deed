import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PropertyData {
  address: string
  parcel_id?: string
  owner?: string
  assessed_value?: number
  opening_bid?: number
  auction_date?: string
  case_number?: string
  latitude?: number
  longitude?: number
  county: string
  status: string
  source_url?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Google Maps API key from database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('encrypted_api_key')
      .eq('service_name', 'google_maps')
      .single()

    if (apiKeyError) {
      console.error('Error fetching Google Maps API key:', apiKeyError)
    }

    const googleMapsApiKey = apiKeyData?.encrypted_api_key

    // Hillsborough County Tax Deed URLs
    const HILLSBOROUGH_BASE_URL = 'http://www.hillsclerk.com'
    const TAX_DEED_SEARCH_URL = `${HILLSBOROUGH_BASE_URL}/online-services/tax-deed-sales`

    console.log('Starting Hillsborough County tax deed scraper...')

    // Fetch the tax deed sales page
    const response = await fetch(TAX_DEED_SEARCH_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    if (!doc) {
      throw new Error('Failed to parse HTML')
    }

    const properties: PropertyData[] = []

    // Parse property listings
    // Note: This is a generic scraper structure - you'll need to adjust selectors based on actual website structure
    const propertyRows = doc.querySelectorAll('table tr, .property-listing, .auction-item')

    for (const row of propertyRows) {
      try {
        // Extract property data from row
        // Adjust these selectors based on actual website structure
        const addressElement = row.querySelector('.address, td:nth-child(1), .property-address')
        const parcelElement = row.querySelector('.parcel, td:nth-child(2), .parcel-id')
        const bidElement = row.querySelector('.bid, td:nth-child(3), .opening-bid')
        const dateElement = row.querySelector('.date, td:nth-child(4), .auction-date')

        if (!addressElement) continue

        const address = addressElement.textContent?.trim()
        if (!address || address.length < 5) continue

        const property: PropertyData = {
          address: address,
          parcel_id: parcelElement?.textContent?.trim(),
          opening_bid: parseFloat(bidElement?.textContent?.replace(/[^0-9.]/g, '') || '0'),
          auction_date: dateElement?.textContent?.trim(),
          county: 'Hillsborough',
          status: 'upcoming',
          source_url: TAX_DEED_SEARCH_URL
        }

        // Geocode address using Google Maps API if available
        if (googleMapsApiKey && address) {
          try {
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', Tampa, FL')}&key=${googleMapsApiKey}`
            const geocodeResponse = await fetch(geocodeUrl)
            const geocodeData = await geocodeResponse.json()

            if (geocodeData.results && geocodeData.results.length > 0) {
              const location = geocodeData.results[0].geometry.location
              property.latitude = location.lat
              property.longitude = location.lng
            }
          } catch (geocodeError) {
            console.error('Geocoding error:', geocodeError)
          }
        }

        properties.push(property)
      } catch (rowError) {
        console.error('Error parsing row:', rowError)
        continue
      }
    }

    console.log(`Found ${properties.length} properties`)

    // Store properties in database
    const insertedProperties = []
    const errors = []

    for (const property of properties) {
      try {
        // Check if property already exists
        const { data: existingProperty } = await supabase
          .from('properties')
          .select('id')
          .eq('address', property.address)
          .eq('county', 'Hillsborough')
          .maybeSingle()

        if (existingProperty) {
          // Update existing property
          const { data, error } = await supabase
            .from('properties')
            .update({
              ...property,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProperty.id)
            .select()

          if (error) {
            console.error('Update error:', error)
            errors.push({ property: property.address, error: error.message })
          } else {
            insertedProperties.push(data[0])
          }
        } else {
          // Insert new property
          const { data, error } = await supabase
            .from('properties')
            .insert({
              ...property,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()

          if (error) {
            console.error('Insert error:', error)
            errors.push({ property: property.address, error: error.message })
          } else {
            insertedProperties.push(data[0])
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
        errors.push({ property: property.address, error: String(dbError) })
      }
    }

    // Update scout agent status
    await supabase
      .from('scout_agents')
      .upsert({
        name: 'Hillsborough County Scraper',
        last_run_at: new Date().toISOString(),
        status: 'completed',
        properties_found: properties.length,
        properties_inserted: insertedProperties.length
      })

    return new Response(
      JSON.stringify({
        success: true,
        properties_found: properties.length,
        properties_inserted: insertedProperties.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully scraped ${properties.length} properties from Hillsborough County`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Scraper error:', error)
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

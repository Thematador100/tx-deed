// Deno Deploy Edge Function for processing uploaded property lead files
// Supports CSV, Excel (XLS, XLSX), and PDF formats

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessLeadUploadRequest {
  uploadId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { uploadId }: ProcessLeadUploadRequest = await req.json();

    if (!uploadId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: uploadId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch upload record
    const { data: upload, error: uploadError } = await supabaseClient
      .from('lead_uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single();

    if (uploadError || !upload) {
      return new Response(
        JSON.stringify({ error: 'Upload not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabaseClient
      .from('lead_uploads')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', uploadId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('lead-uploads')
      .download(upload.storage_path);

    if (downloadError || !fileData) {
      await supabaseClient
        .from('lead_uploads')
        .update({
          status: 'error',
          error_message: 'Failed to download file from storage',
        })
        .eq('id', uploadId);

      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse file based on format
    let properties = [];
    try {
      if (upload.file_format === 'csv') {
        properties = await parseCSV(fileData);
      } else if (upload.file_format === 'xlsx' || upload.file_format === 'xls') {
        properties = await parseExcel(fileData);
      } else if (upload.file_format === 'pdf') {
        // PDF parsing would require OCR - for now, return error or implement OCR
        throw new Error('PDF parsing requires OCR configuration. Please use CSV or Excel format.');
      }
    } catch (parseError) {
      await supabaseClient
        .from('lead_uploads')
        .update({
          status: 'error',
          error_message: `Parse error: ${parseError.message}`,
        })
        .eq('id', uploadId);

      return new Response(
        JSON.stringify({ error: `Failed to parse file: ${parseError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize and validate properties
    const normalizedProperties = properties.map(prop => normalizeProperty(prop, user.id));

    // Insert properties into database
    const { data: insertedProperties, error: insertError } = await supabaseClient
      .from('properties')
      .insert(normalizedProperties)
      .select();

    if (insertError) {
      await supabaseClient
        .from('lead_uploads')
        .update({
          status: 'error',
          error_message: `Database error: ${insertError.message}`,
        })
        .eq('id', uploadId);

      return new Response(
        JSON.stringify({ error: `Failed to insert properties: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update upload record as completed
    await supabaseClient
      .from('lead_uploads')
      .update({
        status: 'completed',
        leads_found: properties.length,
        properties_imported: insertedProperties?.length || 0,
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', uploadId);

    return new Response(
      JSON.stringify({
        success: true,
        uploadId,
        leadsFound: properties.length,
        propertiesImported: insertedProperties?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-lead-upload:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Parse CSV file
async function parseCSV(fileData: Blob): Promise<any[]> {
  const text = await fileData.text();
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

  // Parse rows
  const properties = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const property: any = {};
    headers.forEach((header, index) => {
      if (index < values.length) {
        property[header] = values[index];
      }
    });

    properties.push(property);
  }

  return properties;
}

// Parse a single CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

// Parse Excel file
async function parseExcel(fileData: Blob): Promise<any[]> {
  const arrayBuffer = await fileData.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Get first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

  if (!jsonData || jsonData.length === 0) {
    throw new Error('Excel file is empty or has no data');
  }

  return jsonData;
}

// Normalize property data to match database schema
function normalizeProperty(rawProperty: any, userId: string): any {
  // Common field mappings from various data sources
  const fieldMappings: Record<string, string[]> = {
    address: ['address', 'property_address', 'street_address', 'site_address', 'Address', 'Property Address'],
    parcel_id: ['parcel_id', 'parcel', 'apn', 'parcel_number', 'Parcel ID', 'APN'],
    county: ['county', 'County'],
    opening_bid: ['opening_bid', 'minimum_bid', 'starting_bid', 'Opening Bid', 'Min Bid'],
    assessed_value: ['assessed_value', 'assessed_val', 'tax_assessed_value', 'Assessed Value'],
    market_value: ['market_value', 'estimated_value', 'market_val', 'Market Value'],
    auction_date: ['auction_date', 'sale_date', 'Auction Date', 'Sale Date'],
    auction_time: ['auction_time', 'sale_time', 'Auction Time'],
    auction_location: ['auction_location', 'sale_location', 'location', 'Auction Location'],
    case_number: ['case_number', 'case', 'docket', 'Case Number'],
    owner_name: ['owner_name', 'owner', 'Owner Name', 'Owner'],
    bedrooms: ['bedrooms', 'beds', 'Bedrooms', 'Beds'],
    bathrooms: ['bathrooms', 'baths', 'Bathrooms', 'Baths'],
    sqft: ['sqft', 'square_feet', 'living_area', 'SQFT', 'Square Feet'],
    year_built: ['year_built', 'year', 'Year Built'],
    property_type: ['property_type', 'type', 'Property Type'],
    latitude: ['latitude', 'lat', 'Latitude'],
    longitude: ['longitude', 'lng', 'lon', 'Longitude'],
  };

  const normalized: any = {
    user_id: userId,
    status: 'active',
    listing_type: 'tax deed',
    deal_stage: 'Lead',
    created_at: new Date().toISOString(),
  };

  // Map fields
  for (const [targetField, possibleFields] of Object.entries(fieldMappings)) {
    for (const sourceField of possibleFields) {
      if (rawProperty[sourceField] !== undefined && rawProperty[sourceField] !== null && rawProperty[sourceField] !== '') {
        let value = rawProperty[sourceField];

        // Type conversions
        if (['opening_bid', 'assessed_value', 'market_value'].includes(targetField)) {
          value = parseFloat(String(value).replace(/[$,]/g, '')) || null;
        } else if (['bedrooms', 'bathrooms', 'sqft', 'year_built'].includes(targetField)) {
          value = parseInt(String(value).replace(/[^0-9]/g, '')) || null;
        } else if (['latitude', 'longitude'].includes(targetField)) {
          value = parseFloat(String(value)) || null;
        } else if (targetField === 'auction_date') {
          // Try to parse date
          const dateValue = new Date(value);
          value = isNaN(dateValue.getTime()) ? null : dateValue.toISOString().split('T')[0];
        }

        normalized[targetField] = value;
        break;
      }
    }
  }

  // Calculate opportunity score if we have enough data
  if (normalized.assessed_value && normalized.opening_bid) {
    const discount = ((normalized.assessed_value - normalized.opening_bid) / normalized.assessed_value) * 100;
    normalized.opportunity_score = Math.min(100, Math.max(0, discount));
  }

  return normalized;
}

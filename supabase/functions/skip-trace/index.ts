// =====================================================
// SKIP TRACING EDGE FUNCTION
// Integrated with BatchSkipTracing API
// Returns owner contact info for properties
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SkipTraceRequest {
  property_id: string;
  owner_name?: string;
  property_address?: string;
}

interface SkipTraceResult {
  full_name: string;
  first_name: string;
  last_name: string;
  age?: number;
  phone_numbers: Array<{
    number: string;
    type: string;
    valid: boolean;
    line_type?: string;
  }>;
  email_addresses: string[];
  addresses: Array<{
    address: string;
    city: string;
    state: string;
    zip: string;
    type: string;
    current: boolean;
  }>;
  relatives: string[];
  confidence_score: number;
}

// =====================================================
// BATCH SKIP TRACING API CLIENT
// =====================================================

class BatchSkipTracingClient {
  private apiKey: string;
  private baseUrl = 'https://api.batchskiptracing.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async skipTrace(params: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  }): Promise<SkipTraceResult> {
    const response = await fetch(`${this.baseUrl}/person/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`BatchSkipTracing API error: ${error}`);
    }

    const data = await response.json();
    return this.transformResponse(data);
  }

  private transformResponse(data: any): SkipTraceResult {
    return {
      full_name: data.full_name || `${data.first_name} ${data.last_name}`,
      first_name: data.first_name,
      last_name: data.last_name,
      age: data.age,
      phone_numbers: (data.phones || []).map((p: any) => ({
        number: p.number,
        type: p.type || 'unknown',
        valid: p.valid !== false,
        line_type: p.line_type
      })),
      email_addresses: data.emails || [],
      addresses: (data.addresses || []).map((a: any) => ({
        address: a.street_address,
        city: a.city,
        state: a.state,
        zip: a.zip_code,
        type: a.type || 'unknown',
        current: a.current === true
      })),
      relatives: (data.relatives || []).map((r: any) => r.name),
      confidence_score: data.confidence_score || 70
    };
  }
}

// =====================================================
// ALTERNATIVE: TLOxp Integration (Premium Option)
// =====================================================

class TLOxpClient {
  private apiKey: string;
  private baseUrl = 'https://api.tlo.com/data/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async skipTrace(params: any): Promise<SkipTraceResult> {
    const response = await fetch(`${this.baseUrl}/people/search`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`TLOxp API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformResponse(data);
  }

  private transformResponse(data: any): SkipTraceResult {
    // Transform TLOxp response to standard format
    const person = data.results?.[0];

    return {
      full_name: person?.name?.full,
      first_name: person?.name?.first,
      last_name: person?.name?.last,
      age: person?.age,
      phone_numbers: (person?.phones || []).map((p: any) => ({
        number: p.phone_number,
        type: p.phone_type,
        valid: true,
        line_type: p.line_type
      })),
      email_addresses: (person?.emails || []).map((e: any) => e.email_address),
      addresses: (person?.addresses || []).map((a: any) => ({
        address: a.street_line_1,
        city: a.city,
        state: a.state,
        zip: a.zip_code,
        type: a.address_type,
        current: a.is_current
      })),
      relatives: (person?.relatives || []).map((r: any) => r.name),
      confidence_score: person?.confidence || 80
    };
  }
}

// =====================================================
// EDGE FUNCTION HANDLER
// =====================================================

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { property_id }: SkipTraceRequest = await req.json();

    if (!property_id) {
      throw new Error('property_id is required');
    }

    // Fetch property data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      throw new Error('Property not found');
    }

    // Check if skip trace already exists
    const { data: existingTrace } = await supabase
      .from('skip_trace_results')
      .select('*')
      .eq('property_id', property_id)
      .single();

    if (existingTrace) {
      return new Response(
        JSON.stringify({
          success: true,
          data: existingTrace,
          cached: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Check user credits
    const { data: credits } = await supabase
      .from('user_credits')
      .select('skip_trace_credits')
      .eq('user_id', user.id)
      .single();

    if (!credits || credits.skip_trace_credits < 1) {
      throw new Error('Insufficient skip trace credits');
    }

    // Get API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key_encrypted')
      .eq('service_name', 'BatchSkipTracing')
      .eq('is_global', true)
      .single();

    if (!apiKeyData) {
      throw new Error('BatchSkipTracing API key not configured');
    }

    // Initialize skip tracing client
    const client = new BatchSkipTracingClient(apiKeyData.api_key_encrypted);

    // Parse owner name
    const nameParts = property.owner_name?.split(' ') || [];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Parse address
    const addressParts = property.address?.split(',') || [];
    const street = addressParts[0];
    const city = addressParts[1]?.trim();

    // Perform skip trace
    console.log(`🔍 Skip tracing: ${property.owner_name} at ${property.address}`);

    const result = await client.skipTrace({
      first_name: firstName,
      last_name: lastName,
      address: street,
      city: city || property.city,
      state: property.state,
      zip: property.zip_code
    });

    // Save result to database
    const { data: savedResult, error: saveError } = await supabase
      .from('skip_trace_results')
      .insert({
        property_id: property_id,
        user_id: user.id,
        full_name: result.full_name,
        first_name: result.first_name,
        last_name: result.last_name,
        age: result.age,
        phone_numbers: result.phone_numbers,
        email_addresses: result.email_addresses,
        addresses: result.addresses,
        relatives: result.relatives,
        data_source: 'BatchSkipTracing',
        confidence_score: result.confidence_score,
        cost: 0.25, // $0.25 per skip trace
        credits_used: 1
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving skip trace result:', saveError);
    }

    // Deduct credit
    await supabase
      .from('user_credits')
      .update({
        skip_trace_credits: credits.skip_trace_credits - 1
      })
      .eq('user_id', user.id);

    // Log transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'skip_trace',
        amount: 0.25,
        status: 'completed',
        product_name: 'Skip Trace - BatchSkipTracing',
        metadata: { property_id, owner_name: property.owner_name }
      });

    console.log(`✅ Skip trace completed: ${result.phone_numbers.length} phones, ${result.email_addresses.length} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        data: savedResult,
        cached: false,
        phones_found: result.phone_numbers.length,
        emails_found: result.email_addresses.length,
        confidence: result.confidence_score
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Skip trace error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'all'; // all, auction, marketplace, tax_deed
    const state = url.searchParams.get('state');
    const county = url.searchParams.get('county');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Build query
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (type !== 'all') {
      query = query.eq('listing_type', type);
    }

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (county) {
      query = query.ilike('county', county);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        properties: data || [],
        total: count || 0,
        limit,
        offset,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-properties function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

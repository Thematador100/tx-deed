import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getAllKnownCounties } from '../_shared/county-finder.ts';

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
    const { counties, type = 'tax_deed', states } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let targetCounties = [];

    if (counties && Array.isArray(counties)) {
      // Specific counties provided
      targetCounties = counties;
    } else if (states && Array.isArray(states)) {
      // Scrape all known counties in specified states
      const allCounties = getAllKnownCounties();
      targetCounties = allCounties
        .filter(c => states.includes(c.stateAbbr))
        .map(c => ({ county: c.county, state: c.stateAbbr }));
    } else {
      // Scrape all known counties
      const allCounties = getAllKnownCounties();
      targetCounties = allCounties.map(c => ({ county: c.county, state: c.stateAbbr }));
    }

    console.log(`Batch scraping ${targetCounties.length} counties...`);

    const results = [];

    // Scrape each county (we could parallelize this, but being respectful to servers)
    for (const { county, state } of targetCounties) {
      try {
        // Call the scrape-county function
        const scrapeUrl = `${supabaseUrl}/functions/v1/scrape-county`;
        const response = await fetch(scrapeUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ county, state, type }),
        });

        const result = await response.json();
        results.push({
          county,
          state,
          success: response.ok,
          ...result,
        });

        // Add a small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.push({
          county,
          state,
          success: false,
          error: error.message,
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalRecords = results.reduce((sum, r) => sum + (r.recordsInserted || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        totalCounties: targetCounties.length,
        successful,
        failed,
        totalRecordsInserted: totalRecords,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in batch-scrape function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

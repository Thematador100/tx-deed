import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { findCountyInfo, discoverCountyInfo, CountyInfo } from '../_shared/county-finder.ts';
import { scrapeCountyWebsite, ScraperConfig, ScrapedProperty } from '../_shared/universal-scraper.ts';

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
    const { county, state, type = 'tax_deed', force = false } = await req.json();

    if (!county || !state) {
      return new Response(
        JSON.stringify({ error: 'County and state are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get or discover county information
    let countyInfo: CountyInfo | null = findCountyInfo(county, state);

    if (!countyInfo) {
      console.log(`County ${county}, ${state} not found in database, discovering...`);
      countyInfo = await discoverCountyInfo(county, state);

      // Save discovered county to scraper_configs
      const { error: configError } = await supabase
        .from('scraper_configs')
        .upsert({
          county: countyInfo.county,
          state: countyInfo.stateAbbr,
          scraper_type: type,
          website_url: countyInfo.taxDeedUrl || '',
          scraper_method: countyInfo.scrapingMethod,
          notes: countyInfo.notes,
        });

      if (configError) {
        console.error('Error saving scraper config:', configError);
      }
    }

    // Check if we recently scraped this county (unless force is true)
    if (!force) {
      const { data: existingLog } = await supabase
        .from('scraper_logs')
        .select('*')
        .eq('county', countyInfo.county)
        .eq('state', countyInfo.stateAbbr)
        .eq('scraper_type', type)
        .eq('status', 'success')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingLog) {
        return new Response(
          JSON.stringify({
            message: 'County recently scraped',
            lastScraped: existingLog.created_at,
            recordsFound: existingLog.records_found,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create scraper config
    const scraperConfig: ScraperConfig = {
      url: type === 'tax_deed' ? (countyInfo.taxDeedUrl || '') : (countyInfo.delinquentUrl || ''),
      county: countyInfo.county,
      state: countyInfo.stateAbbr,
      type: type as any,
    };

    const startedAt = new Date();

    // Scrape the county website
    console.log(`Scraping ${countyInfo.county}, ${countyInfo.stateAbbr}...`);
    const properties = await scrapeCountyWebsite(scraperConfig);

    let recordsInserted = 0;
    let recordsUpdated = 0;
    const errors: string[] = [];

    // Save scraped properties to database
    for (const property of properties) {
      try {
        // Determine which table to insert into
        let tableName = '';
        let propertyData: any = {
          address: property.address,
          city: property.city,
          state: property.state,
          county: property.county,
          parcel_id: property.parcelId,
          owner: property.owner,
          status: property.status || 'active',
          data_source: property.dataSource,
          source_url: property.sourceUrl,
          scraped_at: new Date().toISOString(),
        };

        if (type === 'tax_delinquent') {
          tableName = 'tax_delinquent_leads';
          propertyData = {
            ...propertyData,
            delinquent_amount: property.delinquentAmount,
            starting_bid: property.startingBid,
            auction_date: property.auctionDate,
          };
        } else if (type === 'redeemable') {
          tableName = 'redeemable_deeds';
          propertyData = {
            ...propertyData,
            sale_price: property.price,
            redemption_date: property.redemptionDate,
          };
        } else {
          tableName = 'properties';
          propertyData = {
            ...propertyData,
            starting_bid: property.startingBid,
            price: property.price,
            auction_date: property.auctionDate,
            listing_type: type,
          };
        }

        // Upsert (insert or update) the property
        const { error: insertError } = await supabase
          .from(tableName)
          .upsert(propertyData, {
            onConflict: 'address,county,state',
          });

        if (insertError) {
          errors.push(`Error inserting ${property.address}: ${insertError.message}`);
          console.error('Insert error:', insertError);
        } else {
          recordsInserted++;
        }
      } catch (error) {
        errors.push(`Error processing ${property.address}: ${error.message}`);
        console.error('Processing error:', error);
      }
    }

    const completedAt = new Date();

    // Log the scraping operation
    const { error: logError } = await supabase
      .from('scraper_logs')
      .insert({
        county: countyInfo.county,
        state: countyInfo.stateAbbr,
        scraper_type: type,
        status: errors.length === 0 ? 'success' : (recordsInserted > 0 ? 'partial' : 'failed'),
        records_found: properties.length,
        records_inserted: recordsInserted,
        records_updated: recordsUpdated,
        error_message: errors.length > 0 ? errors.join('\n') : null,
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
      });

    if (logError) {
      console.error('Error logging scrape:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        county: countyInfo.county,
        state: countyInfo.stateAbbr,
        type,
        recordsFound: properties.length,
        recordsInserted,
        recordsUpdated,
        errors: errors.length > 0 ? errors : undefined,
        duration: completedAt.getTime() - startedAt.getTime(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-county function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

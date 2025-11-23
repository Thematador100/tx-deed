import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    const { query } = await req.json();

    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In production, this would call Smarty Streets API
    // For now, we'll use a simple mock implementation
    const smartyAuthId = Deno.env.get('SMARTY_AUTH_ID');
    const smartyAuthToken = Deno.env.get('SMARTY_AUTH_TOKEN');

    if (smartyAuthId && smartyAuthToken) {
      // Call real Smarty Streets API
      const url = `https://us-autocomplete-pro.api.smarty.com/lookup?auth-id=${smartyAuthId}&auth-token=${smartyAuthToken}&search=${encodeURIComponent(query)}&max_results=10`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Smarty Streets API error');
      }

      const data = await response.json();

      // Transform Smarty response to our format
      const suggestions = data.suggestions?.map((s: any) => ({
        street_line: s.street_line,
        city: s.city,
        state: s.state,
        zipcode: s.zipcode,
      })) || [];

      return new Response(
        JSON.stringify({ suggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Mock implementation for testing
      const mockSuggestions = [
        {
          street_line: `${query} Main St`,
          city: 'Austin',
          state: 'TX',
          zipcode: '78701',
        },
        {
          street_line: `${query} Oak Ave`,
          city: 'Houston',
          state: 'TX',
          zipcode: '77002',
        },
        {
          street_line: `${query} Elm Dr`,
          city: 'Dallas',
          state: 'TX',
          zipcode: '75201',
        },
      ];

      return new Response(
        JSON.stringify({ suggestions: mockSuggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in smarty-autocomplete function:', error);
    return new Response(
      JSON.stringify({ error: error.message, suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

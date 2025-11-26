import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApiKeyRequest {
  action: 'create' | 'update' | 'delete' | 'list';
  keyId?: string;
  keyName?: string;
  keyValue?: string;
  service?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is admin
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, keyId, keyName, keyValue, service } = await req.json() as ApiKeyRequest;

    switch (action) {
      case 'list': {
        const { data: keys, error } = await supabaseClient
          .from('api_keys')
          .select('id, key_name, service, created_at, last_used')
          .order('created_at', { ascending: false });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ keys }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        if (!keyName || !keyValue || !service) {
          return new Response(
            JSON.stringify({ error: 'Key name, value, and service are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // In production, you'd want to encrypt the key_value
        const { data: newKey, error } = await supabaseClient
          .from('api_keys')
          .insert({
            key_name: keyName,
            key_value: keyValue, // Should be encrypted in production
            service: service,
            created_by: user.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ key: newKey, message: 'API key created successfully' }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!keyId || !keyValue) {
          return new Response(
            JSON.stringify({ error: 'Key ID and value are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updatedKey, error } = await supabaseClient
          .from('api_keys')
          .update({
            key_value: keyValue, // Should be encrypted in production
            updated_at: new Date().toISOString()
          })
          .eq('id', keyId)
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ key: updatedKey, message: 'API key updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!keyId) {
          return new Response(
            JSON.stringify({ error: 'Key ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseClient
          .from('api_keys')
          .delete()
          .eq('id', keyId);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ message: 'API key deleted successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error managing API key:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

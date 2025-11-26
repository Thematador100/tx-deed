import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminSetupRequest {
  email: string;
  password: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { email, password } = await req.json() as AdminSetupRequest;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if any admin already exists
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing admins:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing admins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only allow admin setup if no admin exists
    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ error: 'An admin account already exists. Please contact support.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin
    });

    if (authError || !authData.user) {
      console.error('Error creating admin user:', authError);
      return new Response(
        JSON.stringify({ error: authError?.message || 'Failed to create admin user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or insert profile with admin role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        role: 'admin',
        full_name: 'System Administrator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creating admin profile:', profileError);
      // Try to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return new Response(
        JSON.stringify({ error: 'Failed to create admin profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Admin account created successfully',
        email: email,
        userId: authData.user.id
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in force-admin-setup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =====================================================
// TELNYX SMS/MMS OUTREACH - Edge Function
// TCPA compliant messaging with opt-out handling
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  campaign_id?: string;
  property_id?: string;
  to_phone: string;
  message: string;
  media_urls?: string[];
}

// =====================================================
// TELNYX CLIENT
// =====================================================

class TelnyxClient {
  private apiKey: string;
  private baseUrl = 'https://api.telnyx.com/v2';
  private fromNumber: string;

  constructor(apiKey: string, fromNumber: string) {
    this.apiKey = apiKey;
    this.fromNumber = fromNumber;
  }

  async sendSMS(to: string, message: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromNumber,
        to: this.formatPhoneNumber(to),
        text: message,
        messaging_profile_id: Deno.env.get('TELNYX_MESSAGING_PROFILE_ID')
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Telnyx error: ${error.errors?.[0]?.detail || response.statusText}`);
    }

    return await response.json();
  }

  async sendMMS(to: string, message: string, mediaUrls: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromNumber,
        to: this.formatPhoneNumber(to),
        text: message,
        media_urls: mediaUrls,
        messaging_profile_id: Deno.env.get('TELNYX_MESSAGING_PROFILE_ID')
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Telnyx MMS error: ${error.errors?.[0]?.detail || response.statusText}`);
    }

    return await response.json();
  }

  async makeCall(to: string, callbackUrl: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/calls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromNumber,
        to: this.formatPhoneNumber(to),
        connection_id: Deno.env.get('TELNYX_CONNECTION_ID'),
        webhook_url: callbackUrl
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Telnyx call error: ${error.errors?.[0]?.detail || response.statusText}`);
    }

    return await response.json();
  }

  private formatPhoneNumber(phone: string): string {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Add +1 for US numbers if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    return phone;
  }
}

// =====================================================
// COMPLIANCE CHECKS
// =====================================================

async function checkDNC(supabase: any, phone: string): Promise<boolean> {
  const { data } = await supabase
    .from('dnc_list')
    .select('id')
    .eq('phone', phone)
    .single();

  return data !== null;
}

async function checkTCPAConsent(supabase: any, campaignId: string): Promise<boolean> {
  const { data } = await supabase
    .from('outreach_campaigns')
    .select('tcpa_consent_verified')
    .eq('id', campaignId)
    .single();

  return data?.tcpa_consent_verified === true;
}

function addOptOutMessage(message: string): string {
  if (!message.toLowerCase().includes('stop') && !message.toLowerCase().includes('opt-out')) {
    return `${message}\n\nReply STOP to opt-out.`;
  }
  return message;
}

// =====================================================
// EDGE FUNCTION HANDLER
// =====================================================

serve(async (req) => {
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

    const { campaign_id, property_id, to_phone, message, media_urls }: SMSRequest = await req.json();

    if (!to_phone || !message) {
      throw new Error('to_phone and message are required');
    }

    // Compliance checks
    const isDNC = await checkDNC(supabase, to_phone);
    if (isDNC) {
      throw new Error('Phone number is on Do Not Call list');
    }

    if (campaign_id) {
      const hasConsent = await checkTCPAConsent(supabase, campaign_id);
      if (!hasConsent) {
        throw new Error('TCPA consent not verified for this campaign');
      }
    }

    // Get Telnyx API credentials
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key_encrypted')
      .eq('service_name', 'Telnyx')
      .eq('is_global', true)
      .single();

    if (!apiKeyData) {
      throw new Error('Telnyx API key not configured');
    }

    const fromNumber = Deno.env.get('TELNYX_FROM_NUMBER') || '+18005551234';

    // Initialize Telnyx client
    const client = new TelnyxClient(apiKeyData.api_key_encrypted, fromNumber);

    // Add opt-out message
    const compliantMessage = addOptOutMessage(message);

    console.log(`📱 Sending SMS to ${to_phone}`);

    // Send message
    let result;
    if (media_urls && media_urls.length > 0) {
      result = await client.sendMMS(to_phone, compliantMessage, media_urls);
    } else {
      result = await client.sendSMS(to_phone, compliantMessage);
    }

    // Log message to database
    const { data: messageRecord, error: messageError } = await supabase
      .from('outreach_messages')
      .insert({
        campaign_id: campaign_id || null,
        user_id: user.id,
        property_id: property_id || null,
        recipient_phone: to_phone,
        message_type: media_urls && media_urls.length > 0 ? 'mms' : 'sms',
        body: compliantMessage,
        status: 'sent',
        provider: 'Telnyx',
        provider_message_id: result.data.id,
        sent_at: new Date().toISOString(),
        cost: 0.0079 // Telnyx pricing ~$0.0079 per SMS
      })
      .select()
      .single();

    // Update campaign stats if applicable
    if (campaign_id) {
      await supabase.rpc('increment_campaign_sent', { campaign_uuid: campaign_id });
    }

    console.log(`✅ SMS sent successfully: ${result.data.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: result.data.id,
        to: to_phone,
        status: 'sent',
        cost: 0.0079
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('SMS send error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

// Send Notification Edge Function (Email/SMS/Push)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, title, message, type, notification_types = ['in_app'] } = await req.json();

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'user_id, title, and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user preferences
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email, full_name, phone')
      .eq('id', user_id)
      .single();

    // Always create in-app notification
    const { data: notification, error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type: type || 'info',
      })
      .select()
      .single();

    if (notifError) {
      throw notifError;
    }

    const results: any = { in_app: true };

    // Send email notification if enabled
    if (
      notification_types.includes('email') &&
      preferences?.email_notifications &&
      profile?.email
    ) {
      try {
        await sendEmailNotification(profile.email, profile.full_name, title, message);
        results.email = true;
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        results.email = false;
      }
    }

    // Send SMS notification if enabled
    if (
      notification_types.includes('sms') &&
      preferences?.sms_notifications &&
      profile?.phone
    ) {
      try {
        await sendSMSNotification(profile.phone, title, message);
        results.sms = true;
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
        results.sms = false;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        sent: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendEmailNotification(email: string, name: string, title: string, message: string) {
  // Using SendGrid (already configured in Supabase Auth)
  const sendGridKey = Deno.env.get('SENDGRID_API_KEY');

  if (!sendGridKey) {
    console.log('SendGrid not configured, skipping email');
    return;
  }

  const emailData = {
    personalizations: [{
      to: [{ email, name }],
      subject: title,
    }],
    from: {
      email: 'notifications@winwithdeeds.com',
      name: 'Win With Deeds',
    },
    content: [{
      type: 'text/html',
      value: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${title}</h1>
            </div>
            <div class="content">
              <p>${message}</p>
              <a href="https://winwithdeeds.com/dashboard" class="button">View Dashboard</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from Win With Deeds.</p>
              <p><a href="https://winwithdeeds.com/profile">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    }],
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendGridKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    throw new Error(`SendGrid API error: ${await response.text()}`);
  }
}

async function sendSMSNotification(phone: string, title: string, message: string) {
  // Using Twilio for SMS (would need to be configured)
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.log('Twilio not configured, skipping SMS');
    return;
  }

  const smsBody = `${title}: ${message}`;

  const params = new URLSearchParams({
    To: phone,
    From: twilioPhone,
    Body: smsBody,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  if (!response.ok) {
    throw new Error(`Twilio API error: ${await response.text()}`);
  }
}

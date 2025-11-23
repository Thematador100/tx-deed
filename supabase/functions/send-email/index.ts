// =====================================================
// EMAIL OUTREACH - Resend Integration
// CAN-SPAM compliant email with templates
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  campaign_id?: string;
  property_id?: string;
  to_email: string;
  to_name?: string;
  subject: string;
  html_content?: string;
  text_content?: string;
  template_id?: string;
  variables?: Record<string, any>;
}

// =====================================================
// RESEND CLIENT
// =====================================================

class ResendClient {
  private apiKey: string;
  private baseUrl = 'https://api.resend.com';
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    reply_to?: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.reply_to || this.fromEmail
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  async sendBulk(emails: Array<{
    to: string;
    subject: string;
    html: string;
  }>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/emails/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        emails.map(email => ({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [email.to],
          subject: email.subject,
          html: email.html
        }))
      )
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend bulk error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }
}

// =====================================================
// EMAIL TEMPLATES
// =====================================================

function getPropertyInquiryTemplate(variables: any): string {
  const { property_address, owner_name, your_name, your_company, your_phone } = variables;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Property Inquiry</h1>
    </div>
    <div class="content">
      <p>Dear ${owner_name || 'Property Owner'},</p>

      <p>I hope this message finds you well. My name is ${your_name} with ${your_company}. I'm reaching out regarding your property located at:</p>

      <p style="font-weight: bold; font-size: 16px; margin: 20px 0;">
        📍 ${property_address}
      </p>

      <p>I specialize in purchasing properties in the area and would like to discuss a potential cash offer for your property. We can:</p>

      <ul>
        <li>✅ Close quickly - as fast as 7-14 days</li>
        <li>✅ Pay all cash - no financing contingencies</li>
        <li>✅ Buy as-is - no repairs needed</li>
        <li>✅ Cover all closing costs</li>
      </ul>

      <p>If you're interested in hearing more, I'd be happy to schedule a brief call at your convenience.</p>

      <p>You can reach me at <strong>${your_phone}</strong> or simply reply to this email.</p>

      <p>Thank you for your time and consideration.</p>

      <p>Best regards,<br>
      ${your_name}<br>
      ${your_company}</p>
    </div>
    <div class="footer">
      <p>You're receiving this because we believe you may be interested in selling your property.</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Update Preferences</a></p>
      <p>© ${new Date().getFullYear()} ${your_company}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getDealAlertTemplate(variables: any): string {
  const { property_address, opportunity_score, roi, estimated_profit, auction_date } = variables;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .score { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; font-size: 24px; font-weight: bold; }
    .content { padding: 30px; background: white; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    .button { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New High-Value Deal Alert!</h1>
      <div style="margin-top: 15px;">
        <span class="score">${opportunity_score}/100</span>
      </div>
    </div>
    <div class="content">
      <h2>📍 ${property_address}</h2>

      <div class="stats">
        <div class="stat">
          <div class="stat-value">${roi}%</div>
          <div class="stat-label">Estimated ROI</div>
        </div>
        <div class="stat">
          <div class="stat-value">$${estimated_profit.toLocaleString()}</div>
          <div class="stat-label">Est. Profit</div>
        </div>
      </div>

      <p><strong>🗓️ Auction Date:</strong> ${auction_date}</p>

      <p>This property matches your investment criteria and has a high opportunity score. Review the full details and analysis before the auction date.</p>

      <a href="{{property_url}}" class="button">View Full Analysis →</a>

      <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; font-size: 14px;">
        <strong>⚡ Time-Sensitive:</strong> High-opportunity properties move fast. Review and bid strategically.
      </p>
    </div>
    <div class="footer">
      <p>Powered by Win With Deeds AI Scout Agent</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{agent_settings_url}}">Adjust Alert Settings</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

// =====================================================
// COMPLIANCE
// =====================================================

function addUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  const footer = `
    <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p>This is a commercial email. You can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
      <p>Win With Deeds | 123 Main St | Your City, ST 12345</p>
    </div>
  `;

  return html + footer;
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

    const { campaign_id, property_id, to_email, to_name, subject, html_content, text_content, template_id, variables }: EmailRequest = await req.json();

    if (!to_email || !subject) {
      throw new Error('to_email and subject are required');
    }

    // Get Resend API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key_encrypted')
      .eq('service_name', 'Resend')
      .eq('is_global', true)
      .single();

    if (!apiKeyData) {
      throw new Error('Resend API key not configured');
    }

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@winwithdeeds.com';
    const fromName = Deno.env.get('RESEND_FROM_NAME') || 'Win With Deeds';

    const client = new ResendClient(apiKeyData.api_key_encrypted, fromEmail, fromName);

    // Generate HTML from template if template_id provided
    let finalHtml = html_content;
    if (template_id && variables) {
      if (template_id === 'property_inquiry') {
        finalHtml = getPropertyInquiryTemplate(variables);
      } else if (template_id === 'deal_alert') {
        finalHtml = getDealAlertTemplate(variables);
      }
    }

    // Add unsubscribe footer for compliance
    const unsubscribeUrl = `${supabaseUrl}/unsubscribe?email=${encodeURIComponent(to_email)}`;
    if (finalHtml) {
      finalHtml = addUnsubscribeFooter(finalHtml, unsubscribeUrl);
    }

    console.log(`📧 Sending email to ${to_email}`);

    // Send email
    const result = await client.sendEmail({
      to: to_email,
      subject,
      html: finalHtml,
      text: text_content
    });

    // Log message to database
    await supabase
      .from('outreach_messages')
      .insert({
        campaign_id: campaign_id || null,
        user_id: user.id,
        property_id: property_id || null,
        recipient_email: to_email,
        recipient_name: to_name,
        message_type: 'email',
        subject,
        body: finalHtml || text_content,
        status: 'sent',
        provider: 'Resend',
        provider_message_id: result.id,
        sent_at: new Date().toISOString(),
        cost: 0.0001 // Resend pricing ~$0.0001 per email
      });

    // Update campaign stats
    if (campaign_id) {
      await supabase.rpc('increment_campaign_sent', { campaign_uuid: campaign_id });
    }

    console.log(`✅ Email sent successfully: ${result.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: result.id,
        to: to_email,
        status: 'sent'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

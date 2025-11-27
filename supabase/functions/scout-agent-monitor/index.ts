import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active scout agents
    const { data: agents, error } = await supabase
      .from('scout_agents')
      .select('*')
      .eq('is_active', true)

    if (error) throw error

    if (!agents || agents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active agents found', alerts_sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalAlerts = 0

    // Monitor each agent
    for (const agent of agents) {
      const alerts = await monitorAgent(agent, supabase)
      totalAlerts += alerts
    }

    return new Response(
      JSON.stringify({
        success: true,
        agents_monitored: agents.length,
        alerts_sent: totalAlerts
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Scout monitoring error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function monitorAgent(agent: any, supabase: any): Promise<number> {
  let alertsSent = 0

  try {
    const criteria = agent.criteria || {}
    const {
      counties = [],
      max_price,
      min_roi,
      property_types = [],
      keywords = []
    } = criteria

    // Build query
    let query = supabase
      .from('properties')
      .select('*')
      .gte('created_at', agent.last_check_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Apply filters
    if (counties.length > 0) {
      query = query.in('county', counties)
    }
    if (max_price) {
      query = query.lte('price', max_price)
    }
    if (min_roi) {
      query = query.gte('roi', min_roi)
    }
    if (property_types.length > 0) {
      query = query.in('property_type', property_types)
    }

    const { data: newProperties, error } = await query

    if (error) throw error

    if (newProperties && newProperties.length > 0) {
      // Filter by keywords if specified
      let matchedProperties = newProperties
      if (keywords.length > 0) {
        matchedProperties = newProperties.filter(prop => {
          const searchText = `${prop.address} ${prop.description} ${prop.owner}`.toLowerCase()
          return keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
        })
      }

      if (matchedProperties.length > 0) {
        // Send notification
        await sendNotification(agent, matchedProperties, supabase)
        alertsSent = matchedProperties.length

        // Update agent
        await supabase
          .from('scout_agents')
          .update({
            last_check_at: new Date().toISOString(),
            alert_count: (agent.alert_count || 0) + matchedProperties.length,
            properties_found: (agent.properties_found || 0) + matchedProperties.length
          })
          .eq('id', agent.id)
      }
    }

    // Update last check even if no results
    await supabase
      .from('scout_agents')
      .update({
        last_check_at: new Date().toISOString()
      })
      .eq('id', agent.id)

  } catch (error) {
    console.error(`Error monitoring agent ${agent.id}:`, error)
  }

  return alertsSent
}

async function sendNotification(agent: any, properties: any[], supabase: any) {
  const notificationPrefs = agent.notification_preferences || {}
  const { email = true, sms = false, push = false } = notificationPrefs

  const message = `🎯 Scout Agent Alert: ${agent.name}

Found ${properties.length} new properties matching your criteria:

${properties.slice(0, 5).map(p => `📍 ${p.address}, ${p.city}
💰 Price: $${p.price?.toLocaleString()}
📈 ROI: ${p.roi}%
${p.auction_date ? `📅 Auction: ${p.auction_date}` : ''}
`).join('\n')}

${properties.length > 5 ? `\n... and ${properties.length - 5} more properties` : ''}

View all matches: ${Deno.env.get('SUPABASE_URL')}/dashboard/scout-agents/${agent.id}
`

  // Send email notification
  if (email) {
    await supabase.functions.invoke('send-notification', {
      body: {
        type: 'email',
        to: agent.user_email,
        subject: `🎯 ${properties.length} New Properties from ${agent.name}`,
        message
      }
    })
  }

  // Send SMS if enabled
  if (sms && agent.user_phone) {
    const smsMessage = `🎯 ${properties.length} new properties match your ${agent.name} scout! Check your email for details.`
    await supabase.functions.invoke('send-notification', {
      body: {
        type: 'sms',
        to: agent.user_phone,
        message: smsMessage
      }
    })
  }

  // Save notification to database
  await supabase.from('notifications').insert({
    user_id: agent.user_id,
    type: 'scout_alert',
    title: `${properties.length} New Properties from ${agent.name}`,
    message: message.substring(0, 500),
    data: { agent_id: agent.id, property_count: properties.length },
    read: false,
    created_at: new Date().toISOString()
  })
}

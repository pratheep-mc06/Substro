// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/introduction

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch alerts due for notification
    const { data: alerts, error: fetchError } = await supabaseClient
      .from('subscription_alerts')
      .select('*, profiles(email), user_subscriptions(raw_name, amount, frequency)')
      .eq('is_enabled', true)
      // Logic for reminder_days would go here in a production cron
    
    if (fetchError) throw fetchError

    // 2. Send emails (using a service like Resend or SendGrid)
    // For now, we log the intent
    console.log(`Processing ${alerts?.length} alerts...`)

    return new Response(JSON.stringify({ success: true, processed: alerts?.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

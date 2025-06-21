import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get notifications that need push notification
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        category,
        recipient_id,
        metadata,
        created_at
      `)
      .eq('push_sent', false)
      .order('created_at', { ascending: true })
      .limit(50)

    if (fetchError) {
      throw fetchError
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No notifications to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sentCount = 0
    let errorCount = 0

    for (const notification of notifications) {
      try {
        // Get user's push subscriptions
        const { data: subscriptions, error: subError } = await supabaseClient
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', notification.recipient_id)
          .eq('is_active', true)

        if (subError) {
          console.error('Error fetching subscriptions:', subError)
          continue
        }

        if (!subscriptions || subscriptions.length === 0) {
          // Mark as sent even if no subscriptions to avoid retrying
          await supabaseClient
            .from('notifications')
            .update({ 
              push_sent: true, 
              push_sent_at: new Date().toISOString() 
            })
            .eq('id', notification.id)
          continue
        }

        // Prepare push payload
        const payload: PushPayload = {
          title: notification.title,
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: {
            notificationId: notification.id,
            type: notification.type,
            category: notification.category,
            url: '/', // You can customize this based on notification type
            ...notification.metadata
          }
        }

        // Send to each subscription
        for (const subscription of subscriptions) {
          try {
            await sendPushNotification(subscription, payload)
          } catch (pushError) {
            console.error('Failed to send push to subscription:', pushError)
            
            // If subscription is invalid, mark as inactive
            if (pushError.message.includes('410') || pushError.message.includes('invalid')) {
              await supabaseClient
                .from('push_subscriptions')
                .update({ is_active: false })
                .eq('id', subscription.id)
            }
          }
        }

        // Mark notification as sent
        await supabaseClient
          .from('notifications')
          .update({ 
            push_sent: true, 
            push_sent_at: new Date().toISOString() 
          })
          .eq('id', notification.id)

        sentCount++

      } catch (error) {
        console.error('Error processing notification:', error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications processed',
        sent: sentCount,
        errors: errorCount,
        total: notifications.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-push-notifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendPushNotification(subscription: any, payload: PushPayload) {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:your-email@example.com'

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID keys not configured')
  }

  // Import web-push library
  const webpush = await import('https://esm.sh/web-push@3.6.6')
  
  webpush.default.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  )

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  }

  await webpush.default.sendNotification(
    pushSubscription,
    JSON.stringify(payload),
    {
      TTL: 86400, // 24 hours
      urgency: 'normal'
    }
  )
}

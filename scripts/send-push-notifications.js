import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import dotenv from "dotenv";

dotenv.config();

// Configure web-push with VAPID keys
const vapidPublicKey =
  process.env.VAPID_PUBLIC_KEY ||
  "BEl62iUYgUivxIkv69yViEuiBIa40HdeQzFeMjSWmn6qdFQRKH4kMfKiuWk-hhmm-jWfnwBgWfBePj5lzJNRbKE";
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || "your-private-key-here";
const vapidSubject =
  process.env.VAPID_SUBJECT || "mailto:your-email@example.com";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "your-supabase-url",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key"
);

async function sendPushNotifications() {
  try {
    console.log("🔄 Starting push notification processing...");

    // Get notifications that need push notification
    const { data: notifications, error: fetchError } = await supabase
      .from("notifications")
      .select(
        `
        id,
        title,
        message,
        type,
        category,
        recipient_id,
        metadata,
        created_at
      `
      )
      .eq("push_sent", false)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      console.log("✅ No notifications to send");
      return { sent: 0, errors: 0, total: 0 };
    }

    console.log(`📧 Found ${notifications.length} notifications to process`);

    let sentCount = 0;
    let errorCount = 0;

    for (const notification of notifications) {
      try {
        console.log(`Processing notification: ${notification.title}`);

        // Get user's push subscriptions
        const { data: subscriptions, error: subError } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", notification.recipient_id)
          .eq("is_active", true);

        if (subError) {
          console.error("Error fetching subscriptions:", subError);
          continue;
        }

        if (!subscriptions || subscriptions.length === 0) {
          console.log(
            `No active subscriptions for user ${notification.recipient_id}`
          );
          // Mark as sent even if no subscriptions to avoid retrying
          await supabase
            .from("notifications")
            .update({
              push_sent: true,
              push_sent_at: new Date().toISOString(),
            })
            .eq("id", notification.id);
          continue;
        }

        console.log(`Found ${subscriptions.length} subscription(s) for user`);

        // Prepare push payload
        const payload = {
          title: notification.title,
          body: notification.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: {
            notificationId: notification.id,
            type: notification.type,
            category: notification.category,
            url: "/", // You can customize this based on notification type
            timestamp: Date.now(),
            ...notification.metadata,
          },
        };

        // Send to each subscription
        let subscriptionSentCount = 0;
        for (const subscription of subscriptions) {
          try {
            const pushSubscription = {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            };

            await webpush.sendNotification(
              pushSubscription,
              JSON.stringify(payload),
              {
                TTL: 86400, // 24 hours
                urgency: "normal",
              }
            );

            subscriptionSentCount++;
            console.log(`✅ Push sent to subscription ${subscription.id}`);
          } catch (pushError) {
            console.error(
              "Failed to send push to subscription:",
              pushError.message
            );

            // If subscription is invalid (410 Gone or similar), mark as inactive
            if (
              pushError.statusCode === 410 ||
              pushError.message.includes("invalid")
            ) {
              console.log(
                `Marking subscription ${subscription.id} as inactive`
              );
              await supabase
                .from("push_subscriptions")
                .update({ is_active: false })
                .eq("id", subscription.id);
            }
          }
        }

        // Mark notification as sent
        await supabase
          .from("notifications")
          .update({
            push_sent: true,
            push_sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);

        sentCount++;
        console.log(
          `✅ Notification ${notification.id} processed (sent to ${subscriptionSentCount} devices)`
        );
      } catch (error) {
        console.error("Error processing notification:", error);
        errorCount++;
      }
    }

    const result = {
      sent: sentCount,
      errors: errorCount,
      total: notifications.length,
    };

    console.log(`🎉 Push notification processing complete:`, result);
    return result;
  } catch (error) {
    console.error("❌ Error in sendPushNotifications:", error);
    throw error;
  }
}

// Run immediately if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  sendPushNotifications()
    .then((result) => {
      console.log("Final result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export { sendPushNotifications };

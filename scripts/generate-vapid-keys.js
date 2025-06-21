import webpush from "web-push";

console.log("Generating VAPID keys...");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("\n🔑 VAPID Keys Generated!");
console.log("=".repeat(50));
console.log("\nAdd these to your environment variables:");
console.log("\n📝 For your frontend (.env):");
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log("\n📝 For your backend (.env):");
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
console.log("\n📝 For Supabase Edge Functions:");
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
console.log("\n" + "=".repeat(50));
console.log("\n⚠️  Important:");
console.log("1. Keep these keys secure and private");
console.log("2. Add them to your .env files");
console.log("3. Update the VAPID_PUBLIC_KEY in src/lib/pushNotifications.ts");
console.log(
  "4. Make sure to use the same email in VAPID_SUBJECT that you use for your app"
);
console.log("\n✅ Setup is ready for push notifications!");

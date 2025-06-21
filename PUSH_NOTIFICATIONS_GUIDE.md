# 🔔 Push Notification Setup Guide

This guide will help you set up real push notifications that work on desktop and mobile devices, even when users are not on your website.

## 📋 Prerequisites

- Supabase project with the notification system already set up
- Node.js installed for running backend scripts
- A domain with HTTPS (required for push notifications)

## 🚀 Quick Setup

### 1. Generate VAPID Keys

First, install dependencies and generate VAPID keys:

```bash
cd scripts
npm install
node generate-vapid-keys.js
```

This will generate public and private VAPID keys that you'll need for authentication.

### 2. Update Environment Variables

Create a `.env` file in the `scripts` directory with your Supabase credentials and VAPID keys:

```env
SUPABASE_URL=your-supabase-url-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VAPID_PUBLIC_KEY=your-generated-public-key
VAPID_PRIVATE_KEY=your-generated-private-key
VAPID_SUBJECT=mailto:your-email@example.com
```

### 3. Update Frontend VAPID Key

Update the public VAPID key in `src/lib/pushNotifications.ts`:

```typescript
export const VAPID_PUBLIC_KEY = "your-generated-public-key";
```

### 4. Deploy Migrations

Make sure your Supabase migrations are deployed:

```bash
npx supabase db push
```

### 5. Set Up Backend Processing

You have two options for processing push notifications:

#### Option A: Manual Script (for testing)

Run the push notification script manually:

```bash
cd scripts
npm run send-push
```

#### Option B: Automated Processing (recommended)

Set up a cron job or scheduled task to run every few minutes:

```bash
# Linux/Mac - add to crontab
*/2 * * * * cd /path/to/your/project/scripts && npm run send-push

# Windows - use Task Scheduler to run:
# cd "C:\path\to\your\project\scripts" && npm run send-push
```

#### Option C: Supabase Edge Function (advanced)

Deploy the edge function to Supabase:

```bash
# Make sure you have Supabase CLI installed
npx supabase functions deploy send-push-notifications

# Set environment variables for the function
npx supabase secrets set VAPID_PUBLIC_KEY=your-public-key
npx supabase secrets set VAPID_PRIVATE_KEY=your-private-key
npx supabase secrets set VAPID_SUBJECT=mailto:your-email@example.com
```

Then set up a database webhook or cron job to call the function.

## 🔧 How It Works

1. **User Subscription**: When users visit your app, they're prompted to enable push notifications
2. **Subscription Storage**: Their push subscription is stored in the `push_subscriptions` table
3. **Notification Creation**: When notifications are created, they're marked with `push_sent: false`
4. **Background Processing**: The backend script processes pending notifications and sends them to user devices
5. **Real Push**: Users receive notifications on their devices even when not on your website

## 📱 User Experience

1. **First Visit**: User sees a prompt to enable push notifications
2. **Settings**: Users can enable/disable push notifications in the settings tab
3. **Notifications**: Users receive real-time push notifications on their devices
4. **Click Action**: Clicking notifications opens the app to the relevant page

## 🛠️ Troubleshooting

### Notifications Not Appearing

1. **Check Browser Support**: Ensure the browser supports push notifications
2. **HTTPS Required**: Push notifications only work on HTTPS domains
3. **Permission Granted**: Make sure the user granted notification permission
4. **Service Worker**: Verify the service worker is registered correctly
5. **VAPID Keys**: Ensure VAPID keys are correctly set in both frontend and backend

### Backend Not Sending

1. **Environment Variables**: Check that all environment variables are set correctly
2. **Supabase Permissions**: Ensure the service role key has proper permissions
3. **Dependencies**: Make sure all npm packages are installed in the scripts folder

### Testing Push Notifications

1. **Use Notification Test**: Go to the Super Admin dashboard and use the notification test component
2. **Check Browser DevTools**: Look for any console errors
3. **Manual Script**: Run the push script manually to see if it processes notifications

## 🔐 Security Notes

- **Keep VAPID Keys Secret**: Never expose your private VAPID key in frontend code
- **Use Environment Variables**: Store sensitive data in environment variables
- **HTTPS Only**: Push notifications require HTTPS in production
- **Service Role Key**: Keep your Supabase service role key secure

## 📊 Monitoring

- **Push Subscriptions**: Monitor the `push_subscriptions` table for active subscriptions
- **Notification Status**: Check the `push_sent` column in the `notifications` table
- **Script Logs**: Monitor the output of your push notification script
- **Browser DevTools**: Use browser developer tools to debug notification issues

## 🚀 Going to Production

1. **Set up HTTPS**: Ensure your domain has a valid SSL certificate
2. **Environment Variables**: Set all environment variables in your production environment
3. **Automated Processing**: Set up a cron job or scheduled task for push processing
4. **Monitoring**: Set up logging and monitoring for the push notification system
5. **Rate Limiting**: Consider implementing rate limiting for push notifications

## 📈 Advanced Features

- **Notification Preferences**: Allow users to choose which types of notifications to receive
- **Scheduled Notifications**: Implement time-based notification scheduling
- **Rich Notifications**: Add images, buttons, and other rich content to notifications
- **Analytics**: Track notification delivery rates and user engagement
- **Fallback Systems**: Implement email fallbacks for users without push enabled

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Test with the notification debug page in your app
4. Check Supabase logs for any database errors
5. Ensure your domain has a valid HTTPS certificate

## 📝 Example Notification Flow

```
1. User opens app → Service worker registers
2. User enables notifications → Push subscription created
3. System creates notification → Saved to database with push_sent: false
4. Backend script runs → Finds pending notifications
5. Script sends push → Updates push_sent: true
6. User receives notification → Can click to open app
```

---

**🎉 Congratulations!** You now have a complete push notification system that works across desktop and mobile devices!

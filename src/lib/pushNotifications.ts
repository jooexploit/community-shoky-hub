import { supabase } from './supabase';

// Public VAPID key - you'll need to generate this
export const VAPID_PUBLIC_KEY = 'BAnoQ8Zb5OZjorvIS_qOylBu4V2-x91VeDo9IPIxRpCUY5QSNLI6EMdBdVgBz7sYXWdChVB14t8_QICZu7qD4FU';

export class PushNotificationService {
  private static instance: PushNotificationService;
  
  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('This browser does not support service workers');
    }

    return await Notification.requestPermission();
  }

  async getSubscription(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  }

  async subscribe(): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save subscription to Supabase
      await this.saveSubscription(subscription);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscriptionData = subscription.toJSON();
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint!,
          p256dh: subscriptionData.keys!.p256dh,
          auth: subscriptionData.keys!.auth,
          user_agent: navigator.userAgent,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error('Error saving push subscription:', error);
      }
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }
  async unsubscribe(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (subscription) {
        // Remove from Supabase
        await this.removeSubscription(subscription);
        // Unsubscribe from browser
        await subscription.unsubscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async removeSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscriptionData = subscription.toJSON();
      
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('endpoint', subscriptionData.endpoint);

      if (error) {
        console.error('Error removing push subscription:', error);
      }
    } catch (error) {
      console.error('Error removing push subscription:', error);
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      return subscription !== null;
    } catch {
      return false;
    }
  }

  async initializePushNotifications(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        await navigator.serviceWorker.ready;
        
        // Check if already subscribed
        const existingSubscription = await this.getSubscription();
        if (existingSubscription) {
          // Update subscription in database to ensure it's current
          await this.saveSubscription(existingSubscription);
        }
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  showLocalNotification(title: string, options: NotificationOptions = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();

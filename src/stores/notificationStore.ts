import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { pushNotificationService } from '../lib/pushNotifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'task' | 'content' | 'event' | 'general' | 'announcement'
  sender_id?: string
  recipient_id: string
  is_read: boolean
  is_system_generated: boolean
  metadata: Record<string, unknown>
  created_at: string
  read_at?: string
  sender?: {
    full_name: string
    avatar_url?: string
  }
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  pushSubscribed: boolean
  subscription: RealtimeChannel | null // Store the active subscription
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  subscribeToNotifications: (userId: string) => () => void
  sendNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'read_at'>) => Promise<void>
  sendManualNotification: (notification: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    category: string
    recipientIds?: string[]
  }) => Promise<void>
  subscribeToPush: () => Promise<void>
  unsubscribeFromPush: () => Promise<void>
  checkPushSubscription: () => Promise<void>
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pushSubscribed: false,
  subscription: null,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const notifications = data || []
      const unreadCount = notifications.filter(n => !n.is_read).length

      set({ notifications, unreadCount })
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)

      if (error) throw error

      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      set(state => ({
        notifications: state.notifications.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        })),
        unreadCount: 0
      }))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId)
        const wasUnread = notification && !notification.is_read
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        }
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  },
  subscribeToNotifications: (userId: string) => {
    const state = get();
    
    // If already subscribed, return the existing unsubscribe function
    if (state.subscription) {
      return () => {
        const currentState = get();        if (currentState.subscription) {
          currentState.subscription.unsubscribe();
          set({ subscription: null });
        }
      };
    }

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },        (payload) => {
          const newNotification = payload.new as Notification
          console.log('Real-time notification received:', newNotification)
          set(state => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          set(state => ({
            notifications: state.notifications.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            ),
            unreadCount: state.notifications.filter(n => 
              n.id !== updatedNotification.id && !n.is_read
            ).length + (updatedNotification.is_read ? 0 : 1)
          }))
        }
      )
      .subscribe()

    // Store the subscription
    set({ subscription });

    return () => {
      subscription.unsubscribe();
      set({ subscription: null });
    };
  },
  sendNotification: async (notification) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notification)

      if (error) throw error
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  },

  sendManualNotification: async (notification) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get all users if no specific recipients
      let recipientIds = notification.recipientIds
      if (!recipientIds || recipientIds.length === 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id')
        recipientIds = users?.map(u => u.id) || []
      }

      // Send notification to each recipient
      const notifications = recipientIds.map(recipientId => ({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        sender_id: user.id,
        recipient_id: recipientId,
        is_system_generated: false,
        metadata: {}
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) throw error

    } catch (error) {
      console.error('Error sending manual notification:', error)
      throw error
    }
  },

  checkPushSubscription: async () => {
    try {
      const isSubscribed = await pushNotificationService.isSubscribed()
      set({ pushSubscribed: isSubscribed })
    } catch (error) {
      console.error('Error checking push subscription:', error)
      set({ pushSubscribed: false })
    }
  },

  subscribeToPush: async () => {
    try {
      const subscription = await pushNotificationService.subscribe()
      if (subscription) {
        set({ pushSubscribed: true })
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      throw error
    }
  },

  unsubscribeFromPush: async () => {
    try {
      const success = await pushNotificationService.unsubscribe()
      if (success) {
        set({ pushSubscribed: false })
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      throw error
    }
  }
}))

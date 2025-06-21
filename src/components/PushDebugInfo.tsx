import { useState, useEffect } from 'react'
import { pushNotificationService } from '../lib/pushNotifications'
import { supabase } from '../lib/supabase'

export function PushDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getDebugInfo = async () => {
      try {
        const info: any = {}
        
        // Check browser support
        info.browserSupport = {
          serviceWorker: 'serviceWorker' in navigator,
          pushManager: 'PushManager' in window,
          notification: 'Notification' in window
        }
        
        // Check notification permission
        info.notificationPermission = Notification.permission
        
        // Check service worker registration
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          info.serviceWorkerRegistered = !!registration
          if (registration) {
            info.serviceWorkerScope = registration.scope
            info.serviceWorkerActive = !!registration.active
          }
        }
        
        // Check push subscription
        try {
          const subscription = await pushNotificationService.getSubscription()
          info.pushSubscribed = !!subscription
          if (subscription) {
            info.pushEndpoint = subscription.endpoint
          }
        } catch (e) {
          info.pushSubscriptionError = e.message
        }
        
        // Check user auth
        const { data: { user } } = await supabase.auth.getUser()
        info.userAuthenticated = !!user
        if (user) {
          info.userId = user.id
        }
        
        // Check database subscriptions
        if (user) {
          const { data: dbSubscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
          
          info.databaseSubscriptions = dbSubscriptions?.length || 0
        }
        
        setDebugInfo(info)
      } catch (error) {
        setDebugInfo({ error: error.message })
      } finally {
        setIsLoading(false)
      }
    }
    
    getDebugInfo()
  }, [])

  if (isLoading) {
    return <div>Loading debug info...</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        🐛 Push Notification Debug Info
      </h3>
      
      <div className="space-y-4">
        <div className="text-sm">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Browser Support</h4>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div>Service Worker: {debugInfo.browserSupport?.serviceWorker ? '✅' : '❌'}</div>
            <div>Push Manager: {debugInfo.browserSupport?.pushManager ? '✅' : '❌'}</div>
            <div>Notification API: {debugInfo.browserSupport?.notification ? '✅' : '❌'}</div>
          </div>
        </div>

        <div className="text-sm">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Permissions & Registration</h4>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div>Notification Permission: <span className={`font-medium ${debugInfo.notificationPermission === 'granted' ? 'text-green-600' : 'text-red-600'}`}>{debugInfo.notificationPermission}</span></div>
            <div>Service Worker Registered: {debugInfo.serviceWorkerRegistered ? '✅' : '❌'}</div>
            <div>Service Worker Active: {debugInfo.serviceWorkerActive ? '✅' : '❌'}</div>
            {debugInfo.serviceWorkerScope && <div>SW Scope: {debugInfo.serviceWorkerScope}</div>}
          </div>
        </div>

        <div className="text-sm">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Push Subscription</h4>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div>Push Subscribed: {debugInfo.pushSubscribed ? '✅' : '❌'}</div>
            {debugInfo.pushEndpoint && <div>Endpoint: {debugInfo.pushEndpoint.substring(0, 50)}...</div>}
            {debugInfo.pushSubscriptionError && <div className="text-red-600">Error: {debugInfo.pushSubscriptionError}</div>}
          </div>
        </div>

        <div className="text-sm">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Database</h4>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div>User Authenticated: {debugInfo.userAuthenticated ? '✅' : '❌'}</div>
            {debugInfo.userId && <div>User ID: {debugInfo.userId.substring(0, 8)}...</div>}
            <div>DB Subscriptions: {debugInfo.databaseSubscriptions || 0}</div>
          </div>
        </div>

        {debugInfo.error && (
          <div className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
            <div className="text-red-800 dark:text-red-200 font-medium">Error:</div>
            <div className="text-red-600 dark:text-red-400">{debugInfo.error}</div>
          </div>
        )}
      </div>
    </div>
  )
}

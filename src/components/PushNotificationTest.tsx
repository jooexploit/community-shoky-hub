import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function PushNotificationTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const testBrowserNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Test Browser Notification', {
        body: 'This is a direct browser notification test',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
      setResult('✅ Direct browser notification sent!')
    } else {
      setResult('❌ Notification permission not granted')
    }
  }

  const testPushNotification = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Create a test notification
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setResult('❌ Not logged in')
        return
      }

      // Insert a test notification
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: 'Test Push Notification',
          message: 'This is a test push notification from your app!',
          type: 'info',
          category: 'general',
          recipient_id: user.id,
          is_system_generated: false,
          metadata: { test: true }
        })
        .select()
        .single()

      if (error) throw error

      setResult(`✅ Test notification created: ${data.id}`)      // Wait a moment, then trigger the edge function
      setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.access_token) {
            setResult(prev => prev + '\n❌ No session token found')
            return
          }

          const response = await fetch('https://wlkalaoysgrnkzepcanp.supabase.co/functions/v1/send-push-notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': session.access_token
            },
            body: JSON.stringify({
              trigger: 'manual_test',
              timestamp: Date.now()
            })
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }          const result = await response.json()
          setResult(prev => prev + `\n📧 Push function result: ${JSON.stringify(result, null, 2)}`)
          
          // Add more detailed analysis
          if (result.sent && result.sent > 0) {
            setResult(prev => prev + `\n✅ Success! ${result.sent} push notification(s) sent`)
          } else if (result.total === 0) {
            setResult(prev => prev + `\n⚠️ No pending notifications found to send`)
          } else {
            setResult(prev => prev + `\n⚠️ Notifications found but none sent. Check logs.`)
          }
        } catch (funcError: unknown) {
          const error = funcError as Error
          setResult(prev => prev + `\n❌ Push function error: ${error.message}`)
        }
      }, 2000)

    } catch (error: unknown) {
      const err = error as Error
      setResult(`❌ Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        🔔 Push Notification Test
      </h3>
      
      <div className="space-y-4">        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test different types of notifications. With the latest update, notifications should now be sent automatically when created!
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={testBrowserNotification}
            className="px-4 py-2 rounded-md text-white font-medium bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500"
          >
            Test Browser Notification
          </button>
          
          <button
            onClick={testPushNotification}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-md text-white font-medium
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              }
            `}
          >
            {isLoading ? 'Testing...' : 'Test Full Push System'}
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <h4 className="font-medium mb-2">Troubleshooting:</h4>
          <ul className="space-y-1">
            <li>• Make sure you've enabled push notifications in the Settings tab</li>
            <li>• Check browser console for any errors</li>
            <li>• Ensure your browser supports push notifications</li>
            <li>• Check if notification permission is granted</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

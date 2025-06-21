import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function DatabaseDebug() {
  const [dbState, setDbState] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkDatabase = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setDbState({ error: 'Not authenticated' })
        return
      }

      // Check recent notifications
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, title, message, push_sent, push_sent_at, created_at')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (notifError) throw notifError

      // Check push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, is_active, created_at')
        .eq('user_id', user.id)

      if (subError) throw subError

      setDbState({
        notifications: notifications || [],
        subscriptions: subscriptions || [],
        user_id: user.id
      })

    } catch (error: any) {
      setDbState({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        🔍 Database Debug
      </h3>
      
      <button
        onClick={checkDatabase}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Checking...' : 'Check Database State'}
      </button>

      {dbState && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto max-h-96">
            {JSON.stringify(dbState, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>This shows:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Recent notifications and their push_sent status</li>
          <li>Your push subscriptions in the database</li>
          <li>Any database errors</li>
        </ul>
      </div>
    </div>
  )
}

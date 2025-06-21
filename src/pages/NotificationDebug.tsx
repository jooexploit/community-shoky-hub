import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function NotificationDebug() {
  const { profile } = useAuthStore()
  const [notifications, setNotifications] = useState<unknown[]>([])
  const [users, setUsers] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all notifications
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (notifError) throw notifError

      // Fetch all users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .limit(5)

      if (userError) throw userError

      setNotifications(notifData || [])
      setUsers(userData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotification = async () => {
    if (!profile?.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: 'Manual Test Notification',
          message: 'This is a direct database insert test',
          type: 'info',
          category: 'general',
          sender_id: profile.id,
          recipient_id: profile.id,
          is_system_generated: false,
          metadata: {}
        })

      if (error) throw error
      
      alert('Test notification inserted directly into database')
      fetchData()
    } catch (error) {
      console.error('Error inserting notification:', error)
      alert('Failed to insert notification')
    }
  }

  const testContentCreation = async () => {
    try {
      const { error } = await supabase
        .from('content_plans')
        .insert({
          title: 'Test Content for Notifications',
          content: 'This is test content to trigger notification',
          status: 'draft',
          created_by: profile?.id
        })

      if (error) throw error
      
      alert('Test content created - check for automatic notification')
      setTimeout(fetchData, 2000) // Wait 2 seconds then refresh
    } catch (error) {
      console.error('Error creating content:', error)
      alert('Failed to create content')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Notification System Debug</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Test Controls</h3>
          <div className="space-y-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
            
            <button
              onClick={sendTestNotification}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Insert Test Notification
            </button>
            
            <button
              onClick={testContentCreation}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Create Test Content (Trigger)
            </button>
          </div>
        </div>

        {/* Current User Info */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Current User</h3>
          {profile ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {profile.id}</p>
              <p><strong>Name:</strong> {profile.full_name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Role:</strong> {profile.role}</p>
            </div>
          ) : (
            <p>No user logged in</p>
          )}
        </div>
      </div>

      {/* All Notifications */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">All Notifications ({notifications.length})</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications found</p>
          ) : (            notifications.map((notification: any) => (
              <div key={notification.id} className="p-3 border border-gray-200 rounded">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Title:</strong> {notification.title}</div>
                  <div><strong>Type:</strong> {notification.type}</div>
                  <div><strong>Category:</strong> {notification.category}</div>
                  <div><strong>Read:</strong> {notification.is_read ? 'Yes' : 'No'}</div>
                  <div><strong>Sender ID:</strong> {notification.sender_id || 'None'}</div>
                  <div><strong>Recipient ID:</strong> {notification.recipient_id}</div>
                  <div className="col-span-2"><strong>Message:</strong> {notification.message}</div>
                  <div className="col-span-2"><strong>Created:</strong> {new Date(notification.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* All Users */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Users ({users.length})</h3>
        <div className="space-y-2">          {users.map((user: any) => (
            <div key={user.id} className="p-2 border border-gray-200 rounded">
              <div className="text-sm">
                <strong>{user.full_name}</strong> ({user.email}) - {user.role}
                <br />
                <span className="text-gray-500 text-xs">ID: {user.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

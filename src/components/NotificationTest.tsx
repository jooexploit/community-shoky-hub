import { useState } from 'react'
import { useNotificationStore } from '../stores/notificationStore'
import { useAuthStore } from '../stores/authStore'

export default function NotificationTest() {
  const { sendManualNotification, notifications, fetchNotifications } = useNotificationStore()
  const { profile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const sendTestNotification = async () => {
    if (!profile?.id) return
    
    setIsLoading(true)
    try {
      await sendManualNotification({
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working',
        type: 'info',
        category: 'general',
        recipientIds: [profile.id] // Send to self for testing
      })
      
      // Fetch notifications after sending
      setTimeout(() => {
        fetchNotifications()
      }, 1000)
      
      alert('Test notification sent!')
    } catch (error) {
      console.error('Error sending test notification:', error)
      alert('Failed to send test notification')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Notification System Test</h3>
      
      <div className="space-y-4">
        <button
          onClick={sendTestNotification}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Test Notification'}
        </button>
        
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-2"
        >
          Refresh Notifications
        </button>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Current Notifications ({notifications.length}):</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-gray-500">No notifications found</p>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{notification.title}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {notification.type}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {notification.category}
                        </span>
                        {!notification.is_read && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

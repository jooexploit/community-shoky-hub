import { useState, useEffect } from 'react'
import { useNotificationStore } from '../stores/notificationStore'
import { useAuthStore } from '../stores/authStore'

export default function AutoNotificationTest() {
  const { sendManualNotification } = useNotificationStore()
  const { profile } = useAuthStore()
  const [isAutoSending, setIsAutoSending] = useState(false)
  const [counter, setCounter] = useState(1)

  useEffect(() => {
    if (!isAutoSending || !profile?.id) return

    const interval = setInterval(async () => {
      try {
        await sendManualNotification({
          title: `Auto Test Notification #${counter}`,
          message: `This is automatic notification number ${counter} to test real-time toasts`,
          type: counter % 4 === 0 ? 'error' : counter % 3 === 0 ? 'warning' : counter % 2 === 0 ? 'success' : 'info',
          category: 'general',
          recipientIds: [profile.id]
        })
        setCounter(prev => prev + 1)
        console.log(`Sent auto notification #${counter}`)
      } catch (error) {
        console.error('Error sending auto notification:', error)
      }
    }, 3000) // Send every 3 seconds

    return () => clearInterval(interval)
  }, [isAutoSending, profile?.id, sendManualNotification, counter])

  const sendSingleTest = async () => {
    if (!profile?.id) return
    
    try {
      await sendManualNotification({
        title: 'Manual Test Notification',
        message: 'This notification should appear immediately as a toast!',
        type: 'info',
        category: 'general',
        recipientIds: [profile.id]
      })
      console.log('Sent manual test notification')
    } catch (error) {
      console.error('Error sending manual notification:', error)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Auto Notification Test</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Test the real-time notification toast system. Notifications should appear automatically without clicking anything!
      </p>
      
      <div className="space-y-4">
        <button
          onClick={sendSingleTest}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Send Single Test Notification
        </button>
        
        <button
          onClick={() => setIsAutoSending(!isAutoSending)}
          className={`px-4 py-2 rounded-lg text-white ${
            isAutoSending 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isAutoSending ? 'Stop Auto Notifications' : 'Start Auto Notifications (Every 3s)'}
        </button>
        
        {isAutoSending && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Auto notifications are running... (Counter: {counter})
          </p>
        )}
      </div>
    </div>
  )
}

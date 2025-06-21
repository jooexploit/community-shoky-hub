import { useState, useEffect } from 'react'
import { useNotificationStore } from '../../stores/notificationStore'
import LoadingSpinner from '../ui/LoadingSpinner'

export function NotificationSettings() {
  const { 
    pushSubscribed, 
    subscribeToPush, 
    unsubscribeFromPush, 
    checkPushSubscription 
  } = useNotificationStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    checkPushSubscription()
  }, [checkPushSubscription])

  const handlePushToggle = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (pushSubscribed) {
        await unsubscribeFromPush()
        setSuccess('Push notifications disabled successfully')
      } else {
        await subscribeToPush()
        setSuccess('Push notifications enabled successfully')
      }    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Failed to update push notification settings')
    } finally {
      setIsLoading(false)
    }
  }

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Push Notifications Not Supported
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Your browser doesn't support push notifications. Please try using a modern browser like Chrome, Firefox, or Safari.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Push Notifications
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            Receive notifications on your device even when you're not on the website.
          </p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-4 h-4 rounded-full ${pushSubscribed ? 'bg-green-400' : 'bg-gray-300'}`}></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  Push notifications are {pushSubscribed ? 'enabled' : 'disabled'}
                </p>
                <p className="text-sm text-gray-500">
                  {pushSubscribed 
                    ? 'You will receive notifications on this device'
                    : 'Enable to receive notifications on this device'
                  }
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handlePushToggle}
              disabled={isLoading}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${pushSubscribed ? 'bg-blue-600' : 'bg-gray-200'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="sr-only">Toggle push notifications</span>
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${pushSubscribed ? 'translate-x-5' : 'translate-x-0'}
                `}
              >
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="text-sm text-gray-600">
            <h4 className="font-medium text-gray-900 mb-2">About Push Notifications</h4>
            <ul className="space-y-1 text-xs">
              <li>• Notifications will appear even when the browser is closed</li>
              <li>• You can manage notification permissions in your browser settings</li>
              <li>• Push notifications work on desktop and mobile devices</li>
              <li>• You can disable this at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

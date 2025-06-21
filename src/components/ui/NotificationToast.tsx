import { useState, useEffect, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useNotificationStore } from '../../stores/notificationStore'

interface ToastNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
}

export function NotificationToast() {
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const { notifications } = useNotificationStore()
  const previousNotificationsRef = useRef<string[]>([])
  const shownToastsRef = useRef<Set<string>>(new Set())
  // Watch for new notifications and show them as toasts
  useEffect(() => {
    console.log('Notifications updated:', notifications.length, 'notifications')
    console.log('Current notifications:', notifications.map(n => ({ id: n.id, title: n.title, is_read: n.is_read })))
    
    if (notifications.length === 0) {
      console.log('No notifications to process')
      return
    }    // Get current notification IDs
    const currentNotificationIds = notifications.map(n => n.id)
    
    // Find truly new notifications (not present in previous render)
    const newNotificationIds = currentNotificationIds.filter(id => 
      !previousNotificationsRef.current.includes(id)
    )

    console.log('Previous notification IDs:', previousNotificationsRef.current)
    console.log('Current notification IDs:', currentNotificationIds)
    console.log('New notification IDs:', newNotificationIds)

    // Get the actual new notification objects
    const newNotifications = notifications.filter(notification => 
      newNotificationIds.includes(notification.id) && 
      !notification.is_read &&
      !shownToastsRef.current.has(notification.id)
    )

    console.log('New notifications to show as toasts:', newNotifications)    // Create toasts for new notifications
    newNotifications.forEach(notification => {
      console.log('Creating toast for notification:', notification.title)
      
      // Mark this notification as shown
      shownToastsRef.current.add(notification.id)

      const toast: ToastNotification = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: Date.now()
      }

      setToasts(prev => {
        // Avoid duplicates
        if (prev.find(t => t.id === toast.id)) {
          console.log('Toast already exists for notification:', notification.id)
          return prev
        }
        console.log('Adding new toast:', toast.title)
        return [...prev, toast]
      })      // Play notification sound
      try {        // Create different sound frequencies for different notification types
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioContext = new AudioContextClass()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Different frequencies for different types
        const frequency = notification.type === 'success' ? 800 : notification.type === 'error' ? 400 : notification.type === 'warning' ? 600 : 500
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch {
        // Fallback to simple beep if Web Audio API fails
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUdBjeF0vHNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUdBjeF0vHNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUdBjeF0vHNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUdBjeF0vHNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUdBg==')
          audio.volume = 0.2
          audio.play().catch(() => {})        } catch {
          // Ignore all audio errors
        }
      }

      // Add haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        // Different vibration patterns for different types
        const pattern = notification.type === 'error' ? [200, 100, 200] : 
                       notification.type === 'warning' ? [150, 50, 150] :
                       notification.type === 'success' ? [100, 50, 100, 50, 100] : [150]
        navigator.vibrate(pattern)
      }

      // Auto-remove after 6 seconds
      setTimeout(() => {
        console.log('Removing toast for notification:', notification.id)
        setToasts(prev => prev.filter(t => t.id !== toast.id))
        // Clean up shown toasts reference after longer delay
        setTimeout(() => {
          shownToastsRef.current.delete(notification.id)
        }, 30000) // Clean up after 30 seconds
      }, 6000)
    })

    // Update previous notifications reference
    previousNotificationsRef.current = currentNotificationIds
  }, [notifications])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />
      default:
        return <Info className="w-6 h-6 text-blue-500" />
    }
  }

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg shadow-green-200/40 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-700 dark:shadow-green-900/20'
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-lg shadow-red-200/40 dark:from-red-900/30 dark:to-rose-900/30 dark:border-red-700 dark:shadow-red-900/20'
      case 'warning':
        return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-lg shadow-amber-200/40 dark:from-amber-900/30 dark:to-yellow-900/30 dark:border-amber-700 dark:shadow-amber-900/20'
      default:
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg shadow-blue-200/40 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-700 dark:shadow-blue-900/20'
    }
  }
  const getProgressBarColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-400 to-emerald-500'
      case 'error':
        return 'bg-gradient-to-r from-red-400 to-rose-500'
      case 'warning':
        return 'bg-gradient-to-r from-amber-400 to-yellow-500'
      default:
        return 'bg-gradient-to-r from-blue-400 to-indigo-500'
    }
  }

  if (toasts.length === 0) return null
  
  return (
    <div className="fixed top-4 left-4 right-4 sm:top-20 sm:left-auto sm:right-4 sm:max-w-sm md:max-w-md z-[9999] space-y-3 px-0 sm:px-0">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`
            notification-toast
            relative overflow-hidden backdrop-blur-sm rounded-2xl pointer-events-auto border
            ${getToastStyles(toast.type)}
            transform transition-all duration-500 ease-out
            hover:scale-[1.02] hover:shadow-2xl
            animate-in slide-in-from-right-8 fade-in zoom-in-95
            w-full
          `}
          style={{
            animationDelay: `${index * 100}ms`,
            animationDuration: '600ms',
            animationFillMode: 'both'
          }}
        >          {/* Progress bar */}
          <div className="absolute top-0 left-0 h-1 w-full bg-gray-200 dark:bg-gray-700">
            <div 
              className={`h-full ${getProgressBarColor(toast.type)}`}
              style={{
                width: '100%',
                animation: 'progress-shrink 6s linear forwards'
              }}
            />
          </div>          {/* Main content */}
          <div className="relative p-3 sm:p-4 md:p-5">
            <div className="flex items-start gap-2 sm:gap-3">
              {/* Icon with pulse animation */}
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 rounded-full opacity-20 animate-ping bg-current" />
                <div className="relative z-10 p-1 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  {getIcon(toast.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base sm:text-lg">🔔</span>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                    {toast.title}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed break-words">
                  {toast.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    Just now
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400">Live</span>
                  </div>
                </div>
              </div>              {/* Close button */}
              <button
                className="flex-shrink-0 p-2 sm:p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group touch-manipulation"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                <X className="h-4 w-4 sm:h-4 sm:w-4 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          </div>{/* Glowing effect */}
          <div className="absolute inset-0 rounded-2xl opacity-30 animate-pulse pointer-events-none" />
        </div>
      ))}
    </div>
  )
}

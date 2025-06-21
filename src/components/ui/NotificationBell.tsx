import React, { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Trash2, Clock, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { useNotificationStore, Notification } from '../../stores/notificationStore'
import { useAuthStore } from '../../stores/authStore'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotificationStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'task':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'content':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'event':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'announcement':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              getIcon={getNotificationIcon}
              getCategoryColor={getCategoryColor}
              formatTimeAgo={formatTimeAgo}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  getIcon: (type: string) => React.ReactNode
  getCategoryColor: (category: string) => string
  formatTimeAgo: (date: string) => string
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  getIcon,
  getCategoryColor,
  formatTimeAgo
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {notification.title}
            </h4>
            <div className="flex items-center space-x-1">
              <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(notification.category)}`}>
                {notification.category}
              </span>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(notification.created_at)}</span>
              {notification.sender && (
                <span>• by {notification.sender.full_name}</span>
              )}
            </div>
            
            {isHovered && (
              <div className="flex items-center space-x-1">
                {!notification.is_read && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="p-1 text-gray-400 hover:text-blue-500"
                    title="Mark as read"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(notification.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Delete notification"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount, subscribeToNotifications, fetchNotifications } = useNotificationStore()
  const { profile } = useAuthStore()

  useEffect(() => {
    if (profile?.id) {
      // Fetch notifications immediately
      fetchNotifications()
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToNotifications(profile.id)
      return unsubscribe
    }
  }, [profile?.id, subscribeToNotifications, fetchNotifications])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  )
}

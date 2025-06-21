import { useState, useEffect } from 'react'
import { Send, Users, User, Bell, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useNotificationStore } from '../stores/notificationStore'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

export default function NotificationManagement() {
  const { sendManualNotification } = useNotificationStore()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    category: 'announcement'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSendNotification = async () => {
    if (!notification.title.trim() || !notification.message.trim()) {
      alert('Please fill in both title and message')
      return
    }

    setIsLoading(true)
    try {
      await sendManualNotification({
        ...notification,
        recipientIds: selectedUsers.length > 0 ? selectedUsers : undefined
      })
      
      setSuccess(true)
      setNotification({
        title: '',
        message: '',
        type: 'info',
        category: 'announcement'
      })
      setSelectedUsers([])
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Failed to send notification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setSelectedUsers(users.map(user => user.id))
  }

  const clearSelection = () => {
    setSelectedUsers([])
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Bell className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Notification Management
        </h1>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-800">Notification sent successfully!</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create Notification
          </h2>

          <div className="space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['info', 'success', 'warning', 'error'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setNotification(prev => ({ ...prev, type }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      notification.type === type
                        ? getTypeColor(type) + ' border-current'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(type)}
                      <span className="text-sm font-medium capitalize">{type}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={notification.category}
                onChange={(e) => setNotification(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="announcement">Announcement</option>
                <option value="general">General</option>
                <option value="task">Task</option>
                <option value="content">Content</option>
                <option value="event">Event</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter notification title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={notification.message}
                onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter notification message..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Preview */}
            {notification.title && notification.message && (
              <div className={`p-4 rounded-lg border-2 ${getTypeColor(notification.type)}`}>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Preview:</h4>
                <div className="flex items-start space-x-3">
                  {getTypeIcon(notification.type)}
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{notification.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full mt-2">
                      {notification.category}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recipients
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllUsers}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
              >
                <Users className="w-4 h-4 inline mr-1" />
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedUsers.length === 0 
                ? 'No specific recipients selected. Notification will be sent to all users.'
                : `Selected ${selectedUsers.length} recipient(s)`
              }
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {users.map(user => (
              <div
                key={user.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedUsers.includes(user.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleUserSelection(user.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email} • {user.role}
                    </p>
                  </div>
                  {selectedUsers.includes(user.id) && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSendNotification}
          disabled={isLoading || !notification.title.trim() || !notification.message.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Notification</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

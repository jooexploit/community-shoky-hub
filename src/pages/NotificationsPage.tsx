import React, { useState, useEffect } from 'react'
import { 
  Send, 
  MessageSquare, 
  Search,
  User,
  Calendar,
  CheckSquare,
  FileText,
  Megaphone,
  Plus,
  X
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url?: string
}

interface NotificationTemplate {
  id: string
  name: string
  title_template: string
  message_template: string
  type: string
  category: string
  is_active: boolean
}

interface SendNotificationForm {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'general' | 'announcement' | 'task' | 'content' | 'event'
  recipients: string[]
  sendToAll: boolean
}

const NotificationsPage: React.FC = () => {
  const { profile } = useAuthStore()
  const { sendNotification } = useNotificationStore()
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  
  const [form, setForm] = useState<SendNotificationForm>({
    title: '',
    message: '',
    type: 'info',
    category: 'general',
    recipients: [],
    sendToAll: false
  })

  useEffect(() => {
    fetchUsers()
    fetchTemplates()
  }, [])
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, avatar_url')
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const handleSendNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (!form.sendToAll && form.recipients.length === 0) {
      alert('Please select recipients or choose to send to all users')
      return
    }

    setIsSending(true)
    try {
      const recipients = form.sendToAll ? users.map(u => u.id) : form.recipients

      // Send notification to each recipient
      for (const recipientId of recipients) {
        await sendNotification({
          title: form.title,
          message: form.message,
          type: form.type,
          category: form.category,
          sender_id: profile?.id,
          recipient_id: recipientId,
          is_system_generated: false,
          metadata: {
            sent_via: 'admin_panel',
            sent_at: new Date().toISOString()
          }
        })
      }

      // Reset form
      setForm({
        title: '',
        message: '',
        type: 'info',
        category: 'general',
        recipients: [],
        sendToAll: false
      })
      setShowForm(false)
      
      alert(`Notification sent successfully to ${recipients.length} user(s)!`)
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Failed to send notification. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const toggleRecipient = (userId: string) => {
    setForm(prev => ({
      ...prev,
      recipients: prev.recipients.includes(userId)
        ? prev.recipients.filter(id => id !== userId)
        : [...prev.recipients, userId]
    }))
  }

  const selectAllUsers = () => {
    setForm(prev => ({
      ...prev,
      recipients: filteredUsers.map(u => u.id),
      sendToAll: false
    }))
  }

  const clearSelection = () => {
    setForm(prev => ({
      ...prev,
      recipients: [],
      sendToAll: false
    }))
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'task':
        return <CheckSquare className="w-4 h-4" />
      case 'content':
        return <FileText className="w-4 h-4" />
      case 'event':
        return <Calendar className="w-4 h-4" />
      case 'announcement':
        return <Megaphone className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Send notifications to users and manage notification templates
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Cancel' : 'Send Notification'}</span>
        </button>
      </div>

      {/* Send Notification Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Send New Notification
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notification message"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as 'info' | 'success' | 'warning' | 'error' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as 'general' | 'announcement' | 'task' | 'content' | 'event' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="announcement">Announcement</option>
                    <option value="task">Task</option>
                    <option value="content">Content</option>
                    <option value="event">Event</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.sendToAll}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      sendToAll: e.target.checked,
                      recipients: e.target.checked ? [] : prev.recipients
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Send to all users
                  </span>
                </label>
              </div>
            </div>

            {/* Recipients Selection */}
            {!form.sendToAll && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recipients ({form.recipients.length} selected)
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllUsers}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-xs text-gray-600 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="flex space-x-2 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="hr_admin">HR Admin</option>
                    <option value="social_media_admin">Social Media Admin</option>
                    <option value="developer">Developer</option>
                    <option value="user">User</option>
                  </select>
                </div>

                {/* Users List */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={form.recipients.includes(user.id)}
                        onChange={() => toggleRecipient(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.full_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email} • {user.role}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSendNotification}
              disabled={isSending}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <LoadingSpinner />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSending ? 'Sending...' : 'Send Notification'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Notification Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Automated Notification Templates
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            These templates are used for automatic notifications when tasks, content, or events are created/updated
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(template.category)}
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {template.name.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(template.type)}`}>
                      {template.type}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                      {template.category}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <strong>Title:</strong> {template.title_template}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Message:</strong> {template.message_template}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage

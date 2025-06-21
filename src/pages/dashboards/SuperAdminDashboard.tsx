import { useState, useEffect } from 'react'
import { 
  Users, 
  CheckSquare, 
  FileText, 
  BarChart3, 
  Crown, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Activity,
  RefreshCw,
  UserPlus,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bell,
  Settings
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import AddUserModal from '../../components/modals/AddUserModal'
import AddTaskModal from '../../components/modals/AddTaskModal'
import UserDetailsModal from '../../components/modals/UserDetailsModal'
import NotificationManagement from '../NotificationManagement'
import NotificationTest from '../../components/NotificationTest'
import AutoNotificationTest from '../../components/AutoNotificationTest'
import { NotificationSettings } from '../../components/settings/NotificationSettings'
import { PushNotificationTest } from '../../components/PushNotificationTest'
import { PushDebugInfo } from '../../components/PushDebugInfo'
import { DatabaseDebug } from '../../components/DatabaseDebug'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalTasks: number
  completedTasks: number
  pendingContent: number
  recentActivity: number
}

interface ActivityLog {
  id: string
  user_id: string
  action: string
  details: Record<string, unknown>
  created_at: string
  user?: {
    full_name: string
    avatar_url?: string
  }
}

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string
  due_date?: string
  assignee?: {
    full_name: string
  }
}

interface ContentPlan {
  id: string
  title: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  created_by: string
  scheduled_date?: string
  creator?: {
    full_name: string
  }
}

interface User {
  id: string
  full_name: string
  email: string
  role: 'super_admin' | 'hr_admin' | 'social_media_admin' | 'developer'
  is_active: boolean
  last_login?: string
  created_at: string
}

export default function SuperAdminDashboard() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingContent: 0,
    recentActivity: 0
  })
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [pendingContent, setPendingContent] = useState<ContentPlan[]>([])
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tasks' | 'content' | 'notifications' | 'settings'>('overview')

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [
        usersResponse,
        tasksResponse,
        contentResponse,
        activityResponse
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('tasks').select(`
          *,
          assignee:assigned_to(full_name)
        `),
        supabase.from('content_plans').select(`
          *,
          creator:created_by(full_name)
        `),
        supabase.from('activity_logs').select(`
          *,
          user:user_id(full_name, avatar_url)
        `).order('created_at', { ascending: false }).limit(10)
      ])

      if (usersResponse.error) throw usersResponse.error
      if (tasksResponse.error) throw tasksResponse.error
      if (contentResponse.error) throw contentResponse.error
      if (activityResponse.error) throw activityResponse.error

      const users = usersResponse.data || []
      const tasks = tasksResponse.data || []
      const content = contentResponse.data || []
      const activities = activityResponse.data || []

      // Calculate stats
      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active).length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
        pendingContent: content.filter(c => c.status === 'pending_approval').length,
        recentActivity: activities.length
      })

      setRecentActivities(activities)
      setRecentTasks(tasks.slice(0, 5))
      setPendingContent(content.filter(c => c.status === 'pending_approval').slice(0, 5))
      setRecentUsers(users.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchDashboardData()
    }
  }, [profile])

  const handleApproveContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content_plans')
        .update({ 
          status: 'approved',
          approved_by: profile?.id
        })
        .eq('id', contentId)

      if (error) throw error
      
      // Refresh data
      fetchDashboardData()
    } catch (err) {
      console.error('Error approving content:', err)
    }
  }

  const handleRejectContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content_plans')
        .update({ 
          status: 'rejected',
          approved_by: profile?.id
        })
        .eq('id', contentId)

      if (error) throw error
      
      // Refresh data
      fetchDashboardData()
    } catch (err) {
      console.error('Error rejecting content:', err)
    }
  }

  // Modal handlers
  const handleAddUser = () => {
    setIsAddUserModalOpen(true)
  }

  const handleAddTask = () => {
    setIsAddTaskModalOpen(true)
  }

  const handleViewUser = (user: User) => {
    setSelectedUserId(user.id)
    setIsUserDetailsModalOpen(true)
  }

  const handleUserAdded = () => {
    setIsAddUserModalOpen(false)
    fetchDashboardData() // Refresh data
  }

  const handleTaskAdded = () => {
    setIsAddTaskModalOpen(false)
    fetchDashboardData() // Refresh data
  }

  const handleContentTab = () => {
    setActiveTab('content')
  }

  const handleReportsTab = () => {
    // For now, just show analytics in content tab
    setActiveTab('content')
  }

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const dashboardStats = [
    { 
      name: 'Total Users', 
      value: stats.totalUsers.toString(), 
      icon: Users, 
      color: 'bg-blue-500', 
      change: `${stats.activeUsers} active`,
      trend: 'up'
    },
    { 
      name: 'Active Tasks', 
      value: stats.totalTasks.toString(), 
      icon: CheckSquare, 
      color: 'bg-green-500', 
      change: `${stats.completedTasks} completed`,
      trend: 'up'
    },
    { 
      name: 'Pending Approvals', 
      value: stats.pendingContent.toString(), 
      icon: AlertTriangle, 
      color: 'bg-yellow-500', 
      change: 'content items',
      trend: 'neutral'
    },
    { 
      name: 'Recent Activity', 
      value: stats.recentActivity.toString(), 
      icon: Activity, 
      color: 'bg-purple-500', 
      change: 'last 24 hours',
      trend: 'up'
    },
  ]

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-center">
            <Crown className="w-8 h-8 mb-3 sm:mb-0 sm:mr-3" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Super Admin Dashboard</h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Welcome back, {profile?.full_name}! Here's your system overview.
              </p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'content', label: 'Content', icon: FileText },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'tasks' | 'content' | 'notifications' | 'settings')}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">{activity.user?.full_name || 'Unknown User'}</span> {activity.action}
                          </p>
                          <div className="flex items-center mt-1">
                            <Clock className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(activity.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No recent activity found.</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleAddUser}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                    <span className="block text-sm font-medium text-blue-900 dark:text-blue-200">Add User</span>
                  </button>
                  <button 
                    onClick={handleAddTask}
                    className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                    <span className="block text-sm font-medium text-green-900 dark:text-green-200">New Task</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('notifications')}
                    className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                    <span className="block text-sm font-medium text-indigo-900 dark:text-indigo-200">Send Notification</span>
                  </button>
                  <button 
                    onClick={handleContentTab}
                    className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                    <span className="block text-sm font-medium text-purple-900 dark:text-purple-200">Review Content</span>
                  </button>
                  <button 
                    onClick={handleReportsTab}
                    className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
                    <span className="block text-sm font-medium text-orange-900 dark:text-orange-200">View Reports</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Users</h3>
                <button 
                  onClick={handleAddUser}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {recentUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.last_login ? formatTimeAgo(user.last_login) : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleViewUser(user)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tasks</h3>
                <button 
                  onClick={handleAddTask}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  New Task
                </button>
              </div>
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Assigned to: {task.assignee?.full_name || 'Unassigned'}
                        </p>
                        {task.due_date && (
                          <div className="flex items-center mt-1">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Content Approvals</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {pendingContent.length} items pending
                </span>
              </div>
              <div className="space-y-4">
                {pendingContent.length > 0 ? (
                  pendingContent.map((content) => (
                    <div key={content.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {content.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Created by: {content.creator?.full_name || 'Unknown'}
                          </p>
                          {content.scheduled_date && (
                            <div className="flex items-center mt-1">
                              <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Scheduled: {new Date(content.scheduled_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApproveContent(content.id)}
                            className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectContent(content.id)}
                            className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No pending content approvals.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <AutoNotificationTest />
              <NotificationTest />
              <NotificationManagement />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Application Settings
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <NotificationSettings />
                  <PushNotificationTest />
                </div>
                
                <div className="mt-6 space-y-6">
                  <PushDebugInfo />
                  <DatabaseDebug />
                </div>
                <div className="mt-6">
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      System Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Version:</span>
                        <span className="text-gray-900 dark:text-white">1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Environment:</span>
                        <span className="text-gray-900 dark:text-white">Production</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                        <span className="text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onTaskAdded={handleTaskAdded}
      />

      {selectedUserId && (
        <UserDetailsModal
          isOpen={isUserDetailsModalOpen}
          onClose={() => setIsUserDetailsModalOpen(false)}
          userId={selectedUserId}
        />
      )}
    </div>
  )
}
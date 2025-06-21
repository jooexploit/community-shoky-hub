import { useState, useEffect, useCallback } from 'react'
import { Code, CheckSquare, Bug, TrendingUp, Clock, RefreshCw, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import AddTaskModal from '../../components/modals/AddTaskModal'

interface DashboardStats {
  activeTasks: number
  completedTasks: number
  highPriorityTasks: number
  recentActivity: number
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string
  created_by: string
  due_date?: string
  created_at: string
  updated_at: string
  assignee?: {
    full_name: string
  }
  creator?: {
    full_name: string
  }
}

interface ActivityLog {
  id: string
  user_id: string
  action: string
  details: Record<string, unknown>
  created_at: string
  user?: {
    full_name: string
  }
}

export default function DeveloperDashboard() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    activeTasks: 0,
    completedTasks: 0,
    highPriorityTasks: 0,
    recentActivity: 0
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!profile?.id) return

      // Fetch tasks assigned to the current developer
      const [tasksResponse, activityResponse] = await Promise.all([
        supabase
          .from('tasks')
          .select(`
            *,
            assignee:assigned_to(full_name),
            creator:created_by(full_name)
          `)
          .eq('assigned_to', profile.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('activity_logs')
          .select(`
            *,
            user:user_id(full_name)
          `)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      if (tasksResponse.error) throw tasksResponse.error
      if (activityResponse.error) throw activityResponse.error

      const allTasks = tasksResponse.data || []
      const activities = activityResponse.data || []

      // Calculate stats
      const activeTasks = allTasks.filter(t => t.status !== 'done').length
      const completedTasks = allTasks.filter(t => t.status === 'done').length
      const highPriorityTasks = allTasks.filter(t => t.priority === 'high' && t.status !== 'done').length

      setStats({
        activeTasks,
        completedTasks,
        highPriorityTasks,
        recentActivity: activities.length
      })

      setTasks(allTasks.filter(t => t.status !== 'done').slice(0, 5))
      setRecentActivities(activities)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData()
    }
  }, [profile?.id, fetchDashboardData])

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error
      
      // Refresh data
      fetchDashboardData()
    } catch (err) {
      console.error('Error updating task status:', err)
    }
  }

  const handleTaskAdded = () => {
    setIsAddTaskModalOpen(false)
    fetchDashboardData()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays} days ago`
    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths} months ago`
  }

  const formatDueDate = (dueDateString?: string) => {
    if (!dueDateString) return 'No due date'
    
    const dueDate = new Date(dueDateString)
    const now = new Date()
    const diffInMs = dueDate.getTime() - now.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 0) return 'Overdue'
    if (diffInDays === 0) return 'Due today'
    if (diffInDays === 1) return 'Due tomorrow'
    if (diffInDays < 7) return `Due in ${diffInDays} days`
    return `Due ${dueDate.toLocaleDateString()}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const handleViewTasks = () => {
    window.location.href = '/tasks'
  }

  const handleViewAnalytics = () => {
    window.location.href = '/analytics'
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
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
        <button 
          onClick={fetchDashboardData}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <Code className="w-8 h-8 mb-3 sm:mb-0 sm:mr-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Developer Dashboard</h1>
            <p className="text-orange-100 text-sm sm:text-base">Track your development progress and manage tasks.</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeTasks}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">In progress</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedTasks}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">This month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.highPriorityTasks}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <Bug className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-sm text-red-600 dark:text-red-400">Urgent items</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recentActivity}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-sm text-blue-600 dark:text-blue-400">Recent actions</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Tasks</h3>
            <button
              onClick={() => setIsAddTaskModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No active tasks</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as 'todo' | 'in_progress' | 'done')}
                        className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(task.status)}`}
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDueDate(task.due_date)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <Code className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{activity.action}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(activity.created_at)}</span>
                      {activity.user?.full_name && (
                        <>
                          <span className="text-xs text-gray-400 mx-1">•</span>
                          <span className="text-xs text-orange-600 dark:text-orange-400">{activity.user.full_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button 
            onClick={handleViewTasks}
            className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <CheckSquare className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-200 block">View Tasks</span>
          </button>
          {/* <button 
            onClick={handleViewAnalytics}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Code className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200 block">Analytics</span>
          </button> */}
          <button 
            onClick={() => setIsAddTaskModalOpen(true)}
            className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Plus className="w-6 h-6 text-green-600 dark:text-green-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-green-900 dark:text-green-200 block">Add Task</span>
          </button>
          <button 
            onClick={fetchDashboardData}
            className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <RefreshCw className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-200 block">Refresh</span>
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  )
}
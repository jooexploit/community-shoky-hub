import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Users, 
  Activity, 
  CheckSquare, 
  FileText, 
  PieChart,
  Target,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  totalContent: number
  publishedContent: number
  pendingContent: number
  recentActivities: number
  userGrowth: number
  taskCompletionRate: number
  contentApprovalRate: number
}

interface TimelineData {
  date: string
  users: number
  tasks: number
  content: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalContent: 0,
    publishedContent: 0,
    pendingContent: 0,
    recentActivities: 0,
    userGrowth: 0,
    taskCompletionRate: 0,
    contentApprovalRate: 0
  })
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate date range
      const now = new Date()
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

      // Fetch all data in parallel
      const [
        usersResult,
        tasksResult,
        contentResult,
        activitiesResult,
        previousUsersResult
      ] = await Promise.all([
        // Current period users
        supabase
          .from('users')
          .select('id, created_at, last_login')
          .gte('created_at', startDate.toISOString()),
        
        // Current period tasks
        supabase
          .from('tasks')
          .select('id, status, created_at')
          .gte('created_at', startDate.toISOString()),
        
        // Current period content
        supabase
          .from('content_plans')
          .select('id, status, created_at')
          .gte('created_at', startDate.toISOString()),
        
        // Recent activities
        supabase
          .from('activity_logs')
          .select('id')
          .gte('created_at', startDate.toISOString()),
        
        // Previous period users for growth calculation
        supabase
          .from('users')
          .select('id')
          .gte('created_at', new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString())
          .lt('created_at', startDate.toISOString())
      ])

      if (usersResult.error) throw usersResult.error
      if (tasksResult.error) throw tasksResult.error
      if (contentResult.error) throw contentResult.error
      if (activitiesResult.error) throw activitiesResult.error

      const users = usersResult.data || []
      const tasks = tasksResult.data || []
      const content = contentResult.data || []
      const activities = activitiesResult.data || []
      const previousUsers = previousUsersResult.data || []

      // Calculate active users (users who logged in within the period)
      const activeUsers = users.filter(user => 
        user.last_login && new Date(user.last_login) >= startDate
      ).length

      // Calculate task metrics
      const completedTasks = tasks.filter(task => task.status === 'done').length
      const pendingTasks = tasks.filter(task => task.status !== 'done').length
      const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0

      // Calculate content metrics
      const publishedContent = content.filter(item => item.status === 'published').length
      const pendingContent = content.filter(item => item.status === 'pending_approval').length
      const approvedContent = content.filter(item => item.status === 'approved').length
      const contentApprovalRate = content.length > 0 ? ((publishedContent + approvedContent) / content.length) * 100 : 0

      // Calculate growth rate
      const userGrowth = previousUsers.length > 0 ? 
        ((users.length - previousUsers.length) / previousUsers.length) * 100 : 0

      setAnalytics({
        totalUsers: users.length,
        activeUsers,
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        totalContent: content.length,
        publishedContent,
        pendingContent,
        recentActivities: activities.length,
        userGrowth,
        taskCompletionRate,
        contentApprovalRate
      })

      // Generate timeline data
      const timeline: TimelineData[] = []
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayUsers = users.filter(user => 
          user.created_at.startsWith(dateStr)
        ).length
        
        const dayTasks = tasks.filter(task => 
          task.created_at.startsWith(dateStr)
        ).length
        
        const dayContent = content.filter(item => 
          item.created_at.startsWith(dateStr)
        ).length

        timeline.push({
          date: dateStr,
          users: dayUsers,
          tasks: dayTasks,
          content: dayContent
        })
      }
      
      setTimelineData(timeline)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const metrics = [
    { 
      name: 'Total Users', 
      value: analytics.totalUsers, 
      change: analytics.userGrowth,
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      name: 'Active Users', 
      value: analytics.activeUsers, 
      change: analytics.activeUsers > 0 ? ((analytics.activeUsers / analytics.totalUsers) * 100) : 0,
      icon: Activity, 
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    { 
      name: 'Completed Tasks', 
      value: analytics.completedTasks, 
      change: analytics.taskCompletionRate,
      icon: CheckSquare, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    { 
      name: 'Published Content', 
      value: analytics.publishedContent, 
      change: analytics.contentApprovalRate,
      icon: FileText, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
  ]

  const performanceData = [
    { label: 'Task Completion Rate', value: analytics.taskCompletionRate, target: 85 },
    { label: 'Content Approval Rate', value: analytics.contentApprovalRate, target: 75 },
    { label: 'User Activity Rate', value: analytics.totalUsers > 0 ? (analytics.activeUsers / analytics.totalUsers) * 100 : 0, target: 60 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track performance and insights across your organization</p>
        </div>
        <div className="flex items-center space-x-2">
          {[
            { key: '7d', label: '7 days' },
            { key: '30d', label: '30 days' },
            { key: '90d', label: '90 days' }
          ].map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key as '7d' | '30d' | '90d')}
              className={`px-3 py-1 text-sm rounded-lg ${
                timeRange === range.key
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.name} className={`${metric.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
              </div>
              <metric.icon className={`w-8 h-8 ${metric.color}`} />
            </div>
            <div className="mt-4 flex items-center">
              {metric.change > 0 ? (
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              ) : metric.change < 0 ? (
                <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
              ) : (
                <div className="w-4 h-4 mr-1"></div>
              )}
              <span className={`text-sm ${
                metric.change > 0 ? 'text-green-600 dark:text-green-400' : 
                metric.change < 0 ? 'text-red-600 dark:text-red-400' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                {Math.abs(metric.change).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                vs previous period
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Targets */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Targets</h3>
          </div>
          <div className="space-y-4">
            {performanceData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="text-gray-900 dark:text-white">
                    {item.value.toFixed(1)}% / {item.target}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.value >= item.target ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((item.value / item.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <PieChart className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Summary</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Activities</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {analytics.recentActivities}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tasks Created</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {analytics.totalTasks}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Content Published</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {analytics.publishedContent}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">New Users</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {analytics.totalUsers}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Timeline</h3>
        </div>
        <div className="h-64 flex items-end space-x-2 overflow-x-auto">
          {timelineData.map((day, index) => {
            const maxValue = Math.max(...timelineData.map(d => d.users + d.tasks + d.content))
            const height = maxValue > 0 ? ((day.users + day.tasks + day.content) / maxValue) * 100 : 0
            
            return (
              <div key={index} className="flex-shrink-0 flex flex-col items-center">
                <div 
                  className="w-8 bg-blue-500 rounded-t flex flex-col justify-end"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  <div 
                    className="w-full bg-blue-300"
                    style={{ height: `${maxValue > 0 ? (day.users / maxValue) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="w-full bg-green-300"
                    style={{ height: `${maxValue > 0 ? (day.tasks / maxValue) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="w-full bg-purple-300"
                    style={{ height: `${maxValue > 0 ? (day.content / maxValue) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 transform -rotate-45 origin-top">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-300 rounded mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Users</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-300 rounded mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Tasks</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-300 rounded mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Content</span>
          </div>
        </div>
      </div>
    </div>
  )
}

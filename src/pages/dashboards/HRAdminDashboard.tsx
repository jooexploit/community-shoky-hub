import { useState, useEffect } from 'react'
import { UserCheck, Users, FileText, TrendingUp, GraduationCap, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalStudents: number
  activeStudents: number
  averageGpa: number
  totalPoints: number
  recentJoiners: number
  highPerformers: number
}

interface TopStudent {
  id: string
  student_id: string
  full_name: string
  major: string
  gpa: number
  points: number
  year: number
}

interface RecentJoiner {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

export default function HRAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalStudents: 0,
    activeStudents: 0,
    averageGpa: 0,
    totalPoints: 0,
    recentJoiners: 0,
    highPerformers: 0
  })
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [recentJoiners, setRecentJoiners] = useState<RecentJoiner[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch users data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
      
      if (usersError) throw usersError

      // Fetch students data
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
      
      if (studentsError) throw studentsError

      // No need to fetch activity logs for HR dashboard anymore

      // Calculate stats
      const totalUsers = users?.length || 0
      const activeUsers = users?.filter(u => u.is_active)?.length || 0
      const totalStudents = students?.length || 0
      const activeStudents = students?.filter(s => s.status === 'active')?.length || 0
      const averageGpa = totalStudents > 0 ? 
        (students?.reduce((sum, s) => sum + (s.gpa || 0), 0) || 0) / totalStudents : 0
      const totalPoints = students?.reduce((sum, s) => sum + (s.points || 0), 0) || 0

      // Calculate recent joiners (users created in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentJoinersCount = users?.filter(u => 
        new Date(u.created_at) > thirtyDaysAgo
      )?.length || 0

      // Calculate high performers (students with GPA > 3.5)
      const highPerformersCount = students?.filter(s => 
        s.status === 'active' && s.gpa > 3.5
      )?.length || 0

      setStats({
        totalUsers,
        activeUsers,
        totalStudents,
        activeStudents,
        averageGpa,
        totalPoints,
        recentJoiners: recentJoinersCount,
        highPerformers: highPerformersCount
      })

      // Get top performing students (by GPA and points)
      const topPerformers = students?.filter(s => s.status === 'active')
        .sort((a, b) => {
          // Sort by GPA first, then by points
          if (b.gpa !== a.gpa) return b.gpa - a.gpa
          return b.points - a.points
        })
        .slice(0, 5) || []

      setTopStudents(topPerformers)

      // Get recent joiners
      const recentUsers = users?.filter(u => 
        new Date(u.created_at) > thirtyDaysAgo
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5) || []

      setRecentJoiners(recentUsers)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const dashboardStats = [
    { name: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'bg-blue-500', change: `${stats.activeUsers} active` },
    { name: 'Active Students', value: stats.activeStudents.toString(), icon: GraduationCap, color: 'bg-green-500', change: `${stats.totalStudents} total` },
    { name: 'High Performers', value: stats.highPerformers.toString(), icon: TrendingUp, color: 'bg-purple-500', change: 'GPA > 3.5' },
    { name: 'Recent Joiners', value: stats.recentJoiners.toString(), icon: UserCheck, color: 'bg-orange-500', change: 'Last 30 days' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <UserCheck className="w-8 h-8 mb-3 sm:mb-0 sm:mr-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">HR Admin Dashboard</h1>
            <p className="text-green-100 text-sm sm:text-base">Manage your team and track performance.</p>
          </div>
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
              <span className="text-sm text-green-600 dark:text-green-400">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Joiners */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Joiners</h3>
            <Link to="/users" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentJoiners.length > 0 ? recentJoiners.map((user) => (
              <div key={user.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No recent joiners</p>
            )}
          </div>
        </div>

        {/* Top Performing Students */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Students</h3>
            <Link to="/students" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {topStudents.length > 0 ? topStudents.map((student, index) => (
              <div key={student.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`w-8 h-8 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'} rounded-full flex items-center justify-center text-white font-bold text-sm mr-3`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{student.full_name}</p>
                  <div className="flex items-center mt-1 space-x-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{student.major}</span>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">GPA: {student.gpa.toFixed(2)}</span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{student.points} pts</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No students found</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link 
            to="/users"
            className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors block text-center"
          >
            <Users className="w-6 h-6 text-green-600 dark:text-green-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-green-900 dark:text-green-200 block">Manage Users</span>
          </Link>
          <Link 
            to="/students"
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors block text-center"
          >
            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200 block">Manage Students</span>
          </Link>
          <Link 
            to="/calendar"
            className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors block text-center"
          >
            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-200 block">View Calendar</span>
          </Link>
          <button 
            onClick={fetchDashboardData}
            className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <Eye className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200 block">Refresh Data</span>
          </button>
        </div>
      </div>
    </div>
  )
}
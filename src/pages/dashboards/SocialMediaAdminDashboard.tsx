import { useState, useEffect } from 'react'
import { 
  Megaphone, 
  Calendar, 
  FileText, 
  Image, 
  TrendingUp, 
  Clock, 
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalPosts: number
  pendingApproval: number
  assetsUploaded: number
  approvedThisMonth: number
  publishedThisMonth: number
  rejectedThisMonth: number
}

interface ContentPlan {
  id: string
  title: string
  content: string
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'all'
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published'
  scheduled_date?: string
  created_by: string
  approved_by?: string
  feedback?: string
  created_at: string
  updated_at: string
  creator?: {
    full_name: string
  }
  approver?: {
    full_name: string
  }
}

interface Asset {
  id: string
  name: string
  description?: string
  asset_url: string
  asset_type: string
  category?: string
  created_by: string
  created_at: string
  creator?: {
    full_name: string
  }
}

export default function SocialMediaAdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    pendingApproval: 0,
    assetsUploaded: 0,
    approvedThisMonth: 0,
    publishedThisMonth: 0,
    rejectedThisMonth: 0
  })
  const [recentContent, setRecentContent] = useState<ContentPlan[]>([])
  const [recentAssets, setRecentAssets] = useState<Asset[]>([])
  const [recentFeedback, setRecentFeedback] = useState<ContentPlan[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch content plans data
      const { data: contentPlans, error: contentError } = await supabase
        .from('content_plans')
        .select(`
          *,
          creator:users!content_plans_created_by_fkey(full_name),
          approver:users!content_plans_approved_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (contentError) throw contentError

      // Fetch assets data
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select(`
          *,
          creator:users!assets_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (assetsError) throw assetsError

      // Calculate stats
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const totalPosts = contentPlans?.length || 0
      const pendingApproval = contentPlans?.filter(cp => cp.status === 'pending_approval')?.length || 0
      const assetsUploaded = assets?.length || 0
      const approvedThisMonth = contentPlans?.filter(cp => 
        cp.status === 'approved' && new Date(cp.updated_at) >= startOfMonth
      )?.length || 0
      const publishedThisMonth = contentPlans?.filter(cp => 
        cp.status === 'published' && new Date(cp.updated_at) >= startOfMonth
      )?.length || 0
      const rejectedThisMonth = contentPlans?.filter(cp => 
        cp.status === 'rejected' && new Date(cp.updated_at) >= startOfMonth
      )?.length || 0

      setStats({
        totalPosts,
        pendingApproval,
        assetsUploaded,
        approvedThisMonth,
        publishedThisMonth,
        rejectedThisMonth
      })

      // Set recent content for calendar view
      setRecentContent(contentPlans?.slice(0, 5) || [])

      // Set recent assets
      setRecentAssets(assets?.slice(0, 4) || [])

      // Set recent feedback (content with feedback)
      const contentWithFeedback = contentPlans?.filter(cp => 
        cp.feedback && cp.feedback.trim() !== ''
      ).slice(0, 3) || []
      setRecentFeedback(contentWithFeedback)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const dashboardStats = [
    { 
      name: 'Posts This Month', 
      value: stats.publishedThisMonth.toString(), 
      icon: FileText, 
      color: 'bg-purple-500', 
      change: `+${stats.approvedThisMonth} approved`,
      total: stats.totalPosts
    },
    { 
      name: 'Pending Approval', 
      value: stats.pendingApproval.toString(), 
      icon: Clock, 
      color: 'bg-yellow-500', 
      change: `${stats.rejectedThisMonth} rejected`,
      total: stats.totalPosts
    },
    { 
      name: 'Assets Uploaded', 
      value: stats.assetsUploaded.toString(), 
      icon: Image, 
      color: 'bg-blue-500', 
      change: 'All time',
      total: stats.assetsUploaded
    },
    { 
      name: 'Content Created', 
      value: stats.totalPosts.toString(), 
      icon: Megaphone, 
      color: 'bg-green-500', 
      change: 'Total posts',
      total: stats.totalPosts
    },
  ]

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />
      case 'twitter': return <Twitter className="w-4 h-4 text-blue-400" />
      case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-700" />
      default: return <Megaphone className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'published': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'published': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'pending_approval': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'draft': return <Clock className="w-4 h-4 text-gray-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create_post':
        navigate('/content')
        break
      case 'upload_asset':
        navigate('/assets')
        break
      case 'schedule_content':
        navigate('/calendar')
        break
      case 'view_analytics':
        navigate('/analytics')
        break
    }
  }

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
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <Megaphone className="w-8 h-8 mb-3 sm:mb-0 sm:mr-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Social Media Dashboard</h1>
            <p className="text-purple-100 text-sm sm:text-base">Create engaging content and manage your social presence.</p>
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
        {/* Recent Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Content</h3>
            <Link
              to="/content"
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentContent.length > 0 ? (
              recentContent.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.scheduled_date ? formatDate(item.scheduled_date) : formatDate(item.created_at)}
                      </span>
                      {getPlatformIcon(item.platform)}
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.platform}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No content created yet</p>
                <button
                  onClick={() => handleQuickAction('create_post')}
                  className="mt-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  Create your first post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Feedback</h3>
          <div className="space-y-4">
            {recentFeedback.length > 0 ? (
              recentFeedback.map((feedback) => (
                <div key={feedback.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{feedback.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{feedback.feedback}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      — {feedback.approver?.full_name || 'Admin'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                      {feedback.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No feedback yet</p>
                <p className="text-xs text-gray-400 mt-1">Feedback will appear here when admins review your content</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Assets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Assets</h3>
          <Link
            to="/assets"
            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentAssets.length > 0 ? (
            recentAssets.map((asset) => (
              <div key={asset.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center mb-2">
                  <Image className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {asset.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {asset.asset_type}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(asset.created_at)}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No assets uploaded yet</p>
              <button
                onClick={() => handleQuickAction('upload_asset')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Upload your first asset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button 
            onClick={() => handleQuickAction('create_post')}
            className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-200 block">Create Post</span>
          </button>
          <button 
            onClick={() => handleQuickAction('upload_asset')}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Image className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200 block">Upload Asset</span>
          </button>
          <button 
            onClick={() => handleQuickAction('schedule_content')}
            className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Calendar className="w-6 h-6 text-green-600 dark:text-green-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-green-900 dark:text-green-200 block">Schedule Content</span>
          </button>
          {/* <button 
            onClick={() => handleQuickAction('view_analytics')}
            className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-pink-600 dark:text-pink-400 mb-2 mx-auto" />
            <span className="text-sm font-medium text-pink-900 dark:text-pink-200 block">View Analytics</span>
          </button> */}
        </div>
      </div>
    </div>
  )
}
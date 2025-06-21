import { useState, useEffect } from 'react'
import { X, Mail, Calendar, Activity, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
}

interface UserDetails {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  last_login?: string
  avatar_url?: string
}

interface UserActivity {
  id: string
  action: string
  created_at: string
  details: Record<string, unknown>
}

export default function UserDetailsModal({ isOpen, onClose, userId }: UserDetailsModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null)
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return
      
      setLoading(true)
      setError(null)

      try {
        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (userError) throw userError
        setUser(userData)

        // Fetch user activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (activitiesError) throw activitiesError
        setActivities(activitiesData || [])

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user details')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && userId) {
      fetchData()
    }
  }, [isOpen, userId])

  const fetchUserDetails = async () => {
    // This function is now inline in useEffect
  }

  const toggleUserStatus = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, is_active: !user.is_active })

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: user.is_active ? 'deactivated user' : 'activated user',
        details: { target_user: user.email }
      })

    } catch (err) {
      console.error('Error updating user status:', err)
    }
  }

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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'hr_admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'social_media_admin': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'developer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              User Details
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {user && !loading && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user.full_name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Joined</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last Login</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.last_login ? formatTimeAgo(user.last_login) : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">Recent Activity</h5>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {activity.action}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity found.</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={toggleUserStatus}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    user.is_active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                  }`}
                >
                  {user.is_active ? 'Deactivate User' : 'Activate User'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Calendar, 
  Eye, 
  Edit2, 
  Trash2, 
  Clock, 
  User,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

interface ContentPlan {
  id: string
  title: string
  content: string
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'all'
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published'
  scheduled_date?: string
  created_by: string
  approved_by?: string
  created_at: string
  updated_at: string
  creator?: {
    full_name: string
  }
  approver?: {
    full_name: string
  }
}

interface AddContentModalProps {
  isOpen: boolean
  onClose: () => void
  onContentAdded: () => void
  editingContent?: ContentPlan | null
}

function AddContentModal({ isOpen, onClose, onContentAdded, editingContent }: AddContentModalProps) {
  const { profile } = useAuthStore()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'instagram' as 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'all',
    scheduled_date: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill form when editing
  useEffect(() => {
    if (editingContent) {
      setFormData({
        title: editingContent.title,
        content: editingContent.content,
        platform: editingContent.platform,
        scheduled_date: editingContent.scheduled_date 
          ? new Date(editingContent.scheduled_date).toISOString().slice(0, 16) 
          : ''
      })
    } else {
      setFormData({
        title: '',
        content: '',
        platform: 'instagram',
        scheduled_date: ''
      })
    }
  }, [editingContent, isOpen])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (editingContent) {
        // Update existing content
        const { error: updateError } = await supabase
          .from('content_plans')
          .update({
            title: formData.title,
            content: formData.content,
            platform: formData.platform,
            scheduled_date: formData.scheduled_date || null,
          })
          .eq('id', editingContent.id)

        if (updateError) throw updateError

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: profile?.id,
          action: 'updated content plan',
          details: { content_title: formData.title, platform: formData.platform }
        })
      } else {
        // Create new content
        const { error: insertError } = await supabase
          .from('content_plans')
          .insert({
            title: formData.title,
            content: formData.content,
            platform: formData.platform,
            status: 'draft',
            scheduled_date: formData.scheduled_date || null,
            created_by: profile?.id
          })

        if (insertError) throw insertError

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: profile?.id,
          action: 'created new content plan',
          details: { content_title: formData.title, platform: formData.platform }
        })
      }

      setFormData({
        title: '',
        content: '',
        platform: 'instagram',
        scheduled_date: ''
      })
      onContentAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingContent ? 'update' : 'create'} content`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingContent ? 'Edit Content' : 'Create New Content'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Platform
            </label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'all' })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="all">All Platforms</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="Write your social media content here..."
              required
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.content.length}/280 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scheduled Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"            >
              {loading 
                ? (editingContent ? 'Updating...' : 'Creating...') 
                : (editingContent ? 'Update Content' : 'Create Content')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ContentPage() {
  const { profile } = useAuthStore()
  const [content, setContent] = useState<ContentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<ContentPlan | null>(null)
  
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('content_plans')
        .select(`
          *,
          creator:created_by(full_name),
          approver:approved_by(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log('Fetched content:', data)
      console.log('Current user profile:', profile)
      setContent(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content')
    } finally {
      setLoading(false)
    }
  }, [profile])
  
  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  const handleStatusUpdate = async (contentId: string, newStatus: string) => {
    try {
      console.log('Updating content status:', { contentId, newStatus, userId: profile?.id, role: profile?.role })
      
      const updateData: {
        status: string
        updated_at: string
        approved_by?: string | null
      } = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      // Set approved_by for approval/rejection actions
      if (newStatus === 'approved' || newStatus === 'rejected') {
        updateData.approved_by = profile?.id
      }
      
      const { data, error } = await supabase
        .from('content_plans')
        .update(updateData)
        .eq('id', contentId)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        alert(`Failed to update content status: ${error.message}`)
        return
      }
      
      console.log('Content status updated successfully:', data)
      fetchContent()
    } catch (err) {
      console.error('Error updating content status:', err)
      alert(`Failed to update content status: ${err}`)
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const { error } = await supabase
        .from('content_plans')
        .delete()
        .eq('id', contentId)

      if (error) throw error
      fetchContent()
    } catch (err) {
      console.error('Error deleting content:', err)
    }
  }

  const filteredContent = content.filter(item => {
    if (selectedStatus === 'all') return true
    return item.status === selectedStatus
  })

  const platformIcons = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    all: Eye
  }

  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Edit2 },
    pending_approval: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    published: { label: 'Published', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Planning</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage social media content</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Content</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Status Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Content' },
          { key: 'draft', label: 'Drafts' },
          { key: 'pending_approval', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'published', label: 'Published' }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setSelectedStatus(filter.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              selectedStatus === filter.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map((item) => {
          const PlatformIcon = platformIcons[item.platform]
          const statusInfo = statusConfig[item.status]
          
          return (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <PlatformIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                      {item.platform}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {item.content}
                </p>

                {item.scheduled_date && (
                  <div className="flex items-center mb-3 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      {new Date(item.scheduled_date).toLocaleDateString()} at{' '}
                      {new Date(item.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    <span>{item.creator?.full_name || 'Unknown'}</span>
                  </div>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {item.status === 'draft' && (
                      <button
                        onClick={() => handleStatusUpdate(item.id, 'pending_approval')}
                        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs"
                      >
                        Submit for Approval
                      </button>
                    )}
                    {item.status === 'pending_approval' && profile?.role === 'super_admin' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(item.id, 'approved')}
                          className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(item.id, 'rejected')}
                          className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}                    {item.status === 'approved' && (
                      <button
                        onClick={() => {
                          console.log('Publish button clicked for content:', item.id, 'User role:', profile?.role)
                          handleStatusUpdate(item.id, 'published')
                        }}
                        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => {
                        setEditingContent(item)
                        setIsAddModalOpen(true)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteContent(item.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredContent.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No content found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {selectedStatus !== 'all' 
              ? `No content with ${selectedStatus.replace('_', ' ')} status found.`
              : 'Get started by creating your first piece of content.'
            }
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Create First Content
          </button>
        </div>
      )}      <AddContentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingContent(null)
        }}
        onContentAdded={fetchContent}
        editingContent={editingContent}
      />
    </div>
  )
}

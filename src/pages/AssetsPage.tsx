import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Image, 
  FileText, 
  Video, 
  Globe, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Tag,
  Calendar,
  User
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

interface Asset {
  id: string
  name: string
  description?: string
  asset_url: string
  asset_type: 'brand' | 'social_media' | 'video' | 'document' | 'other'
  category: string
  tags?: string[]
  created_by: string
  created_at: string
  updated_at: string
  creator?: {
    full_name: string
  }
}

interface AddAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onAssetAdded: () => void
  editingAsset?: Asset | null
}

function AddAssetModal({ isOpen, onClose, onAssetAdded, editingAsset }: AddAssetModalProps) {
  const { profile } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_url: '',
    asset_type: 'brand' as 'brand' | 'social_media' | 'video' | 'document' | 'other',
    category: '',
    tags: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill form when editing
  useEffect(() => {
    if (editingAsset) {
      setFormData({
        name: editingAsset.name,
        description: editingAsset.description || '',
        asset_url: editingAsset.asset_url,
        asset_type: editingAsset.asset_type,
        category: editingAsset.category,
        tags: editingAsset.tags ? editingAsset.tags.join(', ') : ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        asset_url: '',
        asset_type: 'brand',
        category: '',
        tags: ''
      })
    }
  }, [editingAsset, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (editingAsset) {
        // Update existing asset
        const { error: updateError } = await supabase
          .from('assets')
          .update({
            name: formData.name,
            description: formData.description,
            asset_url: formData.asset_url,
            asset_type: formData.asset_type,
            category: formData.category,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
          })
          .eq('id', editingAsset.id)

        if (updateError) throw updateError

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: profile?.id,
          action: 'updated asset',
          details: { asset_name: formData.name, asset_type: formData.asset_type }
        })
      } else {
        // Create new asset
        const { error: insertError } = await supabase
          .from('assets')
          .insert({
            name: formData.name,
            description: formData.description,
            asset_url: formData.asset_url,
            asset_type: formData.asset_type,
            category: formData.category,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
            created_by: profile?.id
          })

        if (insertError) throw insertError

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: profile?.id,
          action: 'created new asset',
          details: { asset_name: formData.name, asset_type: formData.asset_type }
        })
      }

      setFormData({
        name: '',
        description: '',
        asset_url: '',
        asset_type: 'brand',
        category: '',
        tags: ''
      })
      onAssetAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingAsset ? 'update' : 'create'} asset`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingAsset ? 'Edit Asset' : 'Add New Asset'}
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
              Asset Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Asset URL/Link
            </label>
            <input
              type="url"
              value={formData.asset_url}
              onChange={(e) => setFormData({ ...formData, asset_url: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/asset.png"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Asset Type
            </label>
            <select
              value={formData.asset_type}
              onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as 'brand' | 'social_media' | 'video' | 'document' | 'other' })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="brand">Brand Assets</option>
              <option value="social_media">Social Media</option>
              <option value="video">Video Content</option>
              <option value="document">Documents</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Logo, Banner, Template"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="logo, branding, marketing"
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
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading 
                ? (editingAsset ? 'Updating...' : 'Adding...') 
                : (editingAsset ? 'Update Asset' : 'Add Asset')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          creator:users(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId)

      if (error) throw error
      fetchAssets()
    } catch (err) {
      console.error('Error deleting asset:', err)
    }
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || asset.asset_type === selectedType
    return matchesSearch && matchesType
  })

  const assetsByType = assets.reduce((acc, asset) => {
    acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const typeConfigs = {
    brand: { label: 'Brand Assets', icon: Image, color: 'bg-blue-500' },
    social_media: { label: 'Social Media', icon: Globe, color: 'bg-purple-500' },
    video: { label: 'Video Content', icon: Video, color: 'bg-green-500' },
    document: { label: 'Documents', icon: FileText, color: 'bg-orange-500' },
    other: { label: 'Other', icon: FileText, color: 'bg-gray-500' }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assets</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your digital assets and resources</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="brand">Brand Assets</option>
          <option value="social_media">Social Media</option>
          <option value="video">Video Content</option>
          <option value="document">Documents</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Asset Type Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(typeConfigs).map(([type, config]) => (
          <div 
            key={type}
            onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
            className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 transition-all cursor-pointer ${
              selectedType === type 
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center`}>
                <config.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {assetsByType[type] || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{config.label}</h3>
          </div>
        ))}
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => {
          const typeConfig = typeConfigs[asset.asset_type]
          return (
            <div key={asset.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Asset Preview */}
              <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {asset.asset_type === 'video' ? (
                  <Video className="w-12 h-12 text-gray-400" />
                ) : asset.asset_type === 'document' ? (
                  <FileText className="w-12 h-12 text-gray-400" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={asset.asset_url} 
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const fallback = target.parentElement?.querySelector('.fallback-icon')
                        if (fallback) fallback.classList.remove('hidden')
                      }}
                    />
                    <div className="fallback-icon hidden">
                      <typeConfig.icon className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Asset Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {asset.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${typeConfig.color} text-white`}>
                    {typeConfig.label}
                  </span>
                </div>

                {asset.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {asset.description}
                  </p>
                )}

                {asset.category && (
                  <div className="flex items-center mb-2">
                    <Tag className="w-3 h-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{asset.category}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    <span>{asset.creator?.full_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {asset.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        +{asset.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <a
                    href={asset.asset_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    <span className="text-xs">View</span>
                  </a>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setEditingAsset(asset)
                        setIsAddModalOpen(true)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
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

      {filteredAssets.length === 0 && !loading && (
        <div className="text-center py-12">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No assets found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || selectedType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first asset.'
            }
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add First Asset
          </button>
        </div>
      )}

      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingAsset(null)
        }}
        onAssetAdded={fetchAssets}
        editingAsset={editingAsset}
      />
    </div>
  )
}
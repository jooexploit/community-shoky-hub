import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Calendar, User, Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import AddTaskModal from '../components/modals/AddTaskModal'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  created_by: string
  due_date?: string
  created_at: string
  updated_at: string
  assignee?: {
    full_name: string
    email: string
  }
  creator?: {
    full_name: string
    email: string
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  
  // Modal states
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to(full_name, email),
          creator:created_by(full_name, email)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      if (selectedPriority !== 'all') {
        query = query.eq('priority', selectedPriority)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Apply search filter
      let filteredTasks = data || []
      if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
          task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setTasks(filteredTasks)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, selectedPriority, searchTerm])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

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

      // Refresh tasks list
      fetchTasks()
    } catch (err) {
      console.error('Error updating task status:', err)
    }
  }

  const handleTaskAdded = () => {
    setIsAddTaskModalOpen(false)
    fetchTasks()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isOverdue = (dueDateString: string) => {
    const dueDate = new Date(dueDateString)
    const now = new Date()
    return dueDate < now
  }

  const getTasksByStatus = (status: 'todo' | 'in_progress' | 'done') => {
    return tasks.filter(task => task.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track your tasks</p>
        </div>
        <button 
          onClick={() => setIsAddTaskModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Circle className="w-4 h-4 text-gray-400 mr-2" />
              To Do ({getTasksByStatus('todo').length})
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {getTasksByStatus('todo').map((task) => (
              <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {task.assignee?.full_name || 'Unassigned'}
                  </div>
                  {task.due_date && (
                    <div className={`flex items-center ${isOverdue(task.due_date) ? 'text-red-500' : ''}`}>
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(task.due_date)}
                      {isOverdue(task.due_date) && <AlertCircle className="w-3 h-3 ml-1" />}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Created {formatTimeAgo(task.created_at)}
                  </span>
                  <button
                    onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
            {getTasksByStatus('todo').length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks to do</p>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Clock className="w-4 h-4 text-blue-500 mr-2" />
              In Progress ({getTasksByStatus('in_progress').length})
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {getTasksByStatus('in_progress').map((task) => (
              <div key={task.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {task.assignee?.full_name || 'Unassigned'}
                  </div>
                  {task.due_date && (
                    <div className={`flex items-center ${isOverdue(task.due_date) ? 'text-red-500' : ''}`}>
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(task.due_date)}
                      {isOverdue(task.due_date) && <AlertCircle className="w-3 h-3 ml-1" />}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <button
                    onClick={() => handleUpdateTaskStatus(task.id, 'todo')}
                    className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleUpdateTaskStatus(task.id, 'done')}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
            {getTasksByStatus('in_progress').length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks in progress</p>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Done ({getTasksByStatus('done').length})
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {getTasksByStatus('done').map((task) => (
              <div key={task.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {task.assignee?.full_name || 'Unassigned'}
                  </div>
                  {task.due_date && (
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(task.due_date)}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Completed {formatTimeAgo(task.updated_at)}
                  </span>
                  <button
                    onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Reopen
                  </button>
                </div>
              </div>
            ))}
            {getTasksByStatus('done').length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No completed tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Empty state when no tasks at all */}
      {tasks.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first task.'}
            </p>
            <button 
              onClick={() => setIsAddTaskModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Create First Task
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  )
}
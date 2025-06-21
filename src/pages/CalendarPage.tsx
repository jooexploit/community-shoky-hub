import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  FileText,
  CheckSquare,
  Users,
  Edit2,
  Trash2,
  X,
  Eye,
  ExternalLink
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  event_type: 'content' | 'task' | 'meeting' | 'event' | 'deadline'
  color: string
  source_id?: string // ID from content_plans, tasks, or events table
  created_by: string
  creator?: {
    full_name: string
  }
}

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventAdded: () => void
  selectedDate?: Date
  editingEvent?: CalendarEvent | null
}

function AddEventModal({ isOpen, onClose, onEventAdded, selectedDate, editingEvent }: AddEventModalProps) {
  const { profile } = useAuthStore()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'event' as 'meeting' | 'event' | 'deadline'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill form when editing or when a date is selected
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        start_date: new Date(editingEvent.start_date).toISOString().slice(0, 16),
        end_date: editingEvent.end_date ? new Date(editingEvent.end_date).toISOString().slice(0, 16) : '',
        event_type: editingEvent.event_type as 'meeting' | 'event' | 'deadline'
      })
    } else if (selectedDate) {
      const dateStr = selectedDate.toISOString().slice(0, 10)
      setFormData({
        title: '',
        description: '',
        start_date: `${dateStr}T09:00`,
        end_date: `${dateStr}T10:00`,
        event_type: 'event'
      })
    } else {
      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        event_type: 'event'
      })
    }
  }, [editingEvent, selectedDate, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const eventColors = {
        meeting: '#3B82F6', // blue
        event: '#10B981', // green
        deadline: '#EF4444' // red
      }

      if (editingEvent) {
        // Update existing event
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({
            title: formData.title,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            event_type: formData.event_type,
            color: eventColors[formData.event_type]
          })
          .eq('id', editingEvent.id)

        if (updateError) throw updateError
      } else {
        // Create new event
        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert({
            title: formData.title,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            event_type: formData.event_type,
            color: eventColors[formData.event_type],
            created_by: profile?.id
          })

        if (insertError) throw insertError
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: profile?.id,
        action: editingEvent ? 'updated calendar event' : 'created calendar event',
        details: { event_title: formData.title, event_type: formData.event_type }
      })

      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        event_type: 'event'
      })
      onEventAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingEvent ? 'update' : 'create'} event`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
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
              Event Title
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
              Event Type
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value as 'meeting' | 'event' | 'deadline' })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="event">Event</option>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
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
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading 
                ? (editingEvent ? 'Updating...' : 'Creating...') 
                : (editingEvent ? 'Update Event' : 'Create Event')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Day Detail Modal to show all events for a specific day
interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onEditEvent: (event: CalendarEvent) => void
  onDeleteEvent: (eventId: string) => void
}

function DayDetailModal({ isOpen, onClose, selectedDate, events, onEventClick, onEditEvent, onDeleteEvent }: DayDetailModalProps) {
  const { profile } = useAuthStore()
  
  if (!isOpen || !selectedDate) return null

  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start_date)
    return eventDate.toDateString() === selectedDate.toDateString()
  })

  const eventTypeIcons = {
    content: FileText,
    task: CheckSquare,
    meeting: Users,
    event: Calendar,
    deadline: Clock
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Events for {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No events scheduled for this day
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event) => {
              const IconComponent = eventTypeIcons[event.event_type]
              const isUserEvent = !event.id.startsWith('content-') && !event.id.startsWith('task-')
              const canEditEvent = isUserEvent && (
                event.created_by === profile?.id || 
                profile?.role === 'super_admin' || 
                profile?.role === 'hr_admin'
              )
              
              return (
                <div
                  key={event.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <IconComponent className="w-4 h-4" style={{ color: event.color }} />
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h3>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div>
                            {new Date(event.start_date).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {event.end_date && (
                              <span> - {new Date(event.end_date).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}</span>
                            )}
                          </div>
                          
                          {event.description && (
                            <div className="text-gray-700 dark:text-gray-300">
                              {event.description}
                            </div>
                          )}
                          
                          {event.creator && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>
                                {event.creator.full_name || 'Unknown'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {(event.event_type === 'content' || event.event_type === 'task') && (
                        <button
                          onClick={() => onEventClick(event)}
                          className="text-gray-400 hover:text-blue-500 p-1"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      
                      {canEditEvent && (
                        <>
                          <button
                            onClick={() => onEditEvent(event)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Edit event"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(event.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Delete event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface ContentDetails {
  id: string
  title: string
  description?: string
  platform?: string
  content_type?: string
  scheduled_date?: string
  status?: string
  creator?: {
    full_name: string
  }
}

interface TaskDetails {
  id: string
  title: string
  description?: string
  priority?: string
  status?: string
  due_date?: string
  assignee?: {
    full_name: string
  }
  creator?: {
    full_name: string
  }
}

// Event Detail Modal for content and task preview
interface EventDetailModalProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
}

function EventDetailModal({ isOpen, onClose, event }: EventDetailModalProps) {
  const [details, setDetails] = useState<ContentDetails | TaskDetails | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchEventDetails = useCallback(async () => {
    if (!event || !event.source_id) return

    setLoading(true)
    try {
      if (event.event_type === 'content') {
        const { data, error } = await supabase
          .from('content_plans')
          .select(`
            *,
            creator:created_by(full_name)
          `)
          .eq('id', event.source_id)
          .single()

        if (error) throw error
        setDetails(data)
      } else if (event.event_type === 'task') {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            assignee:assigned_to(full_name),
            creator:created_by(full_name)
          `)
          .eq('id', event.source_id)
          .single()

        if (error) throw error
        setDetails(data)
      }
    } catch (err) {
      console.error('Error fetching event details:', err)
    } finally {
      setLoading(false)
    }
  }, [event])

  useEffect(() => {
    if (isOpen && event && (event.event_type === 'content' || event.event_type === 'task')) {
      fetchEventDetails()
    }
  }, [isOpen, event, fetchEventDetails])

  const navigateToSource = () => {
    if (event?.event_type === 'content') {
      // Navigate to content page - you might want to highlight the specific content
      window.location.hash = '/content'
    } else if (event?.event_type === 'task') {
      // Navigate to tasks page - you might want to highlight the specific task
      window.location.hash = '/tasks'
    }
    onClose()
  }

  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {event.event_type === 'content' ? 'Content Details' : 'Task Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : details ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {details.title}
              </h3>
              
              {details.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {details.description}
                </p>
              )}
            </div>

            {event.event_type === 'content' && details && 'platform' in details && (
              <>
                {details.platform && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Platform:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">{details.platform}</span>
                  </div>
                )}
                
                {details.content_type && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">{details.content_type}</span>
                  </div>
                )}
                
                {details.scheduled_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {new Date(details.scheduled_date).toLocaleString()}
                    </span>
                  </div>
                )}
                
                {details.status && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                      details.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : details.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {details.status}
                    </span>
                  </div>
                )}
              </>
            )}

            {event.event_type === 'task' && details && 'priority' in details && (
              <>
                {details.priority && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority:</span>
                    <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                      details.priority === 'high' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : details.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {details.priority}
                    </span>
                  </div>
                )}
                
                {details.status && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                      details.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : details.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {details.status.replace('_', ' ')}
                    </span>
                  </div>
                )}
                
                {details.due_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {new Date(details.due_date).toLocaleString()}
                    </span>
                  </div>
                )}
                
                {details.assignee && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned to:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {details.assignee.full_name}
                    </span>
                  </div>
                )}
              </>
            )}

            {details.creator && (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created by:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {details.creator.full_name}
                </span>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={navigateToSource}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Go to {event.event_type === 'content' ? 'Content' : 'Tasks'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Failed to load details
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const { profile } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false)
  const [dayDetailDate, setDayDetailDate] = useState<Date | null>(null)
  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false)
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch calendar events (visible to all)
      const { data: calendarEvents, error: calendarError } = await supabase
        .from('calendar_events')
        .select(`
          *,
          creator:created_by(full_name)
        `)
        .gte('start_date', new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString())
        .lte('start_date', new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString())

      if (calendarError && calendarError.code !== 'PGRST116') throw calendarError

      let contentData = null
      let taskData = null

      // Fetch content scheduled dates (only for super_admin and social_media_admin)
      if (profile?.role === 'super_admin' || profile?.role === 'social_media_admin') {
        const { data, error: contentError } = await supabase
          .from('content_plans')
          .select(`
            id,
            title,
            scheduled_date,
            creator:created_by(full_name)
          `)
          .not('scheduled_date', 'is', null)
          .gte('scheduled_date', new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString())
          .lte('scheduled_date', new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString())

        if (contentError) throw contentError
        contentData = data
        console.log('Content data fetched:', contentData)
      }

      // Fetch task due dates (role-based filtering)
      if (profile?.role === 'super_admin' || profile?.role === 'hr_admin') {
        // Super admin and HR admin see all tasks
        const { data, error: taskError } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            due_date,
            assignee:assigned_to(full_name)
          `)
          .not('due_date', 'is', null)
          .gte('due_date', new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString())
          .lte('due_date', new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString())

        if (taskError) throw taskError
        taskData = data
      } else if (profile?.role === 'developer') {
        // Developers see only their assigned tasks
        const { data, error: taskError } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            due_date,
            assignee:assigned_to(full_name)
          `)
          .eq('assigned_to', profile.id)
          .not('due_date', 'is', null)
          .gte('due_date', new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString())
          .lte('due_date', new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString())

        if (taskError) throw taskError
        taskData = data
      }

      // Combine all events
      const allEvents: CalendarEvent[] = [
        // Calendar events (only if table exists)
        ...(calendarEvents || []).map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          start_date: event.start_date,
          end_date: event.end_date,
          event_type: event.event_type,
          color: event.color,
          created_by: event.created_by,
          creator: event.creator
        })),
        // Content events
        ...(contentData || []).map(content => ({
          id: `content-${content.id}`,
          title: `📱 ${content.title}`,
          start_date: content.scheduled_date,
          event_type: 'content' as const,
          color: '#8B5CF6', // purple
          source_id: content.id,
          created_by: '',
          creator: Array.isArray(content.creator) ? content.creator[0] : content.creator
        })),
        // Task events
        ...(taskData || []).map(task => ({
          id: `task-${task.id}`,
          title: `✅ ${task.title}`,
          start_date: task.due_date,
          event_type: 'task' as const,
          color: '#F59E0B', // amber
          source_id: task.id,
          created_by: '',
          creator: Array.isArray(task.assignee) ? task.assignee[0] : task.assignee
        }))
      ]

      console.log('All events combined:', allEvents, 'Role:', profile?.role)
      setEvents(allEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events')
    } finally {
      setLoading(false)
    }
  }, [currentDate, profile?.role, profile?.id])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId.startsWith('content-') && !eventId.startsWith('task-')) {
      if (!confirm('Are you sure you want to delete this event?')) return

      try {
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', eventId)

        if (error) throw error
        fetchEvents()
      } catch (err) {
        console.error('Error deleting event:', err)
      }
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const eventTypeIcons = {
    content: FileText,
    task: CheckSquare,
    meeting: Users,
    event: Calendar,
    deadline: Clock
  }

  const days = getDaysInMonth(currentDate)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Helper functions for the new modals
  const handleDayClick = (date: Date) => {
    setDayDetailDate(date)
    setIsDayDetailModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    if (event.event_type === 'content' || event.event_type === 'task') {
      setSelectedEventForDetail(event)
      setIsEventDetailModalOpen(true)
    }
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setIsAddModalOpen(true)
    setIsDayDetailModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">Schedule and manage events</p>
        </div>
        <button 
          onClick={() => {
            setSelectedDate(new Date())
            setEditingEvent(null)
            setIsAddModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Calendar Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button 
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setView('month')}
            className={`px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg ${
              view === 'month' ? 'bg-blue-500 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <div 
              key={index} 
              className="min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              {day && (
                <div className="h-full p-2">
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={() => handleDayClick(day)}
                      className={`text-sm font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded ${
                        day.toDateString() === new Date().toDateString() 
                          ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                          : 'text-gray-900 dark:text-white p-1'
                      }`}
                      title="View all events for this day"
                    >
                      {day.getDate()}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDate(day)
                        setEditingEvent(null)
                        setIsAddModalOpen(true)
                      }}
                      className="text-gray-400 hover:text-blue-500 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    {getEventsForDate(day).slice(0, 3).map((event) => {
                      const IconComponent = eventTypeIcons[event.event_type]
                      const isUserEvent = !event.id.startsWith('content-') && !event.id.startsWith('task-')
                      const { profile } = useAuthStore.getState()
                      const canEditEvent = isUserEvent && (
                        event.created_by === profile?.id || 
                        profile?.role === 'super_admin' || 
                        profile?.role === 'hr_admin'
                      )
                      
                      return (
                        <div
                          key={event.id}
                          className="group relative flex items-center text-xs p-1 rounded cursor-pointer"
                          style={{ backgroundColor: `${event.color}20`, borderLeft: `3px solid ${event.color}` }}
                          onClick={() => {
                            if (event.event_type === 'content' || event.event_type === 'task') {
                              handleEventClick(event)
                            } else if (canEditEvent) {
                              setEditingEvent(event)
                              setIsAddModalOpen(true)
                            }
                          }}
                        >
                          <IconComponent className="w-3 h-3 mr-1 flex-shrink-0" style={{ color: event.color }} />
                          <span className="text-gray-900 dark:text-white truncate flex-1">
                            {event.title}
                          </span>
                          {(event.event_type === 'content' || event.event_type === 'task') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEventClick(event)
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500"
                              title="View details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                          {canEditEvent && (
                            <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingEvent(event)
                                  setIsAddModalOpen(true)
                                }}
                                className="text-gray-400 hover:text-blue-500"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteEvent(event.id)
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {getEventsForDate(day).length > 3 && (
                      <div 
                        className="text-xs text-blue-600 dark:text-blue-400 px-1 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300"
                        onClick={() => handleDayClick(day)}
                      >
                        +{getEventsForDate(day).length - 3} more - click to view all
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Event Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Event Types</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Content</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Tasks</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Meetings</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Events</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Deadlines</span>
          </div>
        </div>
      </div>

      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedDate(null)
          setEditingEvent(null)
        }}
        onEventAdded={fetchEvents}
        selectedDate={selectedDate || undefined}
        editingEvent={editingEvent}
      />

      {/* Day Detail Modal */}
      <DayDetailModal
        isOpen={isDayDetailModalOpen}
        onClose={() => setIsDayDetailModalOpen(false)}
        selectedDate={dayDetailDate}
        events={events}
        onEventClick={handleEventClick}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isEventDetailModalOpen}
        onClose={() => setIsEventDetailModalOpen(false)}
        event={selectedEventForDetail}
      />
    </div>
  )
}
import { useState } from 'react'
import { X, GraduationCap, Star, Mail, Phone, MapPin, User, Calendar, Award } from 'lucide-react'
import toast from 'react-hot-toast'

interface Student {
  id: string
  student_id: string
  full_name: string
  email: string
  phone: string
  major: string
  year: number
  gpa: number
  points: number
  status: 'active' | 'inactive' | 'graduated' | 'suspended'
  enrollment_date: string
  graduation_date?: string
  address: string
  emergency_contact: string
  emergency_phone: string
  created_at: string
  updated_at: string
}

interface StudentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  student: Student
  onUpdatePoints: (studentId: string, newPoints: number) => void
}

export default function StudentDetailsModal({ isOpen, onClose, student, onUpdatePoints }: StudentDetailsModalProps) {
  const [showPointsEditor, setShowPointsEditor] = useState(false)
  const [newPoints, setNewPoints] = useState(student.points)

  if (!isOpen) return null

  const handleUpdatePoints = () => {
    if (newPoints < 0) {
      toast.error('Points cannot be negative')
      return
    }
    onUpdatePoints(student.id, newPoints)
    setShowPointsEditor(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100 text-green-800', text: 'Active' },
      inactive: { bg: 'bg-gray-100 text-gray-800', text: 'Inactive' },
      graduated: { bg: 'bg-blue-100 text-blue-800', text: 'Graduated' },
      suspended: { bg: 'bg-red-100 text-red-800', text: 'Suspended' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg}`}>
        {config.text}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                {student.full_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{student.full_name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{student.student_id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <div className="flex items-center mt-1">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white">{student.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                    <div className="flex items-center mt-1">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white">{student.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Major</label>
                    <div className="flex items-center mt-1">
                      <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white">{student.major}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Year</label>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white">Year {student.year}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Address
                </h3>
                <p className="text-gray-900 dark:text-white">{student.address || 'Not provided'}</p>
              </div>

              {/* Emergency Contact */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Emergency Contact
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Contact Name</label>
                    <span className="text-gray-900 dark:text-white">{student.emergency_contact || 'Not provided'}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Contact Phone</label>
                    <span className="text-gray-900 dark:text-white">{student.emergency_phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats & Status */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status</h3>
                <div className="flex justify-center">
                  {getStatusBadge(student.status)}
                </div>
              </div>

              {/* Academic Stats */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Academic Performance
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{student.gpa.toFixed(2)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">GPA</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-500 mr-1" />
                      <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{student.points}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Points</div>
                    
                    {!showPointsEditor ? (
                      <button
                        onClick={() => {
                          setShowPointsEditor(true)
                          setNewPoints(student.points)
                        }}
                        className="mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Update Points
                      </button>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <input
                          type="number"
                          min="0"
                          value={newPoints}
                          onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                          autoFocus
                        />
                        <div className="flex space-x-1">
                          <button
                            onClick={handleUpdatePoints}
                            className="flex-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowPointsEditor(false)}
                            className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Important Dates
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Enrollment Date</label>
                    <span className="text-sm text-gray-900 dark:text-white">{formatDate(student.enrollment_date)}</span>
                  </div>
                  {student.graduation_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Graduation Date</label>
                      <span className="text-sm text-gray-900 dark:text-white">{formatDate(student.graduation_date)}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                    <span className="text-sm text-gray-900 dark:text-white">{formatDate(student.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

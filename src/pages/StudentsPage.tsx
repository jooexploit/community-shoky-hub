import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Star, Award, BookOpen, Edit2, Trash2, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/activities'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import AddStudentModal from '../components/modals/AddStudentModal'
import StudentDetailsModal from '../components/modals/StudentDetailsModal'
import EditStudentModal from '../components/modals/EditStudentModal'

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

interface StudentStats {
  total: number
  active: number
  graduated: number
  averageGpa: number
  totalPoints: number
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'gpa' | 'points' | 'year'>('name')
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    active: 0,
    graduated: 0,
    averageGpa: 0,
    totalPoints: 0
  })

  const calculateStats = useCallback(() => {
    const total = students.length
    const active = students.filter(s => s.status === 'active').length
    const graduated = students.filter(s => s.status === 'graduated').length
    const averageGpa = total > 0 ? students.reduce((sum, s) => sum + s.gpa, 0) / total : 0
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0)

    setStats({ total, active, graduated, averageGpa, totalPoints })
  }, [students])

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [calculateStats])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }  }
  const handleUpdatePoints = async (studentId: string, newPoints: number) => {
    // Find the student to get their name for logging
    const student = students.find(s => s.id === studentId)
    const oldPoints = student?.points || 0

    try {
      const { error } = await supabase
        .from('students')
        .update({ points: newPoints, updated_at: new Date().toISOString() })
        .eq('id', studentId)

      if (error) throw error
      
      // Log the activity
      if (student) {
        await logActivity(`updated points for ${student.full_name}: ${oldPoints} → ${newPoints}`, {
          student_id: student.student_id,
          student_name: student.full_name,
          old_points: oldPoints,
          new_points: newPoints
        })
      }
      
      toast.success('Points updated successfully')
      fetchStudents()
    } catch (error) {
      console.error('Error updating points:', error)
      toast.error('Failed to update points')
    }
  }
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    // Find the student to get their name for logging
    const studentToDelete = students.find(s => s.id === studentId)

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (error) throw error
      
      // Log the activity
      if (studentToDelete) {
        await logActivity(`deleted student: ${studentToDelete.full_name}`, {
          student_id: studentToDelete.student_id,
          student_name: studentToDelete.full_name
        })
      }
      
      toast.success('Student deleted successfully')
      fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error('Failed to delete student')
    }
  }

  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.major.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterStatus === 'all' || student.status === filterStatus
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.full_name.localeCompare(b.full_name)
        case 'gpa':
          return b.gpa - a.gpa
        case 'points':
          return b.points - a.points
        case 'year':
          return a.year - b.year
        default:
          return 0
      }
    })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100 text-green-800', text: 'Active' },
      inactive: { bg: 'bg-gray-100 text-gray-800', text: 'Inactive' },
      graduated: { bg: 'bg-blue-100 text-blue-800', text: 'Graduated' },
      suspended: { bg: 'bg-red-100 text-red-800', text: 'Suspended' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
        {config.text}
      </span>
    )
  }

  const exportStudents = () => {
    const csvContent = [
      ['Student ID', 'Name', 'Email', 'Major', 'Year', 'GPA', 'Points', 'Status'],
      ...filteredStudents.map(student => [
        student.student_id,
        student.full_name,
        student.email,
        student.major,
        student.year.toString(),
        student.gpa.toString(),
        student.points.toString(),
        student.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Student Management</h1>
              <p className="text-blue-100">Manage student records, grades, and achievements</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={exportStudents}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors flex items-center font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average GPA</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageGpa.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'gpa' | 'points' | 'year')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="name">Sort by Name</option>
              <option value="gpa">Sort by GPA</option>
              <option value="points">Sort by Points</option>
              <option value="year">Sort by Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Major & Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  GPA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {student.full_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {student.student_id} • {student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{student.major}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Year {student.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {student.gpa.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.points}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(student.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">                      <button
                        onClick={() => {
                          setSelectedStudent(student)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(student)
                          setShowEditModal(true)
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No students found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by adding a new student.
              </p>
            </div>
          )}
        </div>
      </div>      {/* Modals */}
      {showAddModal && (
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchStudents()
            setShowAddModal(false)
          }}
        />
      )}

      {showDetailsModal && selectedStudent && (
        <StudentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedStudent(null)
          }}
          student={selectedStudent}
          onUpdatePoints={handleUpdatePoints}
        />
      )}

      {showEditModal && selectedStudent && (
        <EditStudentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedStudent(null)
          }}
          student={selectedStudent}
          onSuccess={() => {
            fetchStudents()
            setShowEditModal(false)
            setSelectedStudent(null)
          }}
        />
      )}
    </div>
  )
}

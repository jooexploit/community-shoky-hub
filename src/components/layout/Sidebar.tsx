import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  FolderOpen,
  BarChart3,
  FileText,
  Building2,
  LogOut,
  Crown,
  UserCheck,
  Megaphone,
  Code,
  X,
  GraduationCap,
  Bell,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const roleIcons = {
  super_admin: Crown,
  hr_admin: UserCheck,
  social_media_admin: Megaphone,
  developer: Code,
}

const roleColors = {
  super_admin: 'text-yellow-500',
  hr_admin: 'text-green-500',
  social_media_admin: 'text-purple-500',
  developer: 'text-orange-500',
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuthStore()

  if (!profile) return null

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'hr_admin', 'social_media_admin', 'developer'] },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['super_admin', 'developer'] },
    { name: 'Calendar', href: '/calendar', icon: Calendar, roles: ['super_admin', 'hr_admin', 'social_media_admin', 'developer'] },
    { name: 'Assets', href: '/assets', icon: FolderOpen, roles: ['super_admin', 'social_media_admin'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['super_admin', 'hr_admin'] },
    { name: 'Students', href: '/students', icon: GraduationCap, roles: ['super_admin', 'hr_admin'] },
    { name: 'Content', href: '/content', icon: FileText, roles: ['super_admin', 'social_media_admin'] },
    { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['super_admin'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['super_admin'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(profile.role)
  )

  const RoleIcon = roleIcons[profile.role]

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0`}>
      <div className="flex flex-col h-full">
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Shoky Hub
            </h1>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center ${roleColors[profile.role]}`}>
              <RoleIcon className="w-5 h-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {profile.full_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {profile.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => {
                // Close sidebar on mobile when navigation item is clicked
                if (window.innerWidth < 1024) {
                  onClose()
                }
              }}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => signOut()}
            className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
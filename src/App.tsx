import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import { useNotificationStore } from './stores/notificationStore'
import { pushNotificationService } from './lib/pushNotifications'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard'
import HRAdminDashboard from './pages/dashboards/HRAdminDashboard'
import SocialMediaAdminDashboard from './pages/dashboards/SocialMediaAdminDashboard'
import DeveloperDashboard from './pages/dashboards/DeveloperDashboard'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'
import AssetsPage from './pages/AssetsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import UsersPage from './pages/UsersPage'
import StudentsPage from './pages/StudentsPage'
import ContentPage from './pages/ContentPage'
import NotificationsPage from './pages/NotificationsPage'
import NotificationDebug from './pages/NotificationDebug'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { NotificationToast } from './components/ui/NotificationToast'

function App() {
  const { user, profile, loading, initialize } = useAuthStore()
  const { isDark } = useThemeStore()
  const { subscribeToNotifications, checkPushSubscription, fetchNotifications } = useNotificationStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (user && profile) {
      // Initialize push notification service
      pushNotificationService.initializePushNotifications()
      
      // Check current push subscription status
      checkPushSubscription()
      
      // Fetch initial notifications
      fetchNotifications()
      
      // Subscribe to real-time notifications
      const unsubscribe = subscribeToNotifications(user.id)
      
      return unsubscribe
    }
  }, [user, profile, subscribeToNotifications, checkPushSubscription, fetchNotifications])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <Router>
        <div className={isDark ? 'dark' : ''}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
            }}
          />
          <NotificationToast />
        </div>
      </Router>
    )
  }

  const getDashboardComponent = () => {
    switch (profile.role) {
      case 'super_admin':
        return <SuperAdminDashboard />
      case 'hr_admin':
        return <HRAdminDashboard />
      case 'social_media_admin':
        return <SocialMediaAdminDashboard />
      case 'developer':
        return <DeveloperDashboard />
      default:
        return <Navigate to="/login" replace />
    }
  }

  const canAccess = (requiredRoles: string[]) => {
    return requiredRoles.includes(profile.role)
  }

  return (
    <Router>
      <div className={isDark ? 'dark' : ''}>
        <Routes>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={getDashboardComponent()} />
            
            {canAccess(['super_admin', 'developer']) && (
              <Route path="/tasks" element={<TasksPage />} />
            )}
            
            {canAccess(['super_admin', 'hr_admin', 'social_media_admin', 'developer']) && (
              <Route path="/calendar" element={<CalendarPage />} />
            )}
            
            {canAccess(['super_admin', 'social_media_admin']) && (
              <Route path="/assets" element={<AssetsPage />} />
            )}
            
            {canAccess(['super_admin']) && (
              <Route path="/analytics" element={<AnalyticsPage />} />
            )}

            {canAccess(['super_admin']) && (
              <Route path="/notifications" element={<NotificationsPage />} />
            )}

            {canAccess(['super_admin']) && (
              <Route path="/debug" element={<NotificationDebug />} />
            )}
            
            {canAccess(['super_admin', 'hr_admin']) && (
              <Route path="/users" element={<UsersPage />} />
            )}

            {canAccess(['super_admin', 'hr_admin']) && (
              <Route path="/students" element={<StudentsPage />} />
            )}
            
            {canAccess(['super_admin', 'social_media_admin']) && (
              <Route path="/content" element={<ContentPage />} />
            )}
          </Route>
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
          }}
        />
        <NotificationToast />
      </div>
    </Router>
  )
}

export default App
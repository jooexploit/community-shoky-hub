import { supabase } from './supabase'

export const logActivity = async (action: string, details?: Record<string, unknown>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action,
          details,
          created_at: new Date().toISOString()
        }
      ])
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

export const getRecentActivities = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        users:user_id (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error fetching activities:', error)
    return []
  }
}

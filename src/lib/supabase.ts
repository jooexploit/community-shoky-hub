import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'super_admin' | 'hr_admin' | 'social_media_admin' | 'developer'
          avatar_url?: string
          created_at: string
          updated_at: string
          last_login?: string
          is_active: boolean
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'super_admin' | 'hr_admin' | 'social_media_admin' | 'developer'
          avatar_url?: string
          created_at?: string
          updated_at?: string
          last_login?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'super_admin' | 'hr_admin' | 'social_media_admin' | 'developer'
          avatar_url?: string
          created_at?: string
          updated_at?: string
          last_login?: string
          is_active?: boolean
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description?: string
          status: 'todo' | 'in_progress' | 'done'
          priority: 'low' | 'medium' | 'high'
          assigned_to: string
          created_by: string
          due_date?: string
          created_at: string
          updated_at: string
          board_id?: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high'
          assigned_to: string
          created_by: string
          due_date?: string
          created_at?: string
          updated_at?: string
          board_id?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high'
          assigned_to?: string
          created_by?: string
          due_date?: string
          created_at?: string
          updated_at?: string
          board_id?: string
        }
      }
      content_plans: {
        Row: {
          id: string
          title: string
          content: string
          platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'all'
          status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published'
          created_by: string
          approved_by?: string
          scheduled_date?: string
          created_at: string
          updated_at: string
          feedback?: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          platform?: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'all'
          status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published'
          created_by: string
          approved_by?: string
          scheduled_date?: string
          created_at?: string
          updated_at?: string
          feedback?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          platform?: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'all'
          status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published'
          created_by?: string
          approved_by?: string
          scheduled_date?: string
          created_at?: string
          updated_at?: string
          feedback?: string
        }
      }
      assets: {
        Row: {
          id: string
          name: string
          description?: string
          asset_url: string
          asset_type: string
          category?: string
          tags?: string[]
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          asset_url: string
          asset_type: string
          category?: string
          tags?: string[]
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          asset_url?: string
          asset_type?: string
          category?: string
          tags?: string[]
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          title: string
          description?: string
          start_date: string
          end_date?: string
          event_type: 'meeting' | 'event' | 'deadline' | 'content' | 'task'
          color: string
          source_id?: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          start_date: string
          end_date?: string
          event_type?: 'meeting' | 'event' | 'deadline' | 'content' | 'task'
          color?: string
          source_id?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          event_type?: 'meeting' | 'event' | 'deadline' | 'content' | 'task'
          color?: string
          source_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          details?: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: Record<string, unknown>
          created_at?: string
        }
      }
    }
  }
}
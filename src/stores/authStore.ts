import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
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

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role?: 'super_admin' | 'hr_admin' | 'social_media_admin' | 'developer') => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  updateLastLogin: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      set({ user: data.user, profile })
      await get().updateLastLogin()
    }
  },

  signUp: async (email: string, password: string, fullName: string, role: 'super_admin' | 'hr_admin' | 'social_media_admin' | 'developer' = 'developer') => {
    // Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) throw profileError

      set({ user: data.user, profile })
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, profile: null })
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error

        set({ user: session.user, profile })
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set({ loading: false })
    }
  },

  updateLastLogin: async () => {
    const { profile } = get()
    if (!profile) return

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profile.id)
  },
}))
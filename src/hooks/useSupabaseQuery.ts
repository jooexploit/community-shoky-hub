import { useState, useEffect } from 'react'
import { PostgrestResponse } from '@supabase/supabase-js'

export function useSupabaseQuery<T>(
  query: () => Promise<PostgrestResponse<T>>
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await query()
        
        if (response.error) {
          throw new Error(response.error.message)
        }

        setData(response.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [query])

  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await query()
      
      if (response.error) {
        throw new Error(response.error.message)
      }

      setData(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

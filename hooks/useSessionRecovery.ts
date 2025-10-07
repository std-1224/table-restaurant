import { useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Hook to handle session recovery when users return to the app
 * This hook monitors for session issues and attempts recovery
 */
export function useSessionRecovery() {
  const { session, refreshSession, sessionError, clearSessionError } = useAuth()
  const queryClient = useQueryClient()

  // Handle visibility change (when user returns to tab)
  const handleVisibilityChange = useCallback(async () => {
    if (document.visibilityState === 'visible') {
      console.log('App became visible, checking session validity')
      
      // Check if we have a session
      if (session) {
        try {
          // Test if the current session is still valid
          const { data, error } = await supabase.auth.getUser()
          
          if (error) {
            console.log('Session validation failed, attempting refresh:', error.message)
            
            // Try to refresh the session
            const refreshSuccess = await refreshSession()
            
            if (refreshSuccess) {
              console.log('Session refreshed successfully')
              // Invalidate all queries to refetch with new session
              queryClient.invalidateQueries()
            } else {
              console.log('Session refresh failed')
            }
          } else {
            console.log('Session is still valid')
            // Clear any previous session errors
            if (sessionError) {
              clearSessionError()
            }
          }
        } catch (error) {
          console.error('Error checking session validity:', error)
        }
      }
    }
  }, [session, refreshSession, sessionError, clearSessionError, queryClient])

  // Handle online/offline events
  const handleOnline = useCallback(async () => {
    console.log('App came back online, checking session')
    
    if (session) {
      try {
        // When coming back online, verify session is still valid
        const { error } = await supabase.auth.getUser()
        
        if (error) {
          console.log('Session invalid after coming online, refreshing')
          await refreshSession()
        }
        
        // Refetch all queries when coming back online
        queryClient.invalidateQueries()
      } catch (error) {
        console.error('Error handling online event:', error)
      }
    }
  }, [session, refreshSession, queryClient])

  // Handle focus events (when user focuses the window)
  const handleFocus = useCallback(async () => {
    // Similar to visibility change but for window focus
    if (session) {
      try {
        const { error } = await supabase.auth.getUser()
        
        if (error && error.message?.includes('JWT expired')) {
          console.log('JWT expired on focus, refreshing session')
          await refreshSession()
        }
      } catch (error) {
        console.error('Error handling focus event:', error)
      }
    }
  }, [session, refreshSession])

  // Set up event listeners
  useEffect(() => {
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    
    // Listen for window focus
    window.addEventListener('focus', handleFocus)
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('focus', handleFocus)
    }
  }, [handleVisibilityChange, handleOnline, handleFocus])

  // Periodic session check (every 5 minutes when app is active)
  useEffect(() => {
    if (!session) return

    const interval = setInterval(async () => {
      // Only check if document is visible
      if (document.visibilityState === 'visible') {
        try {
          const { error } = await supabase.auth.getUser()
          
          if (error) {
            console.log('Periodic session check failed, refreshing')
            await refreshSession()
          }
        } catch (error) {
          console.error('Error in periodic session check:', error)
        }
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [session, refreshSession])

  return {
    sessionError,
    clearSessionError
  }
}

/**
 * Hook to handle session errors from API calls
 */
export function useSessionErrorHandler() {
  const { refreshSession } = useAuth()
  const queryClient = useQueryClient()

  const handleSessionError = useCallback(async (error: any) => {
    console.log('Handling session error:', error)
    
    // Try to refresh the session
    const refreshSuccess = await refreshSession()
    
    if (refreshSuccess) {
      console.log('Session refreshed after error, invalidating queries')
      // Invalidate all queries to retry with new session
      queryClient.invalidateQueries()
      return true
    }
    
    return false
  }, [refreshSession, queryClient])

  return { handleSessionError }
}

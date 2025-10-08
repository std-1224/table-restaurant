"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

interface SessionRecoveryProviderProps {
  children: React.ReactNode
}

/**
 * Provider that handles session recovery when users return to the app
 * This component monitors for various scenarios where session recovery is needed
 */
export function SessionRecoveryProvider({ children }: SessionRecoveryProviderProps) {
  const { session, refreshSession, sessionError, clearSessionError } = useAuth()
  const queryClient = useQueryClient()
  const [isRecovering, setIsRecovering] = useState(false)

  // Handle page visibility changes (user switching tabs/windows)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && session && !isRecovering) {
        setIsRecovering(true)
        
        try {
          
          // Test current session validity
          const { error } = await supabase.auth.getUser()
          
          if (error) {
            console.log('Session invalid, attempting refresh:', error.message)
            
            const refreshSuccess = await refreshSession()
            
            if (refreshSuccess) {
              console.log('Session refreshed successfully')
              // Invalidate all queries to refetch with new session
              queryClient.invalidateQueries()
            }
          } else {
          }
        } catch (error) {
          console.error('Error during session validation:', error)
        } finally {
          setIsRecovering(false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session, refreshSession, queryClient, isRecovering])

  // Handle network reconnection
  useEffect(() => {
    const handleOnline = async () => {
      if (session && !isRecovering) {
        setIsRecovering(true)
        
        try {
          console.log('Network reconnected, validating session...')
          
          // When coming back online, check session validity
          const { error } = await supabase.auth.getUser()
          
          if (error) {
            console.log('Session invalid after reconnection, refreshing')
            await refreshSession()
          }
          
          // Refetch all queries when coming back online
          queryClient.invalidateQueries()
        } catch (error) {
          console.error('Error handling network reconnection:', error)
        } finally {
          setIsRecovering(false)
        }
      }
    }

    window.addEventListener('online', handleOnline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [session, refreshSession, queryClient, isRecovering])

  // Handle window focus (user returning to the window)
  useEffect(() => {
    const handleFocus = async () => {
      if (session && !isRecovering) {
        setIsRecovering(true)
        
        try {
          
          const { error } = await supabase.auth.getUser()
          
          if (error && error.message?.includes('JWT expired')) {
            console.log('JWT expired on focus, refreshing session')
            await refreshSession()
          }
        } catch (error) {
          console.error('Error handling window focus:', error)
        } finally {
          setIsRecovering(false)
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [session, refreshSession, isRecovering])

  // Periodic session health check (every 5 minutes when active)
  useEffect(() => {
    if (!session) return

    const interval = setInterval(async () => {
      // Only check if document is visible and not already recovering
      if (document.visibilityState === 'visible' && !isRecovering) {
        try {
          const { error } = await supabase.auth.getUser()
          
          if (error) {
            console.log('Periodic session check failed, refreshing')
            setIsRecovering(true)
            await refreshSession()
            setIsRecovering(false)
          }
        } catch (error) {
          console.error('Error in periodic session check:', error)
          setIsRecovering(false)
        }
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [session, refreshSession, isRecovering])

  // Handle session errors from API calls
  useEffect(() => {
    const handleAuthError = async (event: CustomEvent) => {
      if (!isRecovering) {
        setIsRecovering(true)
        
        try {
          console.log('Auth error received, attempting session recovery:', event.detail)
          
          const refreshSuccess = await refreshSession()
          
          if (refreshSuccess) {
            console.log('Session recovered after auth error')
            queryClient.invalidateQueries()
          } else {
            console.log('Session recovery failed')
          }
        } catch (error) {
          console.error('Error handling auth error:', error)
        } finally {
          setIsRecovering(false)
        }
      }
    }

    window.addEventListener('auth-error', handleAuthError as EventListener)
    
    return () => {
      window.removeEventListener('auth-error', handleAuthError as EventListener)
    }
  }, [refreshSession, queryClient, isRecovering])

  // Handle session errors by clearing React Query cache
  useEffect(() => {
    if (sessionError) {
      console.log('Session error detected, clearing React Query cache')
      queryClient.clear()

      // Clear the error after a short delay to prevent infinite loops
      const timeout = setTimeout(() => {
        clearSessionError()
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [sessionError, clearSessionError, queryClient])

  return <>{children}</>
}

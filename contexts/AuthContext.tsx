"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  email: string
  name: string
  phone: string
  role: 'client' | 'staff' | 'master' | 'admin'
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  sessionError: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshSession: () => Promise<boolean>
  clearSessionError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)

        // Check if it's an authentication error
        if (error.message?.includes('JWT expired') ||
            error.message?.includes('Invalid JWT') ||
            error.code === 'PGRST301' ||
            error.code === 'PGRST302') {
          setSessionError('Session expired. Please sign in again.')
          await handleSessionExpired()
          return null
        }

        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const handleSessionExpired = async () => {
    console.log('Session expired, clearing auth state')

    try {
      // Clear the session from Supabase
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out expired session:', error)
    }

    // Clear local state
    setUser(null)
    setProfile(null)
    setSession(null)
    setSessionError('Your session has expired. Please sign in again.')

    // Redirect to auth page
    router.push('/auth')
  }

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Error refreshing session:', error)
        await handleSessionExpired()
        return false
      }

      if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
        setSessionError(null)

        // Refresh profile data
        const userProfile = await fetchProfile(data.session.user.id)
        setProfile(userProfile)

        return true
      }

      return false
    } catch (error) {
      console.error('Error refreshing session:', error)
      await handleSessionExpired()
      return false
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const updatedProfile = await fetchProfile(user.id)
      setProfile(updatedProfile)
    }
  }

  const clearSessionError = () => {
    setSessionError(null)
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      setSessionError(null)
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const checkAccess = (userProfile: Profile | null) => {
    if (!userProfile) return false

    // Check if user has valid role
    if (userProfile.role === 'client') {
      return false
    }

    // Check if user has allowed role
    return ['staff', 'master', 'admin'].includes(userProfile.role)
  }

  useEffect(() => {
    // Listen for auth errors from React Query
    const handleAuthError = (event: CustomEvent) => {
      console.log('Auth error received from React Query:', event.detail)
      handleSessionExpired()
    }

    window.addEventListener('auth-error', handleAuthError as EventListener)

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)

          // Check if it's a session-related error
          if (error.message?.includes('JWT expired') ||
              error.message?.includes('Invalid JWT') ||
              error.message?.includes('session_not_found')) {
            setSessionError('Session expired. Please sign in again.')
          }

          setLoading(false)
          return
        }

        if (session && session.user) {
          // Check if session is still valid by testing it
          const { data: testData, error: testError } = await supabase.auth.getUser()

          if (testError) {
            console.error('Session validation failed:', testError)
            await handleSessionExpired()
            setLoading(false)
            return
          }

          setSession(session)
          setUser(session.user)
          setSessionError(null)

          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)

          // Handle routing based on current path and user permissions
          const isAuthPage = pathname?.startsWith('/auth')
          const isRoleAccessPage = pathname === '/role-access'
          const hasAccess = checkAccess(userProfile)

          if (isAuthPage && hasAccess) {
            // User is on auth page but has access, redirect to dashboard
            router.push('/')
          } else if (!isAuthPage && !isRoleAccessPage && !hasAccess) {
            // User is on protected page but doesn't have access
            if (userProfile?.role === 'client') {
              router.push('/role-access')
            } else {
              router.push('/auth')
            }
          }
        } else {
          // No session
          const isAuthPage = pathname?.startsWith('/auth')
          const isRoleAccessPage = pathname === '/role-access'

          if (!isAuthPage && !isRoleAccessPage) {
            router.push('/auth')
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        setSessionError('Failed to initialize session. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    return () => {
      window.removeEventListener('auth-error', handleAuthError as EventListener)
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
          setSessionError(null)
        }

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          // Clear all state
          setSession(null)
          setUser(null)
          setProfile(null)
          setSessionError(null)
          router.push('/auth')
          return
        }

        if (session && session.user) {
          setSession(session)
          setUser(session.user)
          setSessionError(null)

          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)

          // Handle routing for auth state changes
          if (event === 'SIGNED_IN') {
            const hasAccess = checkAccess(userProfile)

            if (hasAccess) {
              router.push('/')
            } else if (userProfile?.role === 'client') {
              router.push('/role-access')
            } else {
              router.push('/auth')
            }
          }
        } else if (event !== 'INITIAL_SESSION') {
          // Only clear state if it's not the initial session check
          setSession(null)
          setUser(null)
          setProfile(null)

          // Don't redirect if we're already on auth pages
          const isAuthPage = pathname?.startsWith('/auth')
          const isRoleAccessPage = pathname === '/role-access'

          if (!isAuthPage && !isRoleAccessPage) {
            router.push('/auth')
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname])

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    sessionError,
    signOut,
    refreshProfile,
    refreshSession,
    clearSessionError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

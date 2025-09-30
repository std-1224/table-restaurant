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
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
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
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const updatedProfile = await fetchProfile(user.id)
      setProfile(updatedProfile)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        if (session && session.user) {
          setSession(session)
          setUser(session.user)
          
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
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)

        console.log('session: ', session)
        
        if (session && session.user) {
          setSession(session)
          setUser(session.user)
          
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
        } else {
          // Signed out
          setSession(null)
          setUser(null)
          setProfile(null)
          
          if (event === 'SIGNED_OUT') {
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
    signOut,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: ('staff' | 'master' | 'admin')[]
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = ['staff', 'master', 'admin'],
  fallbackPath = '/auth'
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // No user, redirect to auth
      if (!user) {
        router.push(fallbackPath)
        return
      }

      // No profile, redirect to auth
      if (!profile) {
        router.push(fallbackPath)
        return
      }

      // User is client, redirect to role access page
      if (profile.role === 'client') {
        router.push('/role-access')
        return
      }

      // Check if user has required role
      if (!requiredRoles.includes(profile.role)) {
        router.push('/role-access')
        return
      }
    }
  }, [user, profile, loading, router, requiredRoles, fallbackPath])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated or authorized
  if (!user || !profile || profile.role === 'client' || profile.status !== 'active' || !requiredRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Checking permissions...</div>
      </div>
    )
  }

  return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: ('staff' | 'master' | 'admin')[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

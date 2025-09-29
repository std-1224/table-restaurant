"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          setError(error.message)
          setTimeout(() => router.push('/auth'), 3000)
          return
        }

        if (data.session && data.session.user) {
          const user = data.session.user

          // Check if profile exists
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            // Error other than "not found"
            console.error('Error checking profile:', profileError)
            setError('Error checking user profile')
            setTimeout(() => router.push('/auth'), 3000)
            return
          }

          // If profile doesn't exist, create it
          if (!existingProfile) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                phone: user.user_metadata?.phone || '',
                role: 'client', // Default role
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (insertError) {
              console.error('Error creating profile:', insertError)
              setError('Error creating user profile')
              setTimeout(() => router.push('/auth'), 3000)
              return
            }
          }

          // Check user role and redirect accordingly
          const profile = existingProfile || {
            role: 'client',
            status: 'active'
          }

          if (profile.role === 'client') {
            router.push('/role-access')
            return
          }

          if (['staff', 'master', 'admin'].includes(profile.role)) {
            router.push('/')
            return
          }

          // Fallback - shouldn't reach here
          router.push('/role-access')
        } else {
          // No session, redirect to auth
          router.push('/auth')
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        setError('An unexpected error occurred')
        setTimeout(() => router.push('/auth'), 3000)
      } finally {
        setIsLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-lg">Authentication Error</div>
          <div className="text-gray-300">{error}</div>
          <div className="text-gray-500 text-sm">Redirecting to login...</div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <div className="text-white">Completing authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Redirecting...</div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

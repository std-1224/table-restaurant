"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [redirectUrl, setRedirectUrl] = useState<string>('')

  // Set redirect URL on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRedirectUrl(`${window.location.origin}/auth/callback`)
    }
  }, [])

  // Redirect if user is already authenticated and has proper role
  useEffect(() => {
    if (user && profile) {
      // Check if user has access
      if (profile.role === 'client') {
        router.push('/role-access')
      } else if (['staff', 'master', 'admin'].includes(profile.role)) {
        router.push('/')
      }
    }
  }, [user, profile, router])

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in:', session.user.id)
        
        // Check if profile exists, if not create one
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!existingProfile) {
          // Create profile for new user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
              phone: session.user.user_metadata?.phone || '',
              role: 'client', // Default role
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (profileError) {
            console.error('Error creating profile:', profileError)
          } else {
            console.log('Profile created successfully')
          }
        }

        // Small delay to allow profile to be created/fetched
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Don't render auth form if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-center text-gray-300">
              Redirecting...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Don't render auth form until redirect URL is set (client-side only)
  if (!redirectUrl) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-center text-gray-300">
              Loading...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Restaurant Dashboard
          </CardTitle>
          <p className="text-gray-400 mt-2">
            Sign in to access the restaurant management system
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#374151',
                    defaultButtonBackgroundHover: '#4b5563',
                    defaultButtonBorder: '#6b7280',
                    defaultButtonText: '#f9fafb',
                    dividerBackground: '#374151',
                    inputBackground: '#1f2937',
                    inputBorder: '#374151',
                    inputBorderHover: '#4b5563',
                    inputBorderFocus: '#3b82f6',
                    inputText: '#f9fafb',
                    inputLabelText: '#d1d5db',
                    inputPlaceholder: '#9ca3af',
                    messageText: '#f87171',
                    messageTextDanger: '#f87171',
                    anchorTextColor: '#60a5fa',
                    anchorTextHoverColor: '#93c5fd',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                    labelBottomMargin: '8px',
                    anchorBottomMargin: '4px',
                    emailInputSpacing: '4px',
                    socialAuthSpacing: '4px',
                    buttonPadding: '10px 15px',
                    inputPadding: '10px 15px',
                  },
                  fontSizes: {
                    baseBodySize: '13px',
                    baseInputSize: '14px',
                    baseLabelSize: '14px',
                    baseButtonSize: '14px',
                  },
                  fonts: {
                    bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '6px',
                    buttonBorderRadius: '6px',
                    inputBorderRadius: '6px',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
                label: 'auth-label',
                loader: 'auth-loader',
                message: 'auth-message',
                anchor: 'auth-anchor',
              },
            }}
            providers={['google']}
            redirectTo={redirectUrl}
            onlyThirdPartyProviders={false}
            magicLink={false}
            showLinks={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign In',
                  loading_button_label: 'Signing in...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                },
                sign_up: {
                  email_label: 'Email address',
                  password_label: 'Create a password',
                  button_label: 'Sign Up',
                  loading_button_label: 'Signing up...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: "Don't have an account? Sign up",
                  confirmation_text: 'Check your email for the confirmation link',
                },
                magic_link: {
                  email_input_label: 'Email address',
                  email_input_placeholder: 'Your email address',
                  button_label: 'Send magic link',
                  loading_button_label: 'Sending magic link...',
                  link_text: 'Send a magic link email',
                  confirmation_text: 'Check your email for the magic link',
                },
                forgotten_password: {
                  email_label: 'Email address',
                  password_label: 'Your password',
                  email_input_placeholder: 'Your email address',
                  button_label: 'Send reset instructions',
                  loading_button_label: 'Sending reset instructions...',
                  link_text: 'Forgot your password?',
                  confirmation_text: 'Check your email for the password reset link',
                },
                update_password: {
                  password_label: 'New password',
                  password_input_placeholder: 'Your new password',
                  button_label: 'Update password',
                  loading_button_label: 'Updating password...',
                  confirmation_text: 'Your password has been updated',
                },
                verify_otp: {
                  email_input_label: 'Email address',
                  email_input_placeholder: 'Your email address',
                  phone_input_label: 'Phone number',
                  phone_input_placeholder: 'Your phone number',
                  token_input_label: 'Verification code',
                  token_input_placeholder: 'Your verification code',
                  button_label: 'Verify',
                  loading_button_label: 'Signing in...',
                },
              },
            }}
          />
          
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-300 text-center">
              <strong>Note:</strong> New accounts are created with "client" role by default. 
              Only staff, master, and admin roles can access the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

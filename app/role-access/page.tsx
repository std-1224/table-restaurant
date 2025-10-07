"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Shield, ArrowLeft, Mail, Phone } from "lucide-react"

export default function RoleAccessPage() {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()

  useEffect(() => {
    const getProfile = async () => {
      try {
        // Wait for auth context to finish loading
        if (authLoading) {
          return
        }

        if (!user) {
          router.push('/auth')
          return
        }

        // Get user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
        } else {
          setProfile(profile)
        }
      } catch (error) {
        console.error('Error getting profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()
  }, [user, router, authLoading])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleContactSupport = () => {
    // You can customize this to open email client or redirect to support page
    window.location.href = 'mailto:support@restaurant.com?subject=Access Request&body=Hello, I would like to request access to the restaurant dashboard. My account details are below:'
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Access Restricted
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="border-red-800 bg-red-900/50">
            <Shield className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              Your account does not have permission to access the restaurant dashboard.
            </AlertDescription>
          </Alert>

          {profile && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-semibold text-white">Account Information</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  
                  {profile.name && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="w-4 h-4 flex items-center justify-center text-xs">👤</span>
                      <span>{profile.name}</span>
                    </div>
                  )}
                  
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="w-4 h-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center text-xs">🏷️</span>
                    <span className="text-gray-300">Role: </span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-200">
                      {profile.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-200 mb-2">Need Access?</h4>
                <p className="text-blue-300 text-sm mb-3">
                  If you believe you should have access to the restaurant dashboard, please contact your administrator or support team.
                </p>
                <p className="text-blue-300 text-sm">
                  <strong>Allowed roles:</strong> Staff, Master, Admin
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleContactSupport}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Restaurant Dashboard v1.0
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

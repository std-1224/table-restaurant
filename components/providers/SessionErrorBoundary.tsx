"use client"

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error boundary specifically for handling session-related errors
 * This catches errors that might occur during session recovery or API calls
 */
export class SessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SessionErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Check if it's a session-related error
    const isSessionError = error.message?.includes('JWT expired') ||
                          error.message?.includes('Invalid JWT') ||
                          error.message?.includes('session_not_found') ||
                          error.message?.includes('refresh_token_not_found')

    if (isSessionError) {
      console.log('Session error detected in error boundary')
      
      // Dispatch auth error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-error', { detail: error }))
      }
    }
  }

  handleReload = () => {
    // Clear the error state and reload the page
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    // Reload the page to restart the app
    window.location.reload()
  }

  handleRetry = () => {
    // Just clear the error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      const isSessionError = this.state.error?.message?.includes('JWT expired') ||
                            this.state.error?.message?.includes('Invalid JWT') ||
                            this.state.error?.message?.includes('session_not_found') ||
                            this.state.error?.message?.includes('refresh_token_not_found')

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">
                {isSessionError ? 'Session Error' : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {isSessionError 
                  ? 'Your session has expired or is invalid. Please refresh the page to sign in again.'
                  : 'An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReload} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
                {!isSessionError && (
                  <Button onClick={this.handleRetry} variant="outline" className="w-full">
                    Try Again
                  </Button>
                )}
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-md text-sm">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

import { QueryClient } from '@tanstack/react-query'

// Helper function to check if error is authentication related
const isAuthError = (error: any): boolean => {
  // Check for Supabase auth errors
  if (error?.message?.includes('JWT expired') ||
      error?.message?.includes('Invalid JWT') ||
      error?.message?.includes('session_not_found') ||
      error?.message?.includes('refresh_token_not_found')) {
    return true
  }

  // Check for HTTP auth errors
  if (error?.status === 401 || error?.status === 403) {
    return true
  }

  // Check for Supabase specific error codes
  if (error?.code === 'PGRST301' || error?.code === 'PGRST302') {
    return true
  }

  return false
}

// Helper function to handle authentication errors
const handleAuthError = (error: any) => {
  console.warn('Authentication error detected:', error)

  // Clear any cached auth data
  if (typeof window !== 'undefined') {
    // Clear React Query cache for auth-related queries
    queryClient.clear()

    // Trigger a page reload to restart the auth flow
    // This will be handled by the AuthContext
    window.dispatchEvent(new CustomEvent('auth-error', { detail: error }))
  }
}

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Cache time: how long data stays in cache after component unmounts
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (isAuthError(error)) {
          handleAuthError(error)
          return false
        }

        // Don't retry on other 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }

        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Add error handling for queries
      onError: (error: any) => {
        if (isAuthError(error)) {
          handleAuthError(error)
        }
      },
    },
    mutations: {
      // Retry failed mutations
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (isAuthError(error)) {
          handleAuthError(error)
          return false
        }

        // Retry once for other errors
        return failureCount < 1
      },
      // Add error handling for mutations
      onError: (error: any) => {
        if (isAuthError(error)) {
          handleAuthError(error)
        }
      },
    },
  },
})

// Query keys for consistent cache management
export const queryKeys = {
  // Tables
  tables: ['tables'] as const,
  table: (id: string) => ['tables', id] as const,
  tableOrders: (tableId: string) => ['tables', tableId, 'orders'] as const,
  tableSessions: (tableId: string) => ['tables', tableId, 'sessions'] as const,
  
  // Notifications
  notifications: ['notifications'] as const,
  tableNotifications: (tableId: string) => ['notifications', 'table', tableId] as const,
  
  // Analytics
  analytics: ['analytics'] as const,
  dashboardAnalytics: ['analytics', 'dashboard'] as const,
  
  // Orders
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  
  // Sessions
  sessions: ['sessions'] as const,
  activeSessions: ['sessions', 'active'] as const,
} as const

// Helper function to invalidate related queries
export const invalidateTableQueries = (tableId?: string) => {
  if (tableId) {
    // Invalidate specific table queries
    queryClient.invalidateQueries({ queryKey: queryKeys.table(tableId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.tableOrders(tableId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.tableSessions(tableId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.tableNotifications(tableId) })
  }
  
  // Always invalidate general queries
  queryClient.invalidateQueries({ queryKey: queryKeys.tables })
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
  queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
}

// Helper function to invalidate order queries
export const invalidateOrderQueries = (orderId?: string) => {
  if (orderId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) })
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.orders })
}

// Helper function to invalidate session queries
export const invalidateSessionQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
  queryClient.invalidateQueries({ queryKey: queryKeys.activeSessions })
}

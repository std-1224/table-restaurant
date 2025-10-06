import { QueryClient } from '@tanstack/react-query'

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
        // Don't retry on 4xx errors (client errors)
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
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
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

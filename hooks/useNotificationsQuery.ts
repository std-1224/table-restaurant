import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'

// Interface for notifications from database
interface DatabaseNotification {
  id: string
  table_id: string
  type: 'waiter_call' | 'bill_request' | 'special_request'
  status: 'pending' | 'resolved'
  created_at: string
  resolved_at: string | null
  table: {
    table_number: number
  }
}

// Frontend notification interface
export interface Notification {
  id: number
  type: 'new_order' | 'bill_request' | 'waiter_call' | 'special_request'
  tableId: string
  message: string
  timestamp: Date
  dismissed: boolean
}

// Function to fetch notifications
async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('table_notifications')
    .select(`
      *,
      table:tables!table_id (
        table_number
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }

  if (!data) return []

  // Transform database notifications to frontend format
  return data.map((dbNotification: DatabaseNotification) => ({
    id: parseInt(dbNotification.id.slice(-8), 16), // Convert UUID to number for compatibility
    type: dbNotification.type === 'waiter_call' ? 'waiter_call' : 
          dbNotification.type === 'bill_request' ? 'bill_request' : 'special_request',
    tableId: dbNotification.table_id,
    message: getNotificationMessage(dbNotification.type, dbNotification.table.table_number),
    timestamp: new Date(dbNotification.created_at),
    dismissed: false,
  }))
}

// Helper function to generate notification messages
function getNotificationMessage(type: string, tableNumber: number): string {
  switch (type) {
    case 'waiter_call':
      return   `Mesa ${tableNumber} solicita atención del mesero`
    case 'bill_request':
      return `Mesa ${tableNumber} solicita la cuenta`
    case 'special_request':
      return `Mesa ${tableNumber} tiene una solicitud especial`
    default:
      return `Mesa ${tableNumber} tiene una notificación para un nuevo orden`
  }
}

// Hook to fetch all notifications
export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: fetchNotifications,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute as backup to real-time
    // Enhanced error handling for session issues
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('JWT expired') ||
          error?.message?.includes('Invalid JWT') ||
          error?.code === 'PGRST301' ||
          error?.code === 'PGRST302') {
        return false
      }
      return failureCount < 3
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

// Hook to get notification statistics
export function useNotificationStats(notifications: Notification[]) {
  const activeNotifications = notifications.filter(n => !n.dismissed)

  const stats = {
    total: activeNotifications.length,
    waiterCall: activeNotifications.filter(n => n.type === 'waiter_call').length,
    billRequest: activeNotifications.filter(n => n.type === 'bill_request').length,
    specialRequest: activeNotifications.filter(n => n.type === 'special_request').length,
    newOrder: activeNotifications.filter(n => n.type === 'new_order').length,
  }

  return stats
}

// Hook for paginated notifications with "see more" functionality
export function usePaginatedNotifications(notifications: Notification[], initialLimit: number = 3) {
  const [visibleCount, setVisibleCount] = useState(initialLimit)
  const [isExpanded, setIsExpanded] = useState(false)

  const visibleNotifications = notifications.slice(0, visibleCount)
  const hasMore = notifications.length > visibleCount
  const remainingCount = notifications.length - visibleCount

  const showMore = useCallback(() => {
    const nextCount = Math.min(visibleCount + initialLimit, notifications.length)
    setVisibleCount(nextCount)
    setIsExpanded(nextCount >= notifications.length)
  }, [visibleCount, initialLimit, notifications.length])

  const showLess = useCallback(() => {
    setVisibleCount(initialLimit)
    setIsExpanded(false)
  }, [initialLimit])

  const showAll = useCallback(() => {
    setVisibleCount(notifications.length)
    setIsExpanded(true)
  }, [notifications.length])

  // Reset when notifications change
  useEffect(() => {
    if (notifications.length <= initialLimit) {
      setVisibleCount(notifications.length)
      setIsExpanded(false)
    } else {
      setVisibleCount(prev => {
        if (prev > notifications.length) {
          setIsExpanded(true)
          return notifications.length
        }
        return prev
      })
    }
  }, [notifications.length, initialLimit])

  return {
    visibleNotifications,
    hasMore,
    remainingCount,
    isExpanded,
    showMore,
    showLess,
    showAll,
    visibleCount,
    totalCount: notifications.length
  }
}

// Hook for notification filtering and sorting
export function useNotificationFilters(notifications: Notification[]) {
  const [filter, setFilter] = useState<'all' | 'waiter_call' | 'bill_request' | 'special_request' | 'new_order'>('all')
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority' | 'table'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const priorityOrder = {
    'special_request': 4,
    'waiter_call': 3,
    'bill_request': 2,
    'new_order': 1
  }

  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications

    // Apply filter
    if (filter !== 'all') {
      filtered = notifications.filter(n => n.type === filter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime()
          break
        case 'priority':
          comparison = (priorityOrder[a.type] || 0) - (priorityOrder[b.type] || 0)
          break
        case 'table':
          comparison = a.tableId.localeCompare(b.tableId)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [notifications, filter, sortBy, sortOrder])

  return {
    filteredNotifications: filteredAndSortedNotifications,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    totalFiltered: filteredAndSortedNotifications.length
  }
}

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getTableOrdersForTable, OrderWithItems } from '@/lib/api/tables'
import { queryKeys } from '@/lib/react-query'
import { useTableSessionQuery } from './useTableSessionQuery'
import { FrontendTable } from '@/lib/supabase'
import { useRestaurantStore } from '@/lib/store'
import { useTablesQuery } from './useTablesQuery'

// Enhanced hook to fetch orders for a specific table with optimized caching
export function useTableOrdersQuery(tableId: string | null) {
  return useQuery({
    queryKey: queryKeys.tableOrders(tableId || ''),
    queryFn: () => {
      if (!tableId) return Promise.resolve([])
      return getTableOrdersForTable(tableId)
    },
    enabled: !!tableId, // Only run query if tableId is provided
    staleTime: 1000 * 30, // 30 seconds - orders change frequently
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes after component unmounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when connection is restored
    // Background refetch every minute as backup to real-time
    refetchInterval: (query) => {
      // Only refetch if query is not in error state and has data
      return query.state.status === 'success' ? 1000 * 60 : false
    },
  })
}

// Comprehensive hook that fetches all table details (orders + session) with smart caching
export function useTableDetailsQuery(table: FrontendTable | null) {
  const tableId = table?.id || null

  // Fetch orders with caching
  const ordersQuery = useTableOrdersQuery(tableId)

  // Fetch session data with caching
  const sessionQuery = useTableSessionQuery(tableId)

  // Combine loading states intelligently
  const isLoading = ordersQuery.isLoading || sessionQuery.isLoading
  const isFetching = ordersQuery.isFetching || sessionQuery.isFetching
  const isError = ordersQuery.isError || sessionQuery.isError

  // Return combined data and states
  return {
    // Data
    orders: ordersQuery.data || [],
    session: sessionQuery.data,
    totalSpent: sessionQuery.data?.total_spent || 0,

    // Loading states
    isLoading, // Initial loading
    isFetching, // Background refetching
    isError,

    // Individual query states for granular control
    ordersQuery,
    sessionQuery,

    // Utility
    hasData: (ordersQuery.data && ordersQuery.data.length > 0) || !!sessionQuery.data,
  }
}

// Hook to get order statistics
export function useOrderStats(orders: OrderWithItems[]) {
  const stats = {
    total: orders.length,
    pending: orders.filter(order => order.status === 'pending').length,
    preparing: orders.filter(order => order.status === 'preparing').length,
    ready: orders.filter(order => order.status === 'ready').length,
    delivered: orders.filter(order => order.status === 'delivered').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length,
    paid: orders.filter(order => order.status === 'paid').length,
  }

  return stats
}

// Hook to prefetch table details for better UX
export function usePrefetchTableDetails() {
  const queryClient = useQueryClient()

  const prefetchTableDetails = (tableId: string) => {
    // Prefetch orders
    queryClient.prefetchQuery({
      queryKey: queryKeys.tableOrders(tableId),
      queryFn: () => getTableOrdersForTable(tableId),
      staleTime: 1000 * 30,
    })

    // Prefetch session - using the same function from useTableSessionQuery
    queryClient.prefetchQuery({
      queryKey: queryKeys.tableSessions(tableId),
      queryFn: async () => {
        const { supabase } = await import('@/lib/supabase')
        const { data, error } = await supabase
          .from('table_sessions')
          .select('*')
          .eq('table_id', tableId)
          .eq('status', 'active')
          .order('start_time', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error('Error fetching table session:', error)
          throw error
        }

        return data
      },
      staleTime: 1000 * 30,
    })
  }

  return { prefetchTableDetails }
}

// Hook to sync selected table with latest data from tables query
export function useSelectedTableSync() {
  const { selectedTable, setSelectedTable } = useRestaurantStore()
  const { data: tables } = useTablesQuery()

  useEffect(() => {
    if (!selectedTable || !tables) return

    // Find the updated table data
    const updatedTable = tables.find(table => table.id === selectedTable.id)

    if (updatedTable) {
      // Check if the table data has changed
      const hasChanged =
        updatedTable.status !== selectedTable.status ||
        updatedTable.diners !== selectedTable.diners ||
        updatedTable.waitTime !== selectedTable.waitTime ||
        updatedTable.assignedWaiter !== selectedTable.assignedWaiter

      if (hasChanged) {
        setSelectedTable(updatedTable)
      }
    } else {
      // Table no longer exists, clear selection
      console.log('Selected table no longer exists, clearing selection')
      setSelectedTable(null)
    }
  }, [tables, selectedTable, setSelectedTable])
}

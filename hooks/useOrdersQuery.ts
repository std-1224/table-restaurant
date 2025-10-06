import { useQuery } from '@tanstack/react-query'
import { getTableOrdersForTable, OrderWithItems } from '@/lib/api/tables'
import { queryKeys } from '@/lib/react-query'

// Hook to fetch orders for a specific table
export function useTableOrdersQuery(tableId: string | null) {
  return useQuery({
    queryKey: queryKeys.tableOrders(tableId || ''),
    queryFn: () => {
      if (!tableId) return Promise.resolve([])
      return getTableOrdersForTable(tableId)
    },
    enabled: !!tableId, // Only run query if tableId is provided
    staleTime: 1000 * 30, // 30 seconds - orders change frequently
    refetchInterval: 1000 * 60, // Refetch every minute as backup to real-time
  })
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

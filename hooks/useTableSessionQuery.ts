import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'

export interface TableSession {
  id: string
  table_id: string
  start_time: string
  end_time: string | null
  total_spent: number
  status: 'active' | 'closed'
}

// Function to fetch active table session
async function fetchTableSession(tableId: string): Promise<TableSession | null> {
  if (!tableId) return null

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
}

// Hook to fetch table session
export function useTableSessionQuery(tableId: string | null) {
  return useQuery({
    queryKey: queryKeys.tableSessions(tableId || ''),
    queryFn: () => fetchTableSession(tableId || ''),
    enabled: !!tableId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}

// Hook to get total spent for a table
export function useTableTotalSpent(tableId: string | null) {
  const { data: session } = useTableSessionQuery(tableId)
  return session?.total_spent || 0
}

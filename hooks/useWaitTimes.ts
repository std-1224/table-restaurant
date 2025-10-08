import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import { FrontendTable } from '@/lib/supabase'
import { useRestaurantStore } from '@/lib/store'
import { useNotificationSound } from './useNotificationSound'

// Interface for table session data
interface TableSession {
  table_id: string
  start_time: string
}

// Function to fetch active table sessions
async function fetchActiveSessions(): Promise<TableSession[]> {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('table_id, start_time')
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching table sessions:', error)
    throw error
  }

  return data || []
}

// Hook to manage wait times
export function useWaitTimes() {
  const queryClient = useQueryClient()
  const { soundEnabled, setTipNotification } = useRestaurantStore()
  const { playNotificationSound } = useNotificationSound({ volume: 0.6 })

  // Query to fetch active sessions
  const { data: sessions = [] } = useQuery({
    queryKey: queryKeys.activeSessions,
    queryFn: fetchActiveSessions,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  })

  // Function to calculate wait time in minutes
  const calculateWaitTime = (startTime: string): number => {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    return Math.floor(diffMs / (1000 * 60)) // Convert to minutes
  }

  // Function to update tables with wait times
  const updateTablesWithWaitTimes = () => {
    const tables = queryClient.getQueryData<FrontendTable[]>(queryKeys.tables)
    if (!tables || sessions.length === 0) return

    const updatedTables = tables.map(table => {
      const session = sessions.find(s => s.table_id === table.id)
      if (session) {
        const waitTime = calculateWaitTime(session.start_time)
        
        // Trigger notification for tables waiting more than 20 minutes
        if (waitTime >= 20 && soundEnabled) {
          setTipNotification(table.id, true)
          // Play notification sound for delayed tables
          playNotificationSound()
            .then((played) => {
              if (played) {
                console.log(`Wait time notification sound played for table ${table.id}`)
              }
            })
            .catch(e => console.log('Could not play wait time notification sound:', e))
        }
        
        return { ...table, waitTime }
      }
      return { ...table, waitTime: 0 }
    })

    // Update the cache with new wait times
    queryClient.setQueryData(queryKeys.tables, updatedTables)
  }

  // Effect to update wait times every minute
  useEffect(() => {
    // Update immediately
    updateTablesWithWaitTimes()

    // Set up interval to update every minute
    const interval = setInterval(updateTablesWithWaitTimes, 60000)

    return () => clearInterval(interval)
  }, [sessions, soundEnabled, setTipNotification])

  // Return helper functions
  return {
    calculateWaitTime,
    sessions,
    updateTablesWithWaitTimes,
  }
}

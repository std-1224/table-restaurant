import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys, invalidateTableQueries, invalidateOrderQueries, invalidateSessionQueries } from '@/lib/react-query'
import { useRestaurantStore } from '@/lib/store'

// Hook to manage all real-time subscriptions
export function useRealtimeSubscriptions() {
  const queryClient = useQueryClient()
  const { soundEnabled, setTipNotification, selectedTable } = useRestaurantStore()
  const channelsRef = useRef<any[]>([])

  useEffect(() => {
    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel)
    })
    channelsRef.current = []

    // 1. Tables real-time subscription
    const tablesChannel = supabase
      .channel('tables_realtime_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
        },
        async (payload: any) => {
          try {
            console.log('Tables real-time update:', payload)
            
            // Invalidate tables query to refetch fresh data
            await queryClient.invalidateQueries({ queryKey: queryKeys.tables })
            
            // If a specific table was updated, invalidate its related queries
            if (payload.new?.id) {
              invalidateTableQueries(payload.new.id)
            }
          } catch (error) {
            console.error('Error handling tables real-time update:', error)
          }
        }
      )
      .subscribe()

    channelsRef.current.push(tablesChannel)

    // 2. Table notifications real-time subscription
    const notificationsChannel = supabase
      .channel('table_notifications_realtime_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_notifications',
        },
        async (payload: any) => {
          try {
            console.log('Notifications real-time update:', payload)
            
            // Invalidate notifications query
            await queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
            
            // Handle new notifications with sound/visual alerts
            if (payload.eventType === 'INSERT' && payload.new) {
              const notification = payload.new
              
              // Set tip notification for the table
              if (notification.table_id) {
                setTipNotification(notification.table_id, true)
                
                // Play sound if enabled
                if (soundEnabled) {
                  try {
                    const audio = new Audio('/notification-sound.mp3')
                    audio.volume = 0.5
                    audio.play().catch(e => console.log('Could not play notification sound:', e))
                  } catch (e) {
                    console.log('Could not create audio element:', e)
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error handling notifications real-time update:', error)
          }
        }
      )
      .subscribe()

    channelsRef.current.push(notificationsChannel)

    // 3. Table sessions real-time subscription
    const sessionsChannel = supabase
      .channel('table_sessions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_sessions',
        },
        async (payload: any) => {
          try {
            console.log('Sessions real-time update:', payload)
            
            // Invalidate session queries
            invalidateSessionQueries()
            
            // If a specific table session was updated, invalidate table queries
            if (payload.new?.table_id) {
              invalidateTableQueries(payload.new.table_id)
            }
          } catch (error) {
            console.error('Error handling sessions real-time update:', error)
          }
        }
      )
      .subscribe()

    channelsRef.current.push(sessionsChannel)

    // 4. Orders real-time subscription (for order status changes)
    const ordersChannel = supabase
      .channel('orders_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async (payload: any) => {
          try {
            console.log('Orders real-time update:', payload)
            
            // Invalidate order queries
            invalidateOrderQueries(payload.new?.id)
            
            // If we have a selected table, check if this order belongs to it
            if (selectedTable?.id) {
              // Check if this order belongs to the selected table
              const { data: tableOrder } = await supabase
                .from('table_orders')
                .select('id')
                .eq('table_id', selectedTable.id)
                .eq('order_id', payload.new?.id)
                .single()

              if (tableOrder) {
                // This order belongs to the selected table, invalidate its orders
                await queryClient.invalidateQueries({ 
                  queryKey: queryKeys.tableOrders(selectedTable.id) 
                })
              }
            }
          } catch (error) {
            console.error('Error handling orders real-time update:', error)
          }
        }
      )
      .subscribe()

    channelsRef.current.push(ordersChannel)

    // 5. Table orders real-time subscription (for table-order relationships)
    const tableOrdersChannel = supabase
      .channel('table_orders_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_orders',
        },
        async (payload: any) => {
          try {
            console.log('Table orders real-time update:', payload)
            
            // Invalidate table orders for the affected table
            if (payload.new?.table_id) {
              await queryClient.invalidateQueries({ 
                queryKey: queryKeys.tableOrders(payload.new.table_id) 
              })
            }
          } catch (error) {
            console.error('Error handling table orders real-time update:', error)
          }
        }
      )
      .subscribe()

    channelsRef.current.push(tableOrdersChannel)

    // Cleanup function
    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [queryClient, soundEnabled, setTipNotification, selectedTable?.id])

  // Return subscription status
  return {
    isConnected: channelsRef.current.length > 0,
    channelCount: channelsRef.current.length,
  }
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchTables, 
  createTable as createTableAPI, 
  updateTableStatus,
  CreateTableData,
  createTableSession,
  closeTableSession,
  createTableNotification
} from '@/lib/api/tables'
import { queryKeys, invalidateTableQueries } from '@/lib/react-query'
import { FrontendTable, DatabaseTableStatus } from '@/lib/supabase'
import { useRestaurantStore } from '@/lib/store'

// Hook to fetch all tables
export function useTablesQuery() {
  return useQuery({
    queryKey: queryKeys.tables,
    queryFn: fetchTables,
    staleTime: 1000 * 30, // 30 seconds - tables change frequently
    refetchInterval: 1000 * 60, // Refetch every minute as backup to real-time
    // Enhanced error handling for session issues
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors - let the global handler deal with it
      if (error?.message?.includes('JWT expired') ||
          error?.message?.includes('Invalid JWT') ||
          error?.code === 'PGRST301' ||
          error?.code === 'PGRST302') {
        return false
      }
      return failureCount < 3
    },
    // Refetch when user returns to the app
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

// Hook to create a new table
export function useCreateTableMutation() {
  const queryClient = useQueryClient()
  const setError = useRestaurantStore((state) => state.setError)
  
  return useMutation({
    mutationFn: (tableData: CreateTableData) => createTableAPI(tableData),
    onSuccess: (newTable) => {
      // Optimistically add the new table to the cache
      queryClient.setQueryData<FrontendTable[]>(queryKeys.tables, (old) => {
        if (!old) return [newTable]
        return [...old, newTable]
      })
      
      // Invalidate to ensure consistency
      invalidateTableQueries()
      setError(null)
    },
    onError: (error: any) => {
      console.error('Failed to create table:', error)
      setError(error.message || 'Failed to create table')
    },
  })
}

// Hook to update table status
export function useUpdateTableStatusMutation() {
  const queryClient = useQueryClient()
  const setError = useRestaurantStore((state) => state.setError)
  
  return useMutation({
    mutationFn: ({ tableId, status }: { tableId: string; status: DatabaseTableStatus }) =>
      updateTableStatus(tableId, status),
    onMutate: async ({ tableId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tables })
      
      // Snapshot the previous value
      const previousTables = queryClient.getQueryData<FrontendTable[]>(queryKeys.tables)
      
      // Optimistically update the cache
      queryClient.setQueryData<FrontendTable[]>(queryKeys.tables, (old) => {
        if (!old) return old
        return old.map((table) =>
          table.id === tableId ? { ...table, status } : table
        )
      })
      
      // Return a context object with the snapshotted value
      return { previousTables }
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTables) {
        queryClient.setQueryData(queryKeys.tables, context.previousTables)
      }
      console.error('Failed to update table status:', error)
      setError(error.message || 'Failed to update table status')
    },
    onSettled: (data, error, { tableId }) => {
      // Always refetch after error or success to ensure consistency
      invalidateTableQueries(tableId)
      if (!error) {
        setError(null)
      }
    },
  })
}

// Hook to create table session
export function useCreateTableSessionMutation() {
  const queryClient = useQueryClient()
  const setError = useRestaurantStore((state) => state.setError)
  
  return useMutation({
    mutationFn: ({ tableId, diners }: { tableId: string; diners: number }) =>
      createTableSession(tableId, diners),
    onSuccess: (data, { tableId }) => {
      invalidateTableQueries(tableId)
      setError(null)
    },
    onError: (error: any) => {
      console.error('Failed to create table session:', error)
      setError(error.message || 'Failed to create table session')
    },
  })
}

// Hook to close table session
export function useCloseTableSessionMutation() {
  const queryClient = useQueryClient()
  const setError = useRestaurantStore((state) => state.setError)
  
  return useMutation({
    mutationFn: (tableId: string) => closeTableSession(tableId),
    onSuccess: (data, tableId) => {
      invalidateTableQueries(tableId)
      setError(null)
    },
    onError: (error: any) => {
      console.error('Failed to close table session:', error)
      setError(error.message || 'Failed to close table session')
    },
  })
}

// Hook to create table notification
export function useCreateTableNotificationMutation() {
  const queryClient = useQueryClient()
  const setError = useRestaurantStore((state) => state.setError)
  
  return useMutation({
    mutationFn: ({ 
      tableId, 
      type 
    }: { 
      tableId: string; 
      type: 'waiter_call' | 'bill_request' | 'special_request' 
    }) => createTableNotification(tableId, type),
    onSuccess: (data, { tableId }) => {
      invalidateTableQueries(tableId)
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      setError(null)
    },
    onError: (error: any) => {
      console.error('Failed to create table notification:', error)
      setError(error.message || 'Failed to create table notification')
    },
  })
}

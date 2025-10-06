import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { DatabaseTableStatus } from './supabase'

// Types for the store
export interface Table {
  id: string
  number: string
  status: DatabaseTableStatus
  orders: any[]
  waitTime?: number
  diners?: number
  assignedWaiter?: string
  startTime?: Date
}

export interface Notification {
  id: number
  type: 'new_order' | 'bill_request' | 'waiter_call' | 'special_request'
  tableId: string
  message: string
  timestamp: Date
  dismissed: boolean
}

// UI State interface
interface UIState {
  // View and filter states
  currentView: 'comandera' | 'barra' | 'supervisor'
  tableFilter: string
  barFilter: string

  // Selected table
  selectedTable: Table | null
  selectedTableId: string | null // For better performance and React Query integration

  // Modal states
  isCreateTableModalOpen: boolean

  // Notification states
  soundEnabled: boolean
  tipNotifications: { [key: string]: boolean }

  // Error states
  error: string | null
}

// Actions interface
interface UIActions {
  // View and filter actions
  setCurrentView: (view: 'comandera' | 'barra' | 'supervisor') => void
  setTableFilter: (filter: string) => void
  setBarFilter: (filter: string) => void

  // Selected table actions
  setSelectedTable: (table: Table | null) => void
  setSelectedTableId: (tableId: string | null) => void

  // Modal actions
  setIsCreateTableModalOpen: (open: boolean) => void

  // Notification actions
  setSoundEnabled: (enabled: boolean) => void
  setTipNotification: (tableId: string, enabled: boolean) => void
  dismissTipNotification: (tableId: string) => void

  // Error actions
  setError: (error: string | null) => void
  clearError: () => void

  // Reset actions
  reset: () => void
}

// Combined store interface
interface RestaurantStore extends UIState, UIActions {}

// Initial state
const initialState: UIState = {
  currentView: 'comandera',
  tableFilter: 'all',
  barFilter: 'all',
  selectedTable: null,
  selectedTableId: null,
  isCreateTableModalOpen: false,
  soundEnabled: true,
  tipNotifications: {},
  error: null,
}

// Create the store
export const useRestaurantStore = create<RestaurantStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // View and filter actions
        setCurrentView: (view) => set({ currentView: view }, false, 'setCurrentView'),
        setTableFilter: (filter) => set({ tableFilter: filter }, false, 'setTableFilter'),
        setBarFilter: (filter) => set({ barFilter: filter }, false, 'setBarFilter'),
        
        // Selected table actions
        setSelectedTable: (table) => set({
          selectedTable: table,
          selectedTableId: table?.id || null
        }, false, 'setSelectedTable'),
        setSelectedTableId: (tableId) => set({ selectedTableId: tableId }, false, 'setSelectedTableId'),

        // Modal actions
        setIsCreateTableModalOpen: (open) => set({ isCreateTableModalOpen: open }, false, 'setIsCreateTableModalOpen'),

        // Notification actions
        setSoundEnabled: (enabled) => set({ soundEnabled: enabled }, false, 'setSoundEnabled'),
        setTipNotification: (tableId, enabled) =>
          set((state) => ({
            tipNotifications: { ...state.tipNotifications, [tableId]: enabled }
          }), false, 'setTipNotification'),
        dismissTipNotification: (tableId) =>
          set((state) => ({
            tipNotifications: { ...state.tipNotifications, [tableId]: false }
          }), false, 'dismissTipNotification'),
        
        // Error actions
        setError: (error) => set({ error }, false, 'setError'),
        clearError: () => set({ error: null }, false, 'clearError'),
        
        // Reset actions
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'restaurant-store',
        // Only persist certain UI preferences
        partialize: (state) => ({
          currentView: state.currentView,
          tableFilter: state.tableFilter,
          barFilter: state.barFilter,
          soundEnabled: state.soundEnabled,
        }),
      }
    ),
    {
      name: 'restaurant-store',
    }
  )
)

// Selectors for better performance
export const useCurrentView = () => useRestaurantStore((state) => state.currentView)
export const useSelectedTable = () => useRestaurantStore((state) => state.selectedTable)
export const useSelectedTableId = () => useRestaurantStore((state) => state.selectedTableId)
export const useTableFilter = () => useRestaurantStore((state) => state.tableFilter)
export const useBarFilter = () => useRestaurantStore((state) => state.barFilter)
export const useSoundEnabled = () => useRestaurantStore((state) => state.soundEnabled)
export const useTipNotifications = () => useRestaurantStore((state) => state.tipNotifications)
export const useError = () => useRestaurantStore((state) => state.error)
export const useIsCreateTableModalOpen = () => useRestaurantStore((state) => state.isCreateTableModalOpen)

"use client"

import { useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { LazyNotificationsSection } from "@/components/dashboard/LazyNotificationsSection"
import { LazyTablesGrid } from "@/components/dashboard/LazyTablesGrid"
import { LazyBarOrders } from "@/components/dashboard/LazyBarOrders"
import { SupervisorView } from "@/components/dashboard/SupervisorView"
import { CreateTableModal } from "@/components/dashboard/CreateTableModal"
import { LazyLoadingProvider } from "@/components/providers/LazyLoadingProvider"
import { DashboardHeaderSkeleton, TablesGridSkeleton } from "@/components/ui/loading-skeletons"
import { CreateTableData } from "@/lib/api/tables"
import { DatabaseTableStatus, dashboardMapping } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useApp } from "@/contexts/AppContext"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// New hooks and store imports
import { useRestaurantStore } from "@/lib/store"
import { useTablesQuery, useCreateTableMutation, useUpdateTableStatusMutation, useCreateTableSessionMutation, useCloseTableSessionMutation, useCreateTableNotificationMutation } from "@/hooks/useTablesQuery"
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery"
import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions"
import { useWaitTimes } from "@/hooks/useWaitTimes"

import { TableDetails } from "@/components/dashboard/TableDetails"

type OrderStatus = "pending" | "preparing" | "ready" | "delivered"
type NotificationType = "new_order" | "bill_request" | "waiter_call" | "special_request"

interface Table {
  id: string
  number: string
  status: DatabaseTableStatus
  orders: Order[]
  waitTime?: number
  diners?: number
  assignedWaiter?: string
  startTime?: Date
}

interface Order {
  id: number
  item: string
  status: OrderStatus
  timestamp: Date
}

interface BarOrder {
  id: number
  items: string[]
  status: OrderStatus
  barId: number
  timestamp: Date
  assignedBartender?: string
  drinkTypes?: { [key: string]: number }
}

interface Notification {
  id: number
  type: NotificationType
  tableId: string
  message: string
  timestamp: Date
  dismissed: boolean
}

export default function RestaurantDashboard() {
  // Auth context
  const { profile } = useAuth()

  // App context for module management
  const { isModuleEnabled, tenantModulesLoading } = useApp()

  // Zustand store state
  const {
    currentView,
    tableFilter,
    barFilter,
    soundEnabled,
    tipNotifications,
    isCreateTableModalOpen,
    error,
    setCurrentView,
    setTableFilter,
    setBarFilter,
    setSelectedTable,
    setSoundEnabled,
    setIsCreateTableModalOpen,
    setError,
    dismissTipNotification,
    setTipNotification,
  } = useRestaurantStore()

  // Tab to module mapping:
  // - commander: stockqr (Core module)
  // - Barra: stockqr_qr_tracking (QR tracking/Barra)
  // - Supervisor: stockqr_finances (Finance panel/Supervisor)

  // React Query hooks
  const { data: tables = [], isLoading: loading, error: tablesError } = useTablesQuery()
  const { data: notifications = [] } = useNotificationsQuery()

  // Mutations
  const createTableMutation = useCreateTableMutation()
  const updateTableStatusMutation = useUpdateTableStatusMutation()
  const createTableSessionMutation = useCreateTableSessionMutation()
  const closeTableSessionMutation = useCloseTableSessionMutation()
  const createTableNotificationMutation = useCreateTableNotificationMutation()

  // Real-time subscriptions
  useRealtimeSubscriptions()

  // Wait times management
  useWaitTimes()

  // Mock bar orders (keeping existing mock data for now)
  const barOrders: BarOrder[] = [
    {
      id: 1,
      items: ["Mojito", "Cerveza Corona"],
      status: "pending",
      barId: 1,
      timestamp: new Date(Date.now() - 3 * 60000),
      assignedBartender: "Pedro",
      drinkTypes: { Cocktails: 1, Cervezas: 1 },
    },
    {
      id: 2,
      items: ["Whisky Sour"],
      status: "preparing",
      barId: 1,
      timestamp: new Date(Date.now() - 7 * 60000),
      assignedBartender: "Pedro",
      drinkTypes: { Cocktails: 1 },
    },
    {
      id: 3,
      items: ["Margarita", "Tequila Shot"],
      status: "ready",
      barId: 2,
      timestamp: new Date(Date.now() - 15 * 60000),
      assignedBartender: "Sofia",
      drinkTypes: { Cocktails: 1, Shots: 1 },
    },
  ]

  // // Update selected table when tables change (real-time updates)
  // useEffect(() => {
  //   console.log("// Update selected table when tables change (real-time updates)")
  //   if (selectedTable) {
  //     const updatedSelectedTable = tables.find(table => table.id === selectedTable.id)
  //     if (updatedSelectedTable) {
  //       setSelectedTable(updatedSelectedTable)
  //     } else {
  //       // If selected table no longer exists, clear selection
  //       setSelectedTable(null)
  //     }
  //   }
  // }, [tables, selectedTable, setSelectedTable])

  // Handle errors from React Query
  useEffect(() => {
    if (tablesError) {
      setError(tablesError instanceof Error ? tablesError.message : 'Failed to load tables')
    } else {
      setError(null)
    }
  }, [tablesError, setError])

  // Active notifications (filtered from React Query data)
  const activeNotifications = notifications.filter((n) => !n.dismissed)

  // Action handlers using mutations
  const createTable = async (tableData: {
    number: number
    capacity: number
    status: DatabaseTableStatus
    assignedWaiter?: string
    fixedPrice?: number
    personalizedService?: string
  }) => {
    try {
      const createData: CreateTableData = {
        number: tableData.number,
        capacity: tableData.capacity,
        status: tableData.status,
        assignedWaiter: profile?.id,
        fixedPrice: tableData.fixedPrice,
        personalizedService: tableData.personalizedService,
      }
      await createTableMutation.mutateAsync(createData)
    } catch (err) {
      console.error('Failed to create table:', err)
      // Error handling is done in the mutation
    }
  }

  // Mock function for dismissing notifications (will be replaced with proper implementation)
  const dismissNotification = useCallback((notificationId: number) => {
    // This would typically update the notification status in the database
    console.log('Dismissing notification:', notificationId)
  }, [])

  // Function to set all tip notifications (for NotificationsSection compatibility)
  const setTipNotifications = useCallback((notifications: { [key: string]: boolean }) => {
    // Clear all current notifications and set new ones
    Object.keys(notifications).forEach(tableId => {
      setTipNotification(tableId, notifications[tableId])
    })
  }, [setTipNotification])

  // Action handlers using mutations
  const changeTableStatus = async (tableId: string, newStatus: DatabaseTableStatus) => {
    try {
      await updateTableStatusMutation.mutateAsync({ tableId, status: newStatus })

      // Handle session management
      if (newStatus === "delivered") {
        await createTableSessionMutation.mutateAsync({ tableId, diners: 1 })
      } else if (newStatus === "free") {
        await closeTableSessionMutation.mutateAsync(tableId)
      }
    } catch (err) {
      console.error('Failed to update table status:', err)
      // Error handling is done in the mutations
    }
  }



  const markBarOrderAsDelivered = (orderId: number) => {
    // Mock function for bar orders - keeping existing functionality
    console.log('Marking bar order as delivered:', orderId)
  }

  const quickFreeTable = async (tableId: string) => {
    try {
      await updateTableStatusMutation.mutateAsync({ tableId, status: "free" })
      await closeTableSessionMutation.mutateAsync(tableId)
    } catch (error) {
      console.error('Failed to free table:', error)
      // Error handling is done in the mutations
    }
  }

  const scanQRCode = async (tableId: string) => {
    try {
      await updateTableStatusMutation.mutateAsync({ tableId, status: "occupied" })
      setSelectedTable(null)
    } catch (err) {
      console.error('Failed to scan QR code:', err)
      // Error handling is done in the mutations
    }
  }

  // Dashboard analytics using the centralized mapping
  const freeTables = tables.filter(table => (dashboardMapping.free as readonly string[]).includes(table.status)).length
  const busyTables = tables.filter(table => (dashboardMapping.busy as readonly string[]).includes(table.status)).length
  const deliveredTables = tables.filter(table => (dashboardMapping.delivered as readonly string[]).includes(table.status)).length
  const paidTables = tables.filter(table => (dashboardMapping.paid as readonly string[]).includes(table.status)).length

  return (
    <LazyLoadingProvider totalComponents={6} showGlobalProgress={loading}>
      <div className="min-h-screen bg-black text-white p-2 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
        {loading ? (
          <DashboardHeaderSkeleton />
        ) : (
          <DashboardHeader
            activeNotificationsCount={activeNotifications.length}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            busyTables={busyTables}
            freeTables={freeTables}
            delayedTables={deliveredTables}
            barTables={paidTables}
          />
        )}

        <LazyNotificationsSection
          activeNotifications={activeNotifications}
          tipNotifications={tipNotifications}
          tables={tables}
          dismissNotification={dismissNotification}
          setTipNotifications={setTipNotifications}
          dismissTipNotification={dismissTipNotification}
        />

        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-12 bg-transparent border-zinc-950 gap-1 sm:gap-0 p-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="commander"
                    disabled={!isModuleEnabled('commander') && !tenantModulesLoading}
                    className={`font-medium text-xs sm:text-sm text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white border-zinc-950 bg-transparent h-10 sm:h-auto ${
                      !isModuleEnabled('commander') && !tenantModulesLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    commander
                  </TabsTrigger>
                </TooltipTrigger>
                {!isModuleEnabled('commander') && !tenantModulesLoading && (
                  <TooltipContent side="bottom">
                    <p className="text-xs">Módulo no habilitado</p>
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="barra"
                    disabled={!isModuleEnabled('commander') && !tenantModulesLoading}
                    className={`font-medium text-xs sm:text-sm text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white bg-transparent border-zinc-950 h-10 sm:h-auto ${
                      !isModuleEnabled('commander') && !tenantModulesLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Barra
                  </TabsTrigger>
                </TooltipTrigger>
                {!isModuleEnabled('commander') && !tenantModulesLoading && (
                  <TooltipContent side="bottom">
                    <p className="text-xs">Módulo no habilitado</p>
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="supervisor"
                    disabled={!isModuleEnabled('commander') && !tenantModulesLoading}
                    className={`font-medium text-xs sm:text-sm text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white bg-transparent border-zinc-950 h-10 sm:h-auto ${
                      !isModuleEnabled('commander') && !tenantModulesLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Supervisor
                  </TabsTrigger>
                </TooltipTrigger>
                {!isModuleEnabled('commander') && !tenantModulesLoading && (
                  <TooltipContent side="bottom">
                    <p className="text-xs">Módulo no habilitado</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </TabsList>

          <TabsContent value="commander" className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              <div className="xl:col-span-2">
                <div className="space-y-4 py-6">
                  <div className="flex flex-row justify-between">
                    <div className="flex items-center gap-1 text-xs bg-black/40 px-1.5 py-0.5 rounded border border-transparent">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <Select value={tableFilter} onValueChange={setTableFilter}>
                        <SelectTrigger className="w-40 lg:w-48 text-white bg-transparent border-slate-600">
                          <SelectValue placeholder="Filtrar mesas" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="all" className="text-white hover:bg-gray-700">
                            Todas
                          </SelectItem>
                          <SelectItem value="occupied" className="text-white hover:bg-gray-700">
                            Ocupadas
                          </SelectItem>
                          <SelectItem value="delayed" className="text-white hover:bg-gray-700">
                            Demoradas
                          </SelectItem>
                          <SelectItem value="bill_requested" className="text-white hover:bg-gray-700">
                            Cuenta
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      className="h-10 px-4 bg-transparent border-zinc-950 text-white hover:bg-gray-700"
                      onClick={() => setIsCreateTableModalOpen(true)}
                    >
                      Create Table
                    </Button>
                  </div>
                </div>
                {loading ? (
                  <TablesGridSkeleton count={8} />
                ) : tables.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center text-gray-400">
                      <p className="text-lg font-medium">No hay mesas disponibles</p>
                      <p className="text-sm mt-2">Crea una nueva mesa para comenzar</p>
                    </div>
                  </div>
                ) : (
                  <LazyTablesGrid
                    tables={tables}
                    quickFreeTable={quickFreeTable}
                    onCreateTable={() => setIsCreateTableModalOpen(true)}
                    batchSize={6}
                    loadingDelay={100}
                  />
                )}
              </div>
              <div className="xl:col-span-1">
                <TableDetails
                  changeTableStatus={changeTableStatus}
                  scanQRCode={scanQRCode}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="barra" className="space-y-4 lg:space-y-6">
            <LazyBarOrders
              barOrders={barOrders}
              barFilter={barFilter}
              setBarFilter={setBarFilter}
              markBarOrderAsDelivered={markBarOrderAsDelivered}
              batchSize={4}
              loadingDelay={200}
            />
          </TabsContent>

          <TabsContent value="supervisor" className="space-y-4 lg:space-y-6">
            <SupervisorView tables={tables} />
          </TabsContent>
        </Tabs>

        <CreateTableModal
          isOpen={isCreateTableModalOpen}
          onClose={() => setIsCreateTableModalOpen(false)}
          onCreateTable={createTable}
        />
      </div>
    </div>
    </LazyLoadingProvider>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { NotificationsSection } from "@/components/dashboard/NotificationsSection"
import { TablesGrid } from "@/components/dashboard/TablesGrid"
import { TableDetails } from "@/components/dashboard/TableDetails"
import { BarOrders } from "@/components/dashboard/BarOrders"
import { SupervisorView } from "@/components/dashboard/SupervisorView"
import { CreateTableModal } from "@/components/dashboard/CreateTableModal"
import { fetchTables, createTable as createTableAPI, updateTableStatus, CreateTableData, createTableSession, createTableNotification, closeTableSession } from "@/lib/api/tables"
import { DatabaseTableStatus, getDashboardAnalytics, supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

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
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [barOrders, setBarOrders] = useState<BarOrder[]>([
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
  ])

  const [selectedTable, setSelectedTable] = useState<Table | null>(null)

  const [currentView, setCurrentView] = useState<"comandera" | "barra" | "supervisor">("comandera")
  const [tableFilter, setTableFilter] = useState<string>("all")
  const [barFilter, setBarFilter] = useState<string>("all")
  const [tipNotifications, setTipNotifications] = useState<{ [key: string]: boolean }>({})
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState(false)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCounter, setNotificationCounter] = useState(1)
  const { profile } = useAuth()
  
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  useEffect(() => {
    // Update selected table if it exists to reflect real-time changes
    if (selectedTable) {
      const updatedSelectedTable = tables.find(table => table.id === selectedTable.id)
      if (updatedSelectedTable) {
        setSelectedTable(updatedSelectedTable)
      } else {
        // If selected table no longer exists, clear selection
        setSelectedTable(null)
      }
    }
  }, [tables])

  // Initial data loading effect
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedTables = await fetchTables()
        setTables(fetchedTables)
      } catch (err) {
        console.error('Failed to load initial data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load initial data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Real-time updates effect
  useEffect(() => {
    const tablesChannel = supabase
      .channel("tables_realtime_updates")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes
          schema: "public",
          table: "tables",
        },
        async (payload: any) => {
          try {
            // Skip if no ID (shouldn't happen but safeguards)
            if (!payload.new?.id && payload.eventType !== "DELETE") {
              console.warn("Payload missing ID:", payload);
              return;
            }

            // Don't show loading spinner for real-time updates
            const fetchedTables = await fetchTables()
            setTables(fetchedTables)
          } catch (err) {
            console.error('Failed to fetch real-time data:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch real-time data')
          }
        }
      )
      .subscribe();

    // Notification real-time updates
    const notificationChannel = supabase
      .channel("table_notifications_realtime_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "table_notifications",
        },
        async (payload: any) => {
          try {
            // Skip if no ID (shouldn't happen but safeguards)
            if (!payload.new?.id && payload.eventType !== "DELETE") {
              console.warn("Payload missing ID:", payload);
              return;
            }

            // Fetch the full table notification with relationships
            const { data: updatedNotification, error } = await supabase
              .from("table_notifications")
              .select(
                `
              *, table:tables!table_id(*)
            `
              )
              .eq("id", payload.new.id)
              .single();

            if (error) {
              console.error("Error fetching updated notification:", error);
              return;
            }

            setNotifications((prev) => {
              switch (payload.eventType) {
                case "INSERT":
                  // Handle different notification types
                  let newNotification: Notification;

                  switch (updatedNotification.type) {
                    case "new_order":
                      newNotification = {
                        id: notificationCounter,
                        type: "new_order",
                        tableId: updatedNotification.table_id,
                        message: `Mesa ${updatedNotification.table?.table_number || 'N/A'} ha realizado un nuevo pedido`,
                        timestamp: new Date(),
                        dismissed: false,
                      };
                      break;

                    case "bill_request":
                      newNotification = {
                        id: notificationCounter,
                        type: "bill_request",
                        tableId: updatedNotification.table_id,
                        message: `Mesa ${updatedNotification.table?.table_number || 'N/A'} tiene solicitud de factura`,
                        timestamp: new Date(),
                        dismissed: false,
                      };
                      break;
                    case "special_request":
                      newNotification = {
                        id: notificationCounter,
                        type: "special_request",
                        tableId: updatedNotification.table_id,
                        message: `Mesa ${updatedNotification.table?.table_number || 'N/A'} tiene petición especial`,
                        timestamp: new Date(),
                        dismissed: false,
                      };
                      break;
                    case "waiter_call":
                      newNotification = {
                        id: notificationCounter,
                        type: "waiter_call",
                        tableId: updatedNotification.table_id,
                        message: `Mesa ${updatedNotification.table?.table_number || 'N/A'} tiene solicitud de Llamar Mozo`,
                        timestamp: new Date(),
                        dismissed: false,
                      };
                      break;

                    default:
                      throw new Error(`Unhandled notification type: ${updatedNotification.type}`);
                  }

                  setNotificationCounter((prev) => prev + 1);
                  return [newNotification, ...prev];


                case "UPDATE":
                  return prev.map((notification) =>
                    notification.id === updatedNotification.id
                      ? {
                        ...notification,
                        ...updatedNotification,
                        timestamp: notification.timestamp, // Keep original timestamp
                      }
                      : notification
                  );

                case "DELETE":
                  return prev.filter(
                    (notification) => notification.id !== payload.old.id
                  );

                default:
                  console.warn("Unknown event type:", payload.eventType);
                  return prev;
              }
            });
          } catch (err) {
            console.error("Error processing notification update:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(tablesChannel);
    };
  }, [notificationCounter])

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
      // Create table in database
      const newTable = await createTableAPI(createData)
      setTables(prevTables => [...prevTables, newTable])
    } catch (err) {
      console.error('Failed to create table:', err)
      setError(err instanceof Error ? err.message : 'Failed to create table')
    }
  }

  const dismissNotification = (notificationId: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, dismissed: true } : n)))
  }

  const activeNotifications = notifications.filter((n) => !n.dismissed)

  // Fetch real session start times from database and update wait times
  useEffect(() => {
    const updateWaitTimes = async () => {
      try {
        // Get all active table sessions
        const { data: sessions, error } = await supabase
          .from('table_sessions')
          .select('table_id, start_time')
          .eq('status', 'active')

        if (error) {
          console.error('Error fetching table sessions:', error)
          return
        }

        if (!sessions || sessions.length === 0) {
          // No active sessions, reset all wait times
          setTables((prevTables) => {
            const updatedTables = prevTables.map((table) => ({
              ...table,
              waitTime: 0,
              startTime: undefined
            }))

            // Update selected table if it exists
            if (selectedTable) {
              const updatedSelectedTable = updatedTables.find(table => table.id === selectedTable.id)
              if (updatedSelectedTable) {
                setSelectedTable(updatedSelectedTable)
              }
            }

            return updatedTables
          })
          return
        }

        // Create a map of table_id to start_time
        const sessionMap = sessions.reduce((acc, session) => {
          acc[session.table_id] = new Date(session.start_time)
          return acc
        }, {} as { [key: string]: Date })

        setTables((prevTables) => {
          const updatedTables = prevTables.map((table) => {
            const sessionStartTime = sessionMap[table.id]

            if (sessionStartTime && table.status !== "free") {
              const waitTime = Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)

              if (waitTime >= 20 && !tipNotifications[table.id]) {
                setTipNotifications((prev) => ({ ...prev, [table.id]: true }))
                // Sound notification would be triggered here if implemented
              }

              return { ...table, waitTime, startTime: sessionStartTime }
            } else if (table.status === "free") {
              // Reset wait time for free tables
              return { ...table, waitTime: 0, startTime: undefined }
            }

            return table
          })

          // Update selected table if it exists to reflect wait time changes
          if (selectedTable) {
            const updatedSelectedTable = updatedTables.find(table => table.id === selectedTable.id)
            if (updatedSelectedTable) {
              setSelectedTable(updatedSelectedTable)
            }
          }

          return updatedTables
        })
      } catch (error) {
        console.error('Error updating wait times:', error)
      }
    }

    // Update wait times immediately
    updateWaitTimes()

    // Set up interval to update wait times every minute
    const interval = setInterval(updateWaitTimes, 60000)

    // Set up real-time subscription for table sessions
    const tableSessionsChannel = supabase
      .channel('table_sessions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_sessions',
        },
        () => {
          // When table sessions change, update wait times immediately
          updateWaitTimes()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(tableSessionsChannel)
    }
  }, [tipNotifications, soundEnabled, selectedTable?.id])

  const dismissTipNotification = (tableId: string) => {
    setTipNotifications((prev) => ({ ...prev, [tableId]: false }))
  }

  const changeTableStatus = async (tableId: string, newStatus: DatabaseTableStatus) => {
    // Store original table state for rollback
    const originalTable = tables.find(table => table.id === tableId)
    if (!originalTable) return

    // Optimistic update: Update UI immediately
    setTables(tables.map((table) => (
      table.id === tableId
        ? {
          ...table,
          status: newStatus,
          // Reset table data when setting to libre
          ...(newStatus === "free" && {
            orders: [],
            diners: 0,
            waitTime: 0,
            startTime: undefined
          })
        }
        : table
    )))
    try {
      // Update in database
      await updateTableStatus(tableId, newStatus)

      // Create table session when order is delivered
      if (newStatus === "delivered") {
        await createTableSession(tableId)
      }

      // Close table session when table becomes free
      if (newStatus === "free") {
        await closeTableSession(tableId)
      }
    } catch (err) {
      console.error('Failed to update table status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update table status')

      // Rollback: Restore original table state
      setTables(tables.map((table) => (
        table.id === tableId ? originalTable : table
      )))
      setSelectedTable(originalTable)
    }
  }

  const markBarOrderAsDelivered = (orderId: number) => {
    setBarOrders(
      barOrders.map((order) => (order.id === orderId ? { ...order, status: "entregado" as OrderStatus } : order)),
    )

    // Reset wait time for all tables that are "en-curso" (keep status as "En Curso")
    setTables(tables.map((table) => (
      table.status === "producing"
        ? { ...table, waitTime: 0, startTime: new Date() }
        : table
    )))
  }

  const quickFreeTable = async (tableId: string) => {

    try {
      // Update in database
      await updateTableStatus(tableId, "free")
      await closeTableSession(tableId)
    } catch (error) {
      console.error('Failed to free table:', error)
      setError(error instanceof Error ? error.message : 'Failed to free table')
      setTipNotifications((prev) => ({ ...prev, [tableId]: true }))
    }
  }

  const scanQRCode = async (tableId: string) => {
    // Store original table state for rollback
    const originalTable = tables.find(table => table.id === tableId)
    if (!originalTable) return

    // Optimistic update: Update UI immediately
    setTables(tables.map((table) => (
      table.id === tableId
        ? {
          ...table,
          status: "occupied" as DatabaseTableStatus,
          startTime: new Date(),
          waitTime: 0
        }
        : table
    )))
    setSelectedTable(null)
    setError(null)

    try {
      // Update in database
      await updateTableStatus(tableId, "occupied")
      } catch (err) {
      console.error('Failed to scan QR code:', err)
      setError(err instanceof Error ? err.message : 'Failed to scan QR code')

      // Rollback: Restore original table state
      setTables(tables.map((table) => (
        table.id === tableId ? originalTable : table
      )))
      setSelectedTable(originalTable)
    }
  }

  // Dashboard analytics using the centralized mapping
  const { freeTables, busyTables, deliveredTables, paidTables } = getDashboardAnalytics(tables)

  return (
    <div className="min-h-screen bg-black text-white p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
        <DashboardHeader
          activeNotificationsCount={activeNotifications.length}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          busyTables={busyTables}
          freeTables={freeTables}
          delayedTables={deliveredTables}
          barTables={paidTables}
        />

        <NotificationsSection
          activeNotifications={activeNotifications}
          tipNotifications={tipNotifications}
          tables={tables}
          dismissNotification={dismissNotification}
          setTipNotifications={setTipNotifications}
          dismissTipNotification={dismissTipNotification}
        />

        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-12 bg-transparent border-zinc-950 gap-1 sm:gap-0 p-1">
            <TabsTrigger
              value="comandera"
              className="font-medium text-xs sm:text-sm text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white border-zinc-950 bg-transparent h-10 sm:h-auto"
            >
              Comandera
            </TabsTrigger>
            <TabsTrigger
              value="barra"
              className="font-medium text-xs sm:text-sm text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white bg-transparent border-zinc-950 h-10 sm:h-auto"
            >
              Barra
            </TabsTrigger>
            <TabsTrigger
              value="supervisor"
              className="font-medium text-xs sm:text-sm text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white bg-transparent border-zinc-950 h-10 sm:h-auto"
            >
              Supervisor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comandera" className="space-y-4 lg:space-y-6">
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
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">Loading tables...</div>
                  </div>
                ) : tables.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    There are no tables
                  </div>
                ) : (
                  <TablesGrid
                    selectedTable={selectedTable}
                    tables={tables}
                    tableFilter={tableFilter}
                    setTableFilter={setTableFilter}
                    tipNotifications={tipNotifications}
                    setSelectedTable={setSelectedTable}
                    quickFreeTable={quickFreeTable}
                    onCreateTable={() => setIsCreateTableModalOpen(true)}
                    isLoadingOrders={isLoadingOrders}
                    setIsLoadingOrders={setIsLoadingOrders}
                  />
                )}
              </div>
              <div className="xl:col-span-1">
                <TableDetails
                  selectedTable={selectedTable}
                  changeTableStatus={changeTableStatus}
                  scanQRCode={scanQRCode}
                  isLoadingOrders={isLoadingOrders}
                  setIsLoadingOrders={setIsLoadingOrders}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="barra" className="space-y-4 lg:space-y-6">
            <BarOrders
              barOrders={barOrders}
              barFilter={barFilter}
              setBarFilter={setBarFilter}
              markBarOrderAsDelivered={markBarOrderAsDelivered}
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
  )
}

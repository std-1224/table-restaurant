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
import { fetchTables, createTable as createTableAPI, updateTableStatus, CreateTableData } from "@/lib/api/tables"
import { getDashboardAnalytics, DatabaseTableStatus, mapFrontendStatusToDatabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

type TableStatus = "libre" | "esperando" | "en-curso" | "cuenta-solicitada"
type OrderStatus = "pendiente" | "en-cocina" | "entregado"
type NotificationType = "new-order" | "bill-request" | "waiter-call"

interface Table {
  id: number
  number: string
  status: TableStatus
  orders: Order[]
  waitTime?: number
  diners?: number
  assignedWaiter?: string
  startTime?: Date
  dbStatus?: DatabaseTableStatus // Keep original database status for dashboard calculations
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
  tableId: number
  message: string
  timestamp: Date
  dismissed: boolean
}





export default function RestaurantDashboard() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [barOrders, setBarOrders] = useState<BarOrder[]>([
    {
      id: 1,
      items: ["Mojito", "Cerveza Corona"],
      status: "pendiente",
      barId: 1,
      timestamp: new Date(Date.now() - 3 * 60000),
      assignedBartender: "Pedro",
      drinkTypes: { Cocktails: 1, Cervezas: 1 },
    },
    {
      id: 2,
      items: ["Whisky Sour"],
      status: "en-cocina",
      barId: 1,
      timestamp: new Date(Date.now() - 7 * 60000),
      assignedBartender: "Pedro",
      drinkTypes: { Cocktails: 1 },
    },
    {
      id: 3,
      items: ["Margarita", "Tequila Shot"],
      status: "entregado",
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
  const [tipNotifications, setTipNotifications] = useState<{ [key: number]: boolean }>({})
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState(false)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCounter, setNotificationCounter] = useState(1)

  // Fetch tables on component mount
  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedTables = await fetchTables()
        setTables(fetchedTables)
      } catch (err) {
        console.error('Failed to fetch tables:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch tables')
      } finally {
        setLoading(false)
      }
    }

    loadTables()
  }, [])

  const createTable = async (tableData: {
    number: string
    capacity: number
    status: TableStatus
    assignedWaiter?: string
    fixedPrice?: number
    personalizedService?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const createData: CreateTableData = {
        number: tableData.number,
        capacity: tableData.capacity,
        status: tableData.status,
        assignedWaiter: tableData.assignedWaiter,
        fixedPrice: tableData.fixedPrice,
        personalizedService: tableData.personalizedService
      }

      const newTable = await createTableAPI(createData)
      setTables(prevTables => [...prevTables, newTable])
    } catch (err) {
      console.error('Failed to create table:', err)
      setError(err instanceof Error ? err.message : 'Failed to create table')
    } finally {
      setLoading(false)
    }
  }

  const simulateNewOrder = (tableId: number) => {
    // const table = tables.find((t) => t.id === tableId)
    // if (!table) return

    const newNotification: Notification = {
      id: notificationCounter,
      type: "new-order",
      tableId: 1,
      // message: `Mesa ${table.number} ha realizado un nuevo pedido`,
      message: `Mesa 1 ha realizado un nuevo pedido`,
      timestamp: new Date(),
      dismissed: false,
    }

    setNotifications((prev) => [...prev, newNotification])
    setNotificationCounter((prev) => prev + 1)

    // if (soundEnabled) {
    //   console.log(`[v0] New order notification: Mesa ${table.number}`)
    // }
  }

  const simulateBillRequest = (tableId: number) => {
    // const table = tables.find((t) => t.id === tableId)
    // if (!table) return

    const newNotification: Notification = {
      id: notificationCounter,
      type: "bill-request",
      tableId,
      // message: `Mesa ${table.number} solicita la cuenta`,
      message: `Mesa 1 solicita la cuenta`,
      timestamp: new Date(),
      dismissed: false,
    }

    setNotifications((prev) => [...prev, newNotification])
    setNotificationCounter((prev) => prev + 1)

    // if (soundEnabled) {
    //   console.log(`[v0] Bill request notification: Mesa ${table.number}`)
    // }
  }

  const simulateWaiterCall = (tableId: number) => {
    // const table = tables.find((t) => t.id === tableId)
    // if (!table) return

    const newNotification: Notification = {
      id: notificationCounter,
      type: "waiter-call",
      tableId,
      // message: `Mesa ${table.number} llama al mozo`,
      message: `Mesa 1 llama al mozo`,
      timestamp: new Date(),
      dismissed: false,
    }

    setNotifications((prev) => [...prev, newNotification])
    setNotificationCounter((prev) => prev + 1)

    // if (soundEnabled) {
    //   console.log(`[v0] Waiter call notification: Mesa ${table.number}`)
    // }
  }

  const dismissNotification = (notificationId: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, dismissed: true } : n)))
  }

  const activeNotifications = notifications.filter((n) => !n.dismissed)

  useEffect(() => {
    const interval = setInterval(() => {
      setTables((prevTables) =>
        prevTables.map((table) => {
          if (table.startTime && table.status !== "libre") {
            const waitTime = Math.floor((Date.now() - table.startTime.getTime()) / 60000)

            if (waitTime >= 20 && !tipNotifications[table.id]) {
              setTipNotifications((prev) => ({ ...prev, [table.id]: true }))
              if (soundEnabled) {
                console.log(`[v0] Tip notification for table ${table.number} - ${waitTime} minutes`)
              }
            }

            return { ...table, waitTime }
          }
          return table
        }),
      )
    }, 60000)

    return () => clearInterval(interval)
  }, [tipNotifications, soundEnabled])

  const dismissTipNotification = (tableId: number) => {
    setTipNotifications((prev) => ({ ...prev, [tableId]: false }))
  }

  const markOrderAsDelivered = (tableId: number, orderId: number) => {
    setTables(
      tables.map((table) =>
        table.id === tableId
          ? {
            ...table,
            orders: table.orders.map((order) =>
              order.id === orderId ? { ...order, status: "entregado" as OrderStatus } : order,
            ),
          }
          : table,
      ),
    )
  }

  const changeTableStatus = async (tableId: number, newStatus: TableStatus) => {
    try {
      setLoading(true)
      setError(null)

      await updateTableStatus(tableId, newStatus)

      // Update local state with both frontend and database status
      const newDbStatus = mapFrontendStatusToDatabase(newStatus)
      setTables(tables.map((table) => (
        table.id === tableId
          ? { ...table, status: newStatus, dbStatus: newDbStatus }
          : table
      )))
      setSelectedTable(null)
    } catch (err) {
      console.error('Failed to update table status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update table status')
    } finally {
      setLoading(false)
    }
  }

  const markBarOrderAsDelivered = (orderId: number) => {
    setBarOrders(
      barOrders.map((order) => (order.id === orderId ? { ...order, status: "entregado" as OrderStatus } : order)),
    )
  }

  const quickMarkDelivered = (tableId: number) => {
    setTables(
      tables.map((table) =>
        table.id === tableId
          ? { ...table, orders: table.orders.map((order) => ({ ...order, status: "entregado" as OrderStatus })) }
          : table,
      ),
    )
    setTipNotifications((prev) => ({ ...prev, [tableId]: false }))
  }

  const quickFreeTable = (tableId: number) => {
    setTables(
      tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: "libre" as TableStatus,
              dbStatus: "free" as DatabaseTableStatus,
              orders: [],
              diners: 0,
              waitTime: 0,
              startTime: undefined
            }
          : table,
      ),
    )
    setTipNotifications((prev) => ({ ...prev, [tableId]: false }))
  }

  const quickRequestBill = (tableId: number) => {
    setTables(
      tables.map((table) => (
        table.id === tableId
          ? { ...table, status: "cuenta-solicitada" as TableStatus, dbStatus: "bill_requested" as DatabaseTableStatus }
          : table
      )),
    )
  }

  // Dashboard analytics using the centralized mapping
  const { freeTables, busyTables, deliveredTables, paidTables } = getDashboardAnalytics(tables)

  // Debug: Log dashboard analytics when tables change
  useEffect(() => {
    console.log('Dashboard Analytics Update:', {
      freeTables,
      busyTables,
      deliveredTables,
      paidTables,
      totalTables: tables.length,
      tableStatuses: tables.map(t => ({ id: t.id, status: t.status, dbStatus: t.dbStatus }))
    })
  }, [freeTables, busyTables, deliveredTables, paidTables, tables])

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
          simulateNewOrder={simulateNewOrder}
          simulateBillRequest={simulateBillRequest}
          simulateWaiterCall={simulateWaiterCall}
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
                          <SelectItem value="bill-requested" className="text-white hover:bg-gray-700">
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
                    tables={tables}
                    tableFilter={tableFilter}
                    setTableFilter={setTableFilter}
                    tipNotifications={tipNotifications}
                    setSelectedTable={setSelectedTable}
                    quickMarkDelivered={quickMarkDelivered}
                    quickRequestBill={quickRequestBill}
                    quickFreeTable={quickFreeTable}
                    onCreateTable={() => setIsCreateTableModalOpen(true)}
                  />
                )}
              </div>
              <div className="xl:col-span-1">
                <TableDetails
                  selectedTable={selectedTable}
                  markOrderAsDelivered={markOrderAsDelivered}
                  changeTableStatus={changeTableStatus}
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

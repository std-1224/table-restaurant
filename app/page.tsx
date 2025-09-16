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
  const [tables, setTables] = useState<Table[]>([
    { id: 1, number: "1", status: "libre", orders: [], diners: 0, assignedWaiter: "" },
    {
      id: 2,
      number: "2",
      status: "esperando",
      orders: [
        { id: 1, item: "Hamburguesa Clásica", status: "pendiente", timestamp: new Date(Date.now() - 5 * 60000) },
      ],
      waitTime: 5,
      diners: 2,
      assignedWaiter: "Carlos",
      startTime: new Date(Date.now() - 5 * 60000),
    },
    {
      id: 3,
      number: "3",
      status: "en-curso",
      orders: [
        { id: 2, item: "Pizza Margherita", status: "en-cocina", timestamp: new Date(Date.now() - 12 * 60000) },
        { id: 3, item: "Ensalada César", status: "entregado", timestamp: new Date(Date.now() - 8 * 60000) },
      ],
      waitTime: 12,
      diners: 4,
      assignedWaiter: "María",
      startTime: new Date(Date.now() - 12 * 60000),
    },
    {
      id: 4,
      number: "4",
      status: "cuenta-solicitada",
      orders: [{ id: 4, item: "Pasta Carbonara", status: "entregado", timestamp: new Date(Date.now() - 25 * 60000) }],
      waitTime: 25,
      diners: 3,
      assignedWaiter: "Ana",
      startTime: new Date(Date.now() - 25 * 60000),
    },
    { id: 5, number: "5", status: "libre", orders: [], diners: 0, assignedWaiter: "" },
    {
      id: 6,
      number: "6",
      status: "en-curso",
      orders: [{ id: 5, item: "Tacos al Pastor", status: "en-cocina", timestamp: new Date(Date.now() - 8 * 60000) }],
      waitTime: 8,
      diners: 2,
      assignedWaiter: "Luis",
      startTime: new Date(Date.now() - 8 * 60000),
    },
  ])

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

  const createTable = (tableData: {
    number: string
    capacity: number
    status: TableStatus
    assignedWaiter?: string
    fixedPrice?: number
    personalizedService?: string
  }) => {
    const newTable: Table = {
      id: Math.max(...tables.map(t => t.id)) + 1,
      number: tableData.number,
      status: tableData.status,
      orders: [],
      diners: tableData.status === "libre" ? 0 : tableData.capacity,
      assignedWaiter: tableData.assignedWaiter || "",
      startTime: tableData.status !== "libre" ? new Date() : undefined,
    }
    setTables([...tables, newTable])
  }

  const simulateNewOrder = (tableId: number) => {
    const table = tables.find((t) => t.id === tableId)
    if (!table) return

    const newNotification: Notification = {
      id: notificationCounter,
      type: "new-order",
      tableId,
      message: `Mesa ${table.number} ha realizado un nuevo pedido`,
      timestamp: new Date(),
      dismissed: false,
    }

    setNotifications((prev) => [...prev, newNotification])
    setNotificationCounter((prev) => prev + 1)

    if (soundEnabled) {
      console.log(`[v0] New order notification: Mesa ${table.number}`)
    }
  }

  const simulateBillRequest = (tableId: number) => {
    const table = tables.find((t) => t.id === tableId)
    if (!table) return

    const newNotification: Notification = {
      id: notificationCounter,
      type: "bill-request",
      tableId,
      message: `Mesa ${table.number} solicita la cuenta`,
      timestamp: new Date(),
      dismissed: false,
    }

    setNotifications((prev) => [...prev, newNotification])
    setNotificationCounter((prev) => prev + 1)

    if (soundEnabled) {
      console.log(`[v0] Bill request notification: Mesa ${table.number}`)
    }
  }

  const simulateWaiterCall = (tableId: number) => {
    const table = tables.find((t) => t.id === tableId)
    if (!table) return

    const newNotification: Notification = {
      id: notificationCounter,
      type: "waiter-call",
      tableId,
      message: `Mesa ${table.number} llama al mozo`,
      timestamp: new Date(),
      dismissed: false,
    }

    setNotifications((prev) => [...prev, newNotification])
    setNotificationCounter((prev) => prev + 1)

    if (soundEnabled) {
      console.log(`[v0] Waiter call notification: Mesa ${table.number}`)
    }
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

  const changeTableStatus = (tableId: number, newStatus: TableStatus) => {
    setTables(tables.map((table) => (table.id === tableId ? { ...table, status: newStatus } : table)))
    setSelectedTable(null)
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
          ? { ...table, status: "libre" as TableStatus, orders: [], diners: 0, waitTime: 0, startTime: undefined }
          : table,
      ),
    )
    setTipNotifications((prev) => ({ ...prev, [tableId]: false }))
  }

  const quickRequestBill = (tableId: number) => {
    setTables(
      tables.map((table) => (table.id === tableId ? { ...table, status: "cuenta-solicitada" as TableStatus } : table)),
    )
  }

  const occupiedTables = tables.filter((t) => t.status !== "libre").length
  const freeTables = tables.filter((t) => t.status === "libre").length
  const delayedOrders = tables.filter((t) => t.waitTime && t.waitTime > 15).length
  const pendingBarOrders = barOrders.filter((o) => o.status !== "entregado").length

  return (
    <div className="min-h-screen bg-black text-white p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        <DashboardHeader
          activeNotificationsCount={activeNotifications.length}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          occupiedTables={occupiedTables}
          freeTables={freeTables}
          delayedOrders={delayedOrders}
          pendingBarOrders={pendingBarOrders}
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

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Clock,
  Users,
  Coffee,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Timer,
  UserCheck,
  Filter,
  Eye,
  Check,
  DollarSign,
  Home,
  Bell,
  BellRing,
  ShoppingCart,
  HandPlatter as HandRaised,
  Receipt,
} from "lucide-react"

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

const statusColors = {
  libre: "bg-green-500 text-white border-green-400",
  esperando: "bg-orange-500 text-white border-orange-400",
  "en-curso": "bg-blue-500 text-white border-blue-400",
  "cuenta-solicitada": "bg-red-500 text-white border-red-400",
} as const

const timeColors = {
  fast: "border-green-400",
  medium: "border-yellow-400",
  slow: "border-red-400 animate-pulse",
} as const

const getTimeBasedColor = (waitTime?: number) => {
  if (!waitTime) return ""
  if (waitTime < 10) return timeColors.fast
  if (waitTime < 20) return timeColors.medium
  return timeColors.slow
}

const getStatusColor = (status: TableStatus) => {
  return statusColors[status] || "bg-gray-600 text-white border-gray-500"
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

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCounter, setNotificationCounter] = useState(1)

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

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "new-order":
        return <ShoppingCart className="h-4 w-4" />
      case "bill-request":
        return <Receipt className="h-4 w-4" />
      case "waiter-call":
        return <HandRaised className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "new-order":
        return "bg-blue-600 border-blue-400 text-white"
      case "bill-request":
        return "bg-green-600 border-green-400 text-white"
      case "waiter-call":
        return "bg-yellow-600 border-yellow-400 text-black"
      default:
        return "bg-gray-600 border-gray-400 text-white"
    }
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

  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case "libre":
        return "Libre"
      case "esperando":
        return "Esperando"
      case "en-curso":
        return "En Curso"
      case "cuenta-solicitada":
        return "Cuenta"
      default:
        return status
    }
  }

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pendiente":
        return "bg-orange-500 text-white border-orange-400"
      case "en-cocina":
        return "bg-blue-500 text-white border-blue-400"
      case "entregado":
        return "bg-green-500 text-white border-green-400"
      default:
        return "bg-gray-600 text-white border-gray-500"
    }
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

  const dismissTipNotification = (tableId: number) => {
    setTipNotifications((prev) => ({ ...prev, [tableId]: false }))
  }

  const getFilteredTables = () => {
    switch (tableFilter) {
      case "delayed":
        return tables.filter((t) => t.waitTime && t.waitTime > 15)
      case "bill-requested":
        return tables.filter((t) => t.status === "cuenta-solicitada")
      case "occupied":
        return tables.filter((t) => t.status !== "libre")
      default:
        return tables
    }
  }

  const getFilteredBarOrders = () => {
    switch (barFilter) {
      case "urgent":
        return barOrders.filter((o) => {
          const waitTime = Math.floor((Date.now() - o.timestamp.getTime()) / 60000)
          return waitTime > 10 && o.status !== "entregado"
        })
      case "cocktails":
        return barOrders.filter((o) => o.drinkTypes?.["Cocktails"])
      case "pending":
        return barOrders.filter((o) => o.status !== "entregado")
      default:
        return barOrders
    }
  }

  const occupiedTables = tables.filter((t) => t.status !== "libre").length
  const freeTables = tables.filter((t) => t.status === "libre").length
  const delayedOrders = tables.filter((t) => t.waitTime && t.waitTime > 15).length
  const pendingBarOrders = barOrders.filter((o) => o.status !== "entregado").length

  return (
    <div className="min-h-screen bg-black text-white p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        <header className="space-y-3 lg:space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-2">
              {activeNotifications.length > 0 && (
                <Badge className="bg-red-600 text-white animate-pulse border-red-500">
                  {activeNotifications.length} notificaciones
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-2 text-gray-100 hover:bg-gray-700 hover:border-gray-500 h-10 px-4 bg-transparent border-zinc-950"
              >
                {soundEnabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                <span className="hidden sm:inline">{soundEnabled ? "ON" : "OFF"}</span>
              </Button>
            </div>
          </div>

          {activeNotifications.length > 0 && (
            <div className="space-y-2">
              {activeNotifications.slice(-3).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 lg:p-4 border rounded-lg ${getNotificationColor(notification.type)} animate-pulse`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <span className="font-medium text-xs sm:text-sm">{notification.message}</span>
                      <Badge variant="outline" className="text-xs border-current">
                        {new Date(notification.timestamp).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="hover:bg-white/20 text-gray-300 hover:text-white h-8 px-2"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
              {activeNotifications.length > 3 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    +{activeNotifications.length - 3} notificaciones más
                  </Badge>
                </div>
              )}
            </div>
          )}

          {Object.entries(tipNotifications).some(([_, active]) => active) && (
            <div className="p-3 lg:p-4 bg-red-950/80 border border-red-400 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-red-300" />
                  <span className="font-medium text-red-100 text-xs sm:text-sm">Mesas con demora</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTipNotifications({})}
                  className="text-red-200 hover:bg-red-800/50 hover:text-red-100 h-8 px-2"
                >
                  Descartar
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1 lg:gap-2">
                {Object.entries(tipNotifications)
                  .filter(([_, active]) => active)
                  .map(([tableId, _]) => {
                    const table = tables.find((t) => t.id === Number.parseInt(tableId))
                    return table ? (
                      <Badge
                        key={tableId}
                        className="cursor-pointer bg-red-700 hover:bg-red-600 text-red-100 border-red-500 text-xs"
                        onClick={() => dismissTipNotification(Number.parseInt(tableId))}
                      >
                        Mesa {table.number} - {table.waitTime}min ✕
                      </Badge>
                    ) : null
                  })}
              </div>
            </div>
          )}

          <div className="p-3 lg:p-4 border rounded-lg bg-transparent border-zinc-950">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-gray-300" />
              <span className="text-xs text-gray-200">Simular notificaciones:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-blue-800/80 border-blue-500 text-blue-100 hover:bg-blue-700 hover:border-blue-400 h-8 px-3 text-xs"
                onClick={() => simulateNewOrder(2)}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Nuevo Pedido
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-green-800/80 border-green-500 text-green-100 hover:bg-green-700 hover:border-green-400 h-8 px-3 text-xs"
                onClick={() => simulateBillRequest(3)}
              >
                <Receipt className="h-3 w-3 mr-1" />
                Pedir Cuenta
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-yellow-800/80 border-yellow-500 text-yellow-100 hover:bg-yellow-700 hover:border-yellow-400 h-8 px-3 text-xs"
                onClick={() => simulateWaiterCall(4)}
              >
                <HandRaised className="h-3 w-3 mr-1" />
                Llamar Mozo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
            <Card className="bg-transparent border-zinc-950">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <Users className="h-4 w-4 lg:h-5 lg:w-5 text-blue-300" />
                  <div>
                    <p className="text-xs text-gray-300">Ocupadas</p>
                    <p className="text-sm sm:text-base font-bold text-gray-100">{occupiedTables}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-transparent text-transparent border-zinc-950">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-300" />
                  <div>
                    <p className="text-xs text-gray-300">Libres</p>
                    <p className="text-sm sm:text-base font-bold text-gray-100">{freeTables}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-transparent text-transparent border-zinc-950">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-red-300" />
                  <div>
                    <p className="text-xs text-gray-300">Demorados</p>
                    <p className="text-sm sm:text-base font-bold text-gray-100">{delayedOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="text-transparent bg-transparent border-zinc-950">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <Coffee className="h-4 w-4 lg:h-5 lg:w-5 text-orange-300" />
                  <div>
                    <p className="text-xs text-gray-300">Barra</p>
                    <p className="text-sm sm:text-base font-bold text-gray-100">{pendingBarOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              <div className="xl:col-span-2">
                <Card className="border-zinc-950 bg-transparent">
                  <CardHeader className="pb-3 lg:pb-4">
                    <CardTitle className="text-base sm:text-lg text-gray-100">Mesas</CardTitle>
                  </CardHeader>
                  <CardContent className="p-1 sm:p-2 lg:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                      {getFilteredTables().map((table) => (
                        <div key={table.id} className="flex flex-col space-y-1 w-full min-w-0">
                          <Button
                            variant="outline"
                            className={`h-32 sm:h-36 lg:h-40 w-full flex flex-col items-center justify-center gap-1 sm:gap-2 ${getStatusColor(table.status)} border-2 ${getTimeBasedColor(table.waitTime)} hover:scale-105 transition-all text-white font-bold rounded-lg relative ${tipNotifications[table.id] ? "ring-2 ring-red-400" : ""}`}
                            onClick={() => setSelectedTable(table)}
                          >
                            {tipNotifications[table.id] && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                !
                              </div>
                            )}
                            <span className="text-sm sm:text-base font-bold">Mesa {table.number}</span>
                            <Badge
                              variant="secondary"
                              className="text-xs font-medium bg-gray-100 text-gray-900 px-1.5 py-0.5 border border-gray-300"
                            >
                              {getStatusText(table.status)}
                            </Badge>
                            {table.diners > 0 && (
                              <div className="flex items-center gap-1 text-xs bg-black/40 px-1.5 py-0.5 rounded border border-transparent">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{table.diners}</span>
                              </div>
                            )}
                            {table.waitTime && table.waitTime > 0 && (
                              <div className="flex items-center gap-1 text-xs bg-black/40 px-1.5 py-0.5 rounded border border-transparent">
                                <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{table.waitTime}min</span>
                              </div>
                            )}
                            {table.assignedWaiter && (
                              <div className="flex items-center gap-1 text-xs bg-black/40 px-1.5 py-0.5 rounded max-w-[90%] border border-transparent">
                                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate text-center">{table.assignedWaiter}</span>
                              </div>
                            )}
                          </Button>

                          {table.status !== "libre" && (
                            /* Improved action buttons with consistent sizing and better spacing */
                            <div className="flex justify-center gap-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-12 w-12 p-0 bg-green-800/90 border-green-500 text-green-100 hover:bg-green-700 hover:border-green-400 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  quickMarkDelivered(table.id)
                                }}
                                title="Marcar como entregado"
                              >
                                <Check className="h-5 w-5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-12 w-12 p-0 bg-yellow-800/90 border-yellow-500 text-yellow-100 hover:bg-yellow-700 hover:border-yellow-400 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  quickRequestBill(table.id)
                                }}
                                title="Solicitar cuenta"
                              >
                                <DollarSign className="h-5 w-5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-12 w-12 p-0 bg-blue-800/90 border-blue-500 text-blue-100 hover:bg-blue-700 hover:border-blue-400 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  quickFreeTable(table.id)
                                }}
                                title="Liberar mesa"
                              >
                                <Home className="h-5 w-5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="bg-transparent border-zinc-950">
                  <CardHeader className="pb-3 lg:pb-4">
                    <CardTitle className="text-base sm:text-lg text-gray-100">
                      {selectedTable ? `Mesa ${selectedTable.number}` : "Selecciona Mesa"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 lg:p-6">
                    {selectedTable ? (
                      <div className="space-y-3 lg:space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(selectedTable.status)} font-medium text-xs`}>
                            {getStatusText(selectedTable.status)}
                          </Badge>
                          {selectedTable.waitTime && (
                            <Badge variant="outline" className="font-medium border-gray-700 text-gray-300 text-xs">
                              <Clock className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
                              {selectedTable.waitTime}min
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 lg:gap-3">
                          <div className="p-2 lg:p-3 rounded-lg bg-transparent">
                            <p className="text-xs text-gray-400">Comensales</p>
                            <p className="text-sm sm:text-base font-bold text-gray-100">{selectedTable.diners || 0}</p>
                          </div>
                          <div className="p-2 lg:p-3 rounded-lg bg-transparent">
                            <p className="text-xs text-gray-400">Mozo</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-100 truncate">
                              {selectedTable.assignedWaiter || "Sin asignar"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 lg:space-y-3">
                          <h4 className="font-medium text-gray-100 text-xs sm:text-sm">Pedidos</h4>
                          {selectedTable.orders.length > 0 ? (
                            selectedTable.orders.map((order) => (
                              <div
                                key={order.id}
                                className="flex items-center justify-between p-2 lg:p-3 border border-gray-700 rounded-lg bg-gray-800"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-100 text-xs truncate">{order.item}</p>
                                  <Badge size="sm" className={`${getOrderStatusColor(order.status)} mt-1 text-xs`}>
                                    {order.status}
                                  </Badge>
                                </div>
                                {order.status !== "entregado" && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white ml-2 h-8 px-2 text-xs"
                                    onClick={() => markOrderAsDelivered(selectedTable.id, order.id)}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    <span className="hidden lg:inline">Entregado</span>
                                  </Button>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4 text-sm">No hay pedidos</p>
                          )}
                        </div>

                        <div className="space-y-2 lg:space-y-3">
                          <h4 className="font-medium text-gray-100 text-xs sm:text-sm">Cambiar Estado</h4>
                          <div className="grid grid-cols-2 gap-1 lg:gap-2">
                            <Button
                              variant="outline"
                              className="h-8 lg:h-10 text-xs text-white hover:bg-gray-700 bg-transparent border-zinc-950"
                              onClick={() => changeTableStatus(selectedTable.id, "libre")}
                            >
                              Libre
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 lg:h-10 text-xs text-white hover:bg-gray-700 bg-transparent border-gray-950"
                              onClick={() => changeTableStatus(selectedTable.id, "esperando")}
                            >
                              Esperando
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 lg:h-10 text-xs text-white hover:bg-gray-700 border-zinc-950 bg-transparent"
                              onClick={() => changeTableStatus(selectedTable.id, "en-curso")}
                            >
                              En Curso
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 lg:h-10 text-xs text-white hover:bg-gray-700 border-zinc-950 bg-transparent"
                              onClick={() => changeTableStatus(selectedTable.id, "cuenta-solicitada")}
                            >
                              Cuenta
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8 text-sm">Haz clic en una mesa</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="barra" className="space-y-4 lg:space-y-6">
            <div className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-lg border bg-transparent border-zinc-950">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={barFilter} onValueChange={setBarFilter}>
                <SelectTrigger className="font-medium p-2 rounded text-white text-xs lg:text-sm bg-transparent">
                  <SelectValue placeholder="Filtrar pedidos" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">
                    Todos
                  </SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-gray-700">
                    Pendientes
                  </SelectItem>
                  <SelectItem value="urgent" className="text-white hover:bg-gray-700">
                    Urgentes
                  </SelectItem>
                  <SelectItem value="cocktails" className="text-white hover:bg-gray-700">
                    Cocktails
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <Card className="border-zinc-950 bg-transparent">
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-base sm:text-lg text-white">Barra Principal</CardTitle>
                </CardHeader>
                <CardContent className="p-3 lg:p-6">
                  <div className="space-y-3 lg:space-y-4">
                    {getFilteredBarOrders()
                      .filter((order) => order.barId === 1)
                      .map((order) => {
                        const waitTime = Math.floor((Date.now() - order.timestamp.getTime()) / 60000)
                        return (
                          <div
                            key={order.id}
                            className={`p-3 lg:p-4 border rounded-lg bg-transparent border-stone-950 ${waitTime > 10 ? "border-red-700 bg-red-900/30" : "bg-gray-800 border-gray-700"}`}
                          >
                            <div className="flex items-center justify-between mb-2 lg:mb-3">
                              <Badge className={`${getOrderStatusColor(order.status)} text-xs`}>{order.status}</Badge>
                              <div className="flex items-center gap-2 lg:gap-3 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  <span>{waitTime}min</span>
                                </div>
                                <span className="font-bold">#{order.id}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2 lg:mb-3 text-xs lg:text-sm text-gray-300">
                              <UserCheck className="h-3 w-3" />
                              <span>{order.assignedBartender}</span>
                            </div>
                            <div className="space-y-1 lg:space-y-2 mb-2 lg:mb-3">
                              {order.items.map((item, index) => (
                                <p
                                  key={index}
                                  className="font-medium p-2 rounded text-white text-xs lg:text-sm bg-transparent"
                                >
                                  {item}
                                </p>
                              ))}
                            </div>
                            {order.drinkTypes && (
                              <div className="mb-2 lg:mb-3 flex flex-wrap gap-1 lg:gap-2">
                                {Object.entries(order.drinkTypes).map(([type, count]) => (
                                  <Badge key={type} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                    {count} {type}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {order.status !== "entregado" && (
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white h-8 lg:h-10 text-xs lg:text-sm"
                                onClick={() => markBarOrderAsDelivered(order.id)}
                              >
                                <Check className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                Entregar
                              </Button>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-transparent border-zinc-950">
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-lg lg:text-xl text-white">Barra Secundaria</CardTitle>
                </CardHeader>
                <CardContent className="p-3 lg:p-6">
                  <div className="space-y-3 lg:space-y-4">
                    {getFilteredBarOrders()
                      .filter((order) => order.barId === 2)
                      .map((order) => {
                        const waitTime = Math.floor((Date.now() - order.timestamp.getTime()) / 60000)
                        return (
                          <div
                            key={order.id}
                            className={`p-3 lg:p-4 border rounded-lg ${waitTime > 10 ? "border-red-700 bg-red-900/30" : "bg-gray-800 border-gray-700"}`}
                          >
                            <div className="flex items-center justify-between mb-2 lg:mb-3">
                              <Badge className={`${getOrderStatusColor(order.status)} text-xs`}>{order.status}</Badge>
                              <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  <span>{waitTime}min</span>
                                </div>
                                <span className="font-bold">#{order.id}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2 lg:mb-3 text-xs lg:text-sm text-gray-300">
                              <UserCheck className="h-3 w-3" />
                              <span>{order.assignedBartender}</span>
                            </div>
                            <div className="space-y-1 lg:space-y-2 mb-2 lg:mb-3">
                              {order.items.map((item, index) => (
                                <p
                                  key={index}
                                  className="font-medium p-2 rounded text-white text-xs lg:text-sm bg-transparent"
                                >
                                  {item}
                                </p>
                              ))}
                            </div>
                            {order.drinkTypes && (
                              <div className="mb-2 lg:mb-3 flex flex-wrap gap-1 lg:gap-2">
                                {Object.entries(order.drinkTypes).map(([type, count]) => (
                                  <Badge key={type} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                    {count} {type}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {order.status !== "entregado" && (
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white h-8 lg:h-10 text-xs lg:text-sm"
                                onClick={() => markBarOrderAsDelivered(order.id)}
                              >
                                <Check className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                Entregar
                              </Button>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-zinc-900 bg-transparent">
              <CardHeader className="pb-3 lg:pb-4">
                <CardTitle className="text-lg lg:text-xl text-white">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="p-3 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                  <div className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-lg bg-transparent">
                    <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400" />
                    <div>
                      <p className="text-xs lg:text-sm text-gray-400">Pendientes</p>
                      <p className="text-lg lg:text-2xl font-bold text-white">
                        {barOrders.filter((o) => o.status === "pendiente").length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-lg bg-transparent">
                    <Coffee className="h-5 w-5 lg:h-6 lg:w-6 text-orange-400" />
                    <div>
                      <p className="text-xs lg:text-sm text-gray-400">Preparando</p>
                      <p className="text-lg lg:text-2xl font-bold text-white">
                        {barOrders.filter((o) => o.status === "en-cocina").length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-lg bg-transparent">
                    <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-green-400" />
                    <div>
                      <p className="text-xs lg:text-sm text-gray-400">Entregados</p>
                      <p className="text-lg lg:text-2xl font-bold text-white">
                        {barOrders.filter((o) => o.status === "entregado").length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supervisor" className="space-y-4 lg:space-y-6">
            <Card className="bg-transparent border-zinc-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Eye className="h-4 w-4 lg:h-5 lg:w-5" />
                  Vista Global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <h3 className="font-medium mb-3 text-white text-sm lg:text-base">Estado de Mesas</h3>
                    <div className="grid grid-cols-3 gap-1 lg:gap-2">
                      {tables.map((table) => (
                        <div
                          key={table.id}
                          className={`p-2 rounded text-center text-xs ${getStatusColor(table.status)}`}
                        >
                          <div className="font-bold">M{table.number}</div>
                          <div>{table.diners || 0} pax</div>
                          <div className="truncate text-xs">{table.assignedWaiter || "Sin asignar"}</div>
                          {table.waitTime && <div>{table.waitTime}min</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 text-white text-sm lg:text-base">Personal</h3>
                    <div className="space-y-2">
                      {["Carlos", "María", "Ana", "Luis"].map((waiter) => {
                        const waiterTables = tables.filter((t) => t.assignedWaiter === waiter && t.status !== "libre")
                        return (
                          <div key={waiter} className="border-zinc-950 bg-transparent">
                            <span className="font-medium text-white text-sm">{waiter}</span>
                            <div className="flex gap-1 lg:gap-2">
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {waiterTables.length} mesas
                              </Badge>
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {waiterTables.reduce((acc, t) => acc + (t.diners || 0), 0)} pax
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, QrCode, ShoppingCart, Bell } from "lucide-react"
import { getTableOrdersForTable, OrderWithItems } from "@/lib/api/tables"
import { supabase } from "@/lib/supabase"

type TableStatus = "libre" | "esperando" | "en-curso" | "cuenta-solicitada"

interface Table {
  id: number
  number: string
  status: TableStatus
  orders: any[]
  waitTime?: number
  diners?: number
  assignedWaiter?: string
  startTime?: Date
}

interface TableDetailsProps {
  selectedTable: Table | null
  changeTableStatus: (tableId: number, newStatus: TableStatus) => void
  scanQRCode: (tableId: number) => void
}

const statusColors = {
  libre: "bg-green-500 text-white border-green-400",
  esperando: "bg-orange-500 text-white border-orange-400",
  "en-curso": "bg-blue-500 text-white border-blue-400",
  "cuenta-solicitada": "bg-red-500 text-white border-red-400",
} as const

export function TableDetails({
  selectedTable,
  changeTableStatus,
  scanQRCode,
}: TableDetailsProps) {
  const [realTableOrders, setRealTableOrders] = useState<OrderWithItems[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Fetch real table orders when selected table changes
  useEffect(() => {
    const fetchTableOrders = async () => {
      if (!selectedTable) {
        setRealTableOrders([])
        return
      }

      try {
        setLoadingOrders(true)
        const orders = await getTableOrdersForTable(selectedTable.id)
        setRealTableOrders(orders)
      } catch (error) {
        console.error('Failed to fetch table orders:', error)
        setRealTableOrders([])
      } finally {
        setLoadingOrders(false)
      }
    }

    fetchTableOrders()
  }, [selectedTable?.id])

  // Real-time subscription for table orders
  useEffect(() => {
    if (!selectedTable) return

    const tableOrdersChannel = supabase
      .channel(`table_orders_${selectedTable.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "table_orders",
        },
        async () => {
          try {
            // Refresh orders when any table_orders change occurs
            // We could be more specific and only refresh for the current table,
            // but this ensures we always have the latest data
            const orders = await getTableOrdersForTable(selectedTable.id)
            setRealTableOrders(orders)
          } catch (error) {
            console.error('Failed to refresh table orders:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tableOrdersChannel)
    }
  }, [selectedTable?.id])
  const getStatusColor = (status: TableStatus) => {
    return statusColors[status] || "bg-gray-600 text-white border-gray-500"
  }

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

  const statusMap: Record<string, string> = {
    pending: "in-kitchen",
    bill_requested: "delivered",
    waiting_order: "earning",
  };

  return (
    <div className="w-100">
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
                {loadingOrders ? (
                  <p className="text-gray-500 text-center py-4 text-sm">Cargando pedidos...</p>
                ) : realTableOrders.length > 0 ? (
                  realTableOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-700 rounded-lg bg-gray-800 p-2 lg:p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-100 text-xs">Pedido #{order.order_id}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(order.created_at).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white ml-2 h-8 px-2 text-xs"
                          onClick={() => {
                            console.log('View order details:', order)
                          }}
                        >
                          <span className="hidden lg:inline">Marcar como Entregado</span>
                        </Button>
                      </div>

                      {/* Order Items */}
                      {order.order_items && order.order_items.length > 0 && order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <Badge
                            className={`text-xs ${item.status === 'pending' ? 'bg-orange-500 text-white' :
                                item.status === 'preparing' ? 'bg-blue-500 text-white' :
                                  item.status === 'ready' ? 'bg-yellow-500 text-black' :
                                    'bg-green-500 text-white'
                              }`}
                          >
                            {statusMap[item.status] || ""}
                          </Badge>
                          <span className="text-gray-400">${item?.total_amount || 0}</span>
                        </div>
                      ))}
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
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <Bell className="h-4 w-4 text-gray-300" />
                    <span className="text-xs text-gray-200">Simular notificaciones:</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-8 lg:h-10 text-xs text-white hover:bg-blue-700 bg-blue-800/80 border-blue-500"
                    onClick={() => scanQRCode(selectedTable.id)}
                  >
                    <QrCode className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                    Escanear QR
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
  )
}

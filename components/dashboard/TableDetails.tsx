"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, QrCode, ShoppingCart, Bell } from "lucide-react"
import { getTableOrdersForTable, OrderWithItems, updateTableStatus } from "@/lib/api/tables"
import { supabase, DatabaseTableStatus } from "@/lib/supabase"

interface Table {
  id: string
  number: string
  status: DatabaseTableStatus
  orders: any[]
  waitTime?: number
  diners?: number
  assignedWaiter?: string
  startTime?: Date
}

interface TableDetailsProps {
  selectedTable: Table | null
  changeTableStatus: (tableId: string, newStatus: DatabaseTableStatus) => void
  scanQRCode: (tableId: string) => void
  onLoadingChange?: (isLoading: boolean) => void
}

const statusColors = {
  free: "bg-green-500 text-white border-green-400",
  occupied: "bg-orange-500 text-white border-orange-400",
  producing: "bg-blue-500 text-white border-blue-400",
  bill_requested: "bg-red-500 text-white border-red-400",
  paid: "bg-green-500 text-white border-green-400",
  waiting_order: "bg-yellow-500 text-white border-yellow-400",
  delivered: "bg-green-500 text-white border-green-400",
} as const

export function TableDetails({
  selectedTable,
  changeTableStatus,
  scanQRCode,
  onLoadingChange,
}: TableDetailsProps) {
  const [realTableOrders, setRealTableOrders] = useState<OrderWithItems[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [currentTableStatus, setCurrentTableStatus] = useState<DatabaseTableStatus | null>(null)

  useEffect(() => {
    if (selectedTable) {
      setCurrentTableStatus(selectedTable.status)
    } else {
      setCurrentTableStatus(null)
    }
  }, [selectedTable])

  useEffect(() => {
    if (!selectedTable) return

    const tableStatusChannel = supabase
      .channel(`table_status_${selectedTable.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tables",
          filter: `id=eq.${selectedTable.id}`,
        },
        (payload: any) => {
          if (payload.new?.status) {
            setCurrentTableStatus(payload.new.status)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tableStatusChannel)
    }
  }, [selectedTable?.id])

  const handleOrderAction = async () => {
    if (!selectedTable || !currentTableStatus) return

    let newStatus: DatabaseTableStatus

    switch (currentTableStatus) {
      case "waiting_order":
        newStatus = "producing"
        break
      case "producing":
        newStatus = "delivered"
        break
      case "bill_requested":
        newStatus = "paid"
        break
      default:
        newStatus = "delivered"
        return
    }

    await updateTableStatus(selectedTable.id, newStatus)
    changeTableStatus(selectedTable.id, newStatus)
    setCurrentTableStatus(newStatus)
  }

  const getButtonText = () => {
    if (!currentTableStatus) return ""

    switch (currentTableStatus) {
      case "free":
        return "Libre"
      case "occupied":
        return "Esperando Orden"
      case "paid":
        return "Pagada"
      case "waiting_order":
        return "Comience a Prepararse"
      case "producing":
        return "Confirmar entrega"
      case "bill_requested":
        return "Pagada"
      case "delivered":
        return "Entregada"
    }
  }

  const isButtonDisabled = () => {
    if (!currentTableStatus) return true
    return currentTableStatus === "delivered" || currentTableStatus === "free"
  }

  const getButtonColor = () => {
    if (!currentTableStatus) return "bg-gray-600 hover:bg-gray-700"

    switch (currentTableStatus) {
      case "waiting_order":
        return "bg-orange-600 hover:bg-orange-700"
      case "producing":
        return "bg-green-600 hover:bg-green-700"
      case "bill_requested":
        return "bg-blue-600 hover:bg-blue-700"
      case "delivered":
        return "bg-gray-600"
      default:
        return "bg-blue-600 hover:bg-blue-700"
    }
  }

  useEffect(() => {
    const fetchTableOrders = async () => {
      if (!selectedTable) {
        setRealTableOrders([])
        return
      }

      try {
        setLoadingOrders(true)
        onLoadingChange?.(true)
        const orders = await getTableOrdersForTable(selectedTable.id)
        setRealTableOrders(orders)
      } catch (error) {
        setRealTableOrders([])
      } finally {
        setLoadingOrders(false)
        onLoadingChange?.(false)
      }
    }

    fetchTableOrders()
  }, [selectedTable?.id])

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
            const orders = await getTableOrdersForTable(selectedTable.id)
            setRealTableOrders(orders)
          } catch (error) {
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tableOrdersChannel)
    }
  }, [selectedTable?.id])

  const getStatusColor = (status: DatabaseTableStatus) => {
    return statusColors[status] || "bg-gray-600 text-white border-gray-500"
  }

  const getStatusText = (status: DatabaseTableStatus) => {
    switch (status) {
      case "free":
        return "Libre"
      case "occupied":
        return "Ocupada"
      case "waiting_order":
        return "Esperando"
      case "producing":
        return "En Curso"
      case "delivered":
        return "Entregado"
      case "bill_requested":
        return "Cuenta"
      case "paid":
        return "Pagado"
      default:
        return status
    }
  }

  const statusMap: Record<string, string> = {
    pending: "in-kitchen",
    bill_requested: "delivered",
    waiting_order: "earning",
  };

  const handleStatusChange = (newStatus: DatabaseTableStatus) => {
    if (!selectedTable) return
    changeTableStatus(selectedTable.id, newStatus)
    setCurrentTableStatus(newStatus)
  }

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
                <Badge className={`${getStatusColor(currentTableStatus || selectedTable.status)} font-medium text-xs`}>
                  {getStatusText(currentTableStatus || selectedTable.status)}
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
                          className={`${getButtonColor()} text-white ml-2 h-8 px-2 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={handleOrderAction}
                          disabled={isButtonDisabled()}
                        >
                          {getButtonText()}
                        </Button>
                      </div>

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

              {/* <div className="space-y-2 lg:space-y-3">
                <h4 className="font-medium text-gray-100 text-xs sm:text-sm">Cambiar Estado</h4>
                <div className="grid grid-cols-2 gap-1 lg:gap-2">
                  <Button
                    variant="outline"
                    className="h-8 lg:h-10 text-xs text-white hover:bg-gray-700 bg-transparent border-zinc-950"
                    onClick={() => handleStatusChange("free")}
                  >
                    Libre
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 lg:h-10 text-xs text-white hover:bg-gray-700 bg-transparent border-gray-950"
                    onClick={() => handleStatusChange("waiting_order")}
                  >
                    Esperando
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 lg:h-10 text-xs text-white hover:bg-gray-700 border-zinc-950 bg-transparent"
                    onClick={() => handleStatusChange("producing")}
                  >
                    En Curso
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 lg:h-10 text-xs text-white hover:bg-gray-700 border-zinc-950 bg-transparent"
                    onClick={() => handleStatusChange("bill_requested")}
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
              </div> */}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 text-sm">Haz clic en una mesa</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
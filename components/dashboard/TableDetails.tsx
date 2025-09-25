"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Check, QrCode, ShoppingCart, HandPlatter as HandRaised, Bell, } from "lucide-react"

type TableStatus = "libre" | "esperando" | "en-curso" | "cuenta-solicitada"
type OrderStatus = "pendiente" | "en-cocina" | "entregado"

interface Order {
  id: number
  item: string
  status: OrderStatus
  timestamp: Date
}

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

interface TableDetailsProps {
  selectedTable: Table | null
  markOrderAsDelivered: (tableId: number, orderId: number) => void
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
  markOrderAsDelivered,
  changeTableStatus,
  scanQRCode,
}: TableDetailsProps) {
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
                {selectedTable.orders.length > 0 ? (
                  selectedTable.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-2 lg:p-3 border border-gray-700 rounded-lg bg-gray-800"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-100 text-xs truncate">{order.item}</p>
                        <Badge className={`${getOrderStatusColor(order.status)} mt-1 text-xs`}>
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

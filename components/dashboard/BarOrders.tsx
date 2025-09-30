"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Filter,
  Timer,
  UserCheck,
  Check,
  BarChart3,
  Coffee,
  CheckCircle,
} from "lucide-react"

type OrderStatus = "pending" | "preparing" | "ready" | "delivered"

interface BarOrder {
  id: number
  items: string[]
  status: OrderStatus
  barId: number
  timestamp: Date
  assignedBartender?: string
  drinkTypes?: { [key: string]: number }
}

interface BarOrdersProps {
  barOrders: BarOrder[]
  barFilter: string
  setBarFilter: (filter: string) => void
  markBarOrderAsDelivered: (orderId: number) => void
}

export function BarOrders({
  barOrders,
  barFilter,
  setBarFilter,
  markBarOrderAsDelivered,
}: BarOrdersProps) {
  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-orange-500 text-white border-orange-400"
      case "preparing":
        return "bg-blue-500 text-white border-blue-400"
      case "ready":
        return "bg-green-500 text-white border-green-400"
      default:
        return "bg-gray-600 text-white border-gray-500"
    }
  }

  const getFilteredBarOrders = () => {
    switch (barFilter) {
      case "urgent":
        return barOrders.filter((o) => {
          const waitTime = Math.floor((Date.now() - o.timestamp.getTime()) / 60000)
          return waitTime > 10 && o.status !== "ready"
        })
      case "cocktails":
        return barOrders.filter((o) => o.drinkTypes?.["Cocktails"])
      case "pending":
        return barOrders.filter((o) => o.status !== "ready")
      default:
        return barOrders
    }
  }

  const renderBarSection = (barId: number, title: string) => (
    <Card className={barId === 1 ? "border-zinc-950 bg-transparent" : "bg-transparent border-zinc-950"}>
      <CardHeader className="pb-3 lg:pb-4">
        <CardTitle className="text-base sm:text-lg text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 lg:p-6">
        <div className="space-y-3 lg:space-y-4">
          {getFilteredBarOrders()
            .filter((order) => order.barId === barId)
            .map((order) => {
              const waitTime = Math.floor((Date.now() - order.timestamp.getTime()) / 60000)
              return (
                <div
                  key={order.id}
                  className={`p-3 lg:p-4 border rounded-lg ${waitTime > 10 ? "border-red-700 bg-red-900/30" : "bg-gray-800 border-gray-700"}`}
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
                  {order.status !== "ready" && (
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
  )

  return (
    <div className="space-y-4 lg:space-y-6">
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
        {renderBarSection(1, "Barra Principal")}
        {renderBarSection(2, "Barra Secundaria")}
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
                  {barOrders.filter((o) => o.status === "pending").length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-lg bg-transparent">
              <Coffee className="h-5 w-5 lg:h-6 lg:w-6 text-orange-400" />
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Preparando</p>
                <p className="text-lg lg:text-2xl font-bold text-white">
                  {barOrders.filter((o) => o.status === "preparing").length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-lg bg-transparent">
              <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-green-400" />
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Entregados</p>
                <p className="text-lg lg:text-2xl font-bold text-white">
                  {barOrders.filter((o) => o.status === "delivered").length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

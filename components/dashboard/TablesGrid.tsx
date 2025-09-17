"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Timer,
  UserCheck,
  Check,
  DollarSign,
  Home,
} from "lucide-react"

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

interface TablesGridProps {
  tables: Table[]
  tableFilter: string
  setTableFilter: (filter: string) => void
  tipNotifications: { [key: number]: boolean }
  setSelectedTable: (table: Table) => void
  quickMarkDelivered: (tableId: number) => void
  quickRequestBill: (tableId: number) => void
  quickFreeTable: (tableId: number) => void
  onCreateTable: () => void
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

export function TablesGrid({
  tables,
  tableFilter,
  setTableFilter,
  tipNotifications,
  setSelectedTable,
  quickMarkDelivered,
  quickRequestBill,
  quickFreeTable,
  onCreateTable,
}: TablesGridProps) {
  const getTimeBasedColor = (waitTime?: number) => {
    if (!waitTime) return ""
    if (waitTime < 10) return timeColors.fast
    if (waitTime < 20) return timeColors.medium
    return timeColors.slow
  }

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

  return (
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
  )
}

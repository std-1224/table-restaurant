"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Timer,
  UserCheck,
  DollarSign,
  Home,
} from "lucide-react"
import { DatabaseTableStatus, FrontendTable } from "@/lib/supabase"
import { useRestaurantStore, useSelectedTableId } from "@/lib/store"
import { usePrefetchTableDetails } from "@/hooks/useOrdersQuery"

interface TablesGridProps {
  tables: FrontendTable[]
  quickFreeTable: (tableId: string) => void
  onCreateTable: () => void
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

const timeColors = {
  fast: "border-green-400",
  medium: "border-yellow-400",
  slow: "border-red-400 animate-pulse",
} as const

export function TablesGrid({
  tables,
  quickFreeTable,
  onCreateTable,
}: TablesGridProps) {
  // Get state from Zustand store
  const {
    tableFilter,
    setTableFilter,
    tipNotifications,
    selectedTable,
    setSelectedTable,
  } = useRestaurantStore()

  // Get prefetch function for better UX
  const { prefetchTableDetails } = usePrefetchTableDetails()
  const getTimeBasedColor = (waitTime?: number) => {
    if (!waitTime) return ""
    if (waitTime < 10) return timeColors.fast
    if (waitTime < 20) return timeColors.medium
    return timeColors.slow
  }

  const getStatusColor = (status: DatabaseTableStatus) => {
    return statusColors[status] || "bg-gray-600 text-white border-gray-500"
  }

  const getStatusText = (status: DatabaseTableStatus) => {
    switch (status) {
      case "free":
        return "Libre"
      case "occupied":
        return "Esperando"
      case "producing":
        return "En Curso"
      case "bill_requested":
        return "Cuenta"
      case "paid":
        return "Pagada"
      case "delivered":
        return "Entregada"
      case "waiting_order":
        return "Esperando Orden"
      default:
        return status
    }
  }

  const getFilteredTables = () => {
    switch (tableFilter) {
      case "delayed":
        return tables.filter((t) => t.waitTime && t.waitTime > 15)
      case "bill_requested":
        return tables.filter((t) => t.status === "bill_requested")
      case "occupied":
        return tables.filter((t) => t.status !== "free")
      default:
        return tables
    }
  }

  const handleTableClick = (table: FrontendTable) => {
    setSelectedTable(table)
  }

  const handleTableHover = (table: FrontendTable) => {
    // Prefetch table details on hover for better UX
    prefetchTableDetails(table.id)
  }

  return (
    <Card className="border-zinc-950 bg-transparent">
      <CardHeader className="pb-3 lg:pb-4">
        <CardTitle className="text-base sm:text-lg text-gray-100">Mesas</CardTitle>
      </CardHeader>
      <CardContent className="p-1 sm:p-2 lg:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
          {getFilteredTables().map((table) => (
            <div key={table.id} className={`flex flex-col space-y-1 w-full min-w-0 `}>
              <Button
                variant="outline"
                className={`h-32 sm:h-36 lg:h-40 w-full flex flex-col items-center justify-center gap-1 sm:gap-2 border-2 transition-all text-white font-bold rounded-lg relative
                ${getStatusColor(table.status)}
                ${getTimeBasedColor(table.waitTime)}
                ${tipNotifications[table.id] ? "ring-2 ring-red-400" : ""}
                ${table.id === selectedTable?.id ? "ring-4 ring-green-500" : ""}
                hover:scale-105 cursor-pointer

              `}
                onClick={() => handleTableClick(table)}
                onMouseEnter={() => handleTableHover(table)}
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

                <div className="flex items-center gap-1 text-xs bg-black/40 px-1.5 py-0.5 rounded border border-transparent">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  {table.diners && table?.diners > 0 && (
                    <span>{table.diners}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs bg-black/40 px-1.5 py-0.5 rounded border border-transparent">
                  <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                  {table.waitTime && table.waitTime > 0 && (
                    <span>{table.waitTime} min</span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs bg-black/40 px-1.5 py-0.5 rounded border border-transparent">
                  <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {table.assignedWaiter && (
                    <span className="truncate text-center">{table.assignedWaiter}</span>
                  )}
                </div>
              </Button>

              {table.status !== "free" && (
                <div className="flex justify-center gap-3">
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

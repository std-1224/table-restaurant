"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { DatabaseTableStatus, FrontendTable } from "@/lib/supabase"

interface SupervisorViewProps {
  tables: FrontendTable[]
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

export function SupervisorView({ tables }: SupervisorViewProps) {
  const getStatusColor = (status: DatabaseTableStatus) => {
    return statusColors[status] || "bg-gray-600 text-white border-gray-500"
  }

  return (
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
                const waiterTables = tables.filter((t) => t.assignedWaiter === waiter && t.status !== "free")
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
  )
}

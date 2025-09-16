"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Coffee,
  Bell,
  BellRing,
} from "lucide-react"

interface DashboardHeaderProps {
  activeNotificationsCount: number
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  occupiedTables: number
  freeTables: number
  delayedOrders: number
  pendingBarOrders: number
}

export function DashboardHeader({
  activeNotificationsCount,
  soundEnabled,
  setSoundEnabled,
  occupiedTables,
  freeTables,
  delayedOrders,
  pendingBarOrders,
}: DashboardHeaderProps) {
  return (
    <header className="space-y-3 lg:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-2">
          {activeNotificationsCount > 0 && (
            <Badge className="bg-red-600 text-white animate-pulse border-red-500">
              {activeNotificationsCount} notificaciones
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
  )
}

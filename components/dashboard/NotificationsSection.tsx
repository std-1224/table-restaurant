"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bell,
  ShoppingCart,
  Receipt,
  HandPlatter as HandRaised,
  AlertTriangle,
} from "lucide-react"

type NotificationType = "new_order" | "bill_request" | "waiter_call" | "special_request"

interface Notification {
  id: number
  type: NotificationType
  tableId: string
  message: string
  timestamp: Date
  dismissed: boolean
}

interface Table {
  id: string
  number: string
  waitTime?: number
}

interface NotificationsSectionProps {
  activeNotifications: Notification[]
  tipNotifications: { [key: string]: boolean }
  tables: Table[]
  dismissNotification: (notificationId: number) => void
  setTipNotifications: (notifications: { [key: string]: boolean }) => void
  dismissTipNotification: (tableId: string) => void
}

export function NotificationsSection({
  activeNotifications,
  tipNotifications,
  tables,
  dismissNotification,
  setTipNotifications,
  dismissTipNotification,
}: NotificationsSectionProps) {
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "new_order":
        return <ShoppingCart className="h-4 w-4" />
      case "bill_request":
        return <Receipt className="h-4 w-4" />
      case "waiter_call":
        return <HandRaised className="h-4 w-4" />
      case "special_request":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "new_order":
        return "bg-blue-600 border-blue-400 text-white"
      case "bill_request":
        return "bg-green-600 border-green-400 text-white"
      case "waiter_call":
        return "bg-yellow-600 border-yellow-400 text-black"
      case "special_request":
        return "bg-purple-600 border-purple-400 text-white"
      default:
        return "bg-gray-600 border-gray-400 text-white"
    }
  }

  return (
    <div className="space-y-4">
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
                const table = tables.find((t) => t.id === tableId)
                return table ? (
                  <Badge
                    key={tableId}
                    className="cursor-pointer bg-red-700 hover:bg-red-600 text-red-100 border-red-500 text-xs"
                    onClick={() => dismissTipNotification(tableId)}
                  >
                    Mesa {table.number} - {table.waitTime}min ✕
                  </Badge>
                ) : null
              })}
          </div>
        </div>
      )}
    </div>
  )
}

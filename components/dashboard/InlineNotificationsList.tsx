"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  AlertTriangle, 
  HandHeart, 
  Receipt, 
  ChefHat,
  Clock
} from "lucide-react"
import { Notification } from "@/hooks/useNotificationsQuery"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface InlineNotificationsListProps {
  notifications: Notification[]
  onDismissNotification: (id: number) => void
  showTimestamp?: boolean
  compact?: boolean
}

// Notification type configuration
const notificationConfig = {
  waiter_call: {
    icon: HandHeart,
    color: "text-blue-400",
    bgColor: "bg-blue-50/10 dark:bg-blue-950/20",
    borderColor: "border-blue-200/20 dark:border-blue-800/30",
    label: "Mesero"
  },
  bill_request: {
    icon: Receipt,
    color: "text-green-400",
    bgColor: "bg-green-50/10 dark:bg-green-950/20",
    borderColor: "border-green-200/20 dark:border-green-800/30",
    label: "Cuenta"
  },
  special_request: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-50/10 dark:bg-red-950/20",
    borderColor: "border-red-200/20 dark:border-red-800/30",
    label: "Urgente"
  },
  new_order: {
    icon: ChefHat,
    color: "text-orange-400",
    bgColor: "bg-orange-50/10 dark:bg-orange-950/20",
    borderColor: "border-orange-200/20 dark:border-orange-800/30",
    label: "Orden"
  }
}

export function InlineNotificationsList({
  notifications,
  onDismissNotification,
  showTimestamp = true,
  compact = false
}: InlineNotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-sm">No hay notificaciones</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const config = notificationConfig[notification.type]
        const IconComponent = config.icon

        return (
          <div
            key={notification.id}
            className={`
              p-3 rounded-lg border transition-all hover:shadow-sm
              ${config.bgColor} ${config.borderColor}
              ${compact ? 'p-2' : 'p-3'}
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Icon */}
                <div className={`p-1.5 rounded-full bg-zinc-800/50 flex-shrink-0 ${compact ? 'p-1' : 'p-1.5'}`}>
                  <IconComponent className={`h-3 w-3 ${config.color} ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Type badge and timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${config.color} bg-transparent border-current/20`}
                    >
                      {config.label}
                    </Badge>
                    
                    {showTimestamp && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(notification.timestamp, { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    )}
                  </div>
                  
                  {/* Message */}
                  <p className={`font-medium text-gray-100 mb-1 ${compact ? 'text-sm' : 'text-sm'}`}>
                    {notification.message}
                  </p>
                  
                  {/* Table info */}
                  <p className="text-xs text-gray-400">
                    Mesa ID: {notification.tableId}
                  </p>
                </div>
              </div>
              
              {/* Dismiss button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismissNotification(notification.id)}
                className={`text-gray-400 hover:text-red-400 flex-shrink-0 ${
                  compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'
                }`}
              >
                <X className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Grouped notifications by type
export function GroupedNotificationsList({
  notifications,
  onDismissNotification,
  showTimestamp = true
}: InlineNotificationsListProps) {
  // Group notifications by type
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const type = notification.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)

  // Sort groups by priority
  const priorityOrder = ['special_request', 'waiter_call', 'bill_request', 'new_order']
  const sortedGroups = priorityOrder.filter(type => groupedNotifications[type])

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-sm">No hay notificaciones</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedGroups.map((type) => {
        const config = notificationConfig[type as keyof typeof notificationConfig]
        const IconComponent = config.icon
        const typeNotifications = groupedNotifications[type]

        return (
          <div key={type} className="space-y-2">
            {/* Group header */}
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <IconComponent className={`h-4 w-4 ${config.color}`} />
              <span className="text-sm font-medium text-gray-300">
                {config.label} ({typeNotifications.length})
              </span>
              
              {/* Dismiss all in group */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  typeNotifications.forEach(notification => {
                    onDismissNotification(notification.id)
                  })
                }}
                className="ml-auto h-6 text-xs text-gray-400 hover:text-red-400"
              >
                Descartar todas
              </Button>
            </div>
            
            {/* Group notifications */}
            <InlineNotificationsList
              notifications={typeNotifications}
              onDismissNotification={onDismissNotification}
              showTimestamp={showTimestamp}
              compact={true}
            />
          </div>
        )
      })}
    </div>
  )
}

// Summary stats component
export function NotificationsSummary({
  notifications
}: {
  notifications: Notification[]
}) {
  const stats = {
    total: notifications.length,
    urgent: notifications.filter(n => n.type === 'special_request').length,
    waiterCall: notifications.filter(n => n.type === 'waiter_call').length,
    billRequest: notifications.filter(n => n.type === 'bill_request').length,
    newOrder: notifications.filter(n => n.type === 'new_order').length,
  }

  if (stats.total === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800">
      <div className="text-sm text-gray-300 font-medium">
        Total: {stats.total}
      </div>
      
      {stats.urgent > 0 && (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {stats.urgent} Urgente{stats.urgent !== 1 ? 's' : ''}
        </Badge>
      )}
      
      {stats.waiterCall > 0 && (
        <Badge className="text-xs bg-blue-600 hover:bg-blue-700">
          <HandHeart className="h-3 w-3 mr-1" />
          {stats.waiterCall} Mesero
        </Badge>
      )}
      
      {stats.billRequest > 0 && (
        <Badge className="text-xs bg-green-600 hover:bg-green-700">
          <Receipt className="h-3 w-3 mr-1" />
          {stats.billRequest} Cuenta
        </Badge>
      )}
      
      {stats.newOrder > 0 && (
        <Badge className="text-xs bg-orange-600 hover:bg-orange-700">
          <ChefHat className="h-3 w-3 mr-1" />
          {stats.newOrder} Orden{stats.newOrder !== 1 ? 'es' : ''}
        </Badge>
      )}
    </div>
  )
}

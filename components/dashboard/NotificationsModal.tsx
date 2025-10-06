"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Bell, 
  X, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Clock, 
  AlertTriangle, 
  Receipt, 
  HandHeart,
  ChefHat,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Notification, usePaginatedNotifications, useNotificationFilters } from "@/hooks/useNotificationsQuery"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onDismissNotification: (id: number) => void
  onDismissAll: () => void
}

// Notification type icons and colors
const notificationConfig = {
  waiter_call: {
    icon: HandHeart,
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    label: "Llamada de mesero"
  },
  bill_request: {
    icon: Receipt,
    color: "bg-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-200 dark:border-green-800",
    label: "Solicitud de cuenta"
  },
  special_request: {
    icon: AlertTriangle,
    color: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
    label: "Solicitud especial"
  },
  new_order: {
    icon: ChefHat,
    color: "bg-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    borderColor: "border-orange-200 dark:border-orange-800",
    label: "Nueva orden"
  }
}

export function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onDismissNotification,
  onDismissAll
}: NotificationsModalProps) {
  // Filter and sort notifications
  const {
    filteredNotifications,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    totalFiltered
  } = useNotificationFilters(notifications)

  // Paginate filtered notifications
  const {
    visibleNotifications,
    hasMore,
    remainingCount,
    isExpanded,
    showMore,
    showLess,
    showAll,
    visibleCount,
    totalCount
  } = usePaginatedNotifications(filteredNotifications, 5)

  const handleDismissAll = () => {
    visibleNotifications.forEach(notification => {
      onDismissNotification(notification.id)
    })
  }

  const getNotificationIcon = (type: Notification['type']) => {
    const config = notificationConfig[type]
    const IconComponent = config.icon
    return <IconComponent className="h-4 w-4" />
  }

  const getNotificationConfig = (type: Notification['type']) => {
    return notificationConfig[type]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-black text-white border-zinc-800">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-blue-400" />
            <DialogTitle className="text-xl font-semibold">
              Notificaciones ({totalCount})
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-zinc-900 border-zinc-700">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">Todas ({notifications.length})</SelectItem>
                <SelectItem value="waiter_call">Mesero</SelectItem>
                <SelectItem value="bill_request">Cuenta</SelectItem>
                <SelectItem value="special_request">Especial</SelectItem>
                <SelectItem value="new_order">Nueva orden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px] bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="timestamp">Tiempo</SelectItem>
                <SelectItem value="priority">Prioridad</SelectItem>
                <SelectItem value="table">Mesa</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>

          {totalFiltered > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismissAll}
              className="bg-transparent border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              Descartar visibles
            </Button>
          )}
        </div>

        <Separator className="bg-zinc-800" />

        {/* Notifications List */}
        <ScrollArea className="flex-1 max-h-[400px]">
          {totalFiltered === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-sm text-gray-500">
                {filter === 'all' 
                  ? 'No tienes notificaciones pendientes'
                  : `No hay notificaciones de tipo "${notificationConfig[filter as keyof typeof notificationConfig]?.label}"`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleNotifications.map((notification) => {
                const config = getNotificationConfig(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${config.color} text-white flex-shrink-0`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(notification.timestamp, { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {notification.message}
                          </p>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Mesa ID: {notification.tableId}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDismissNotification(notification.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* See More Controls */}
        {totalFiltered > 0 && (
          <>
            <Separator className="bg-zinc-800" />
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-400">
                Mostrando {visibleCount} de {totalFiltered} notificaciones
                {filter !== 'all' && ` (${notifications.length} total)`}
              </div>
              
              <div className="flex items-center gap-2">
                {hasMore && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={showMore}
                      className="bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800"
                    >
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Ver más ({remainingCount})
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={showAll}
                      className="bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver todas
                    </Button>
                  </>
                )}
                
                {isExpanded && totalFiltered > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={showLess}
                    className="bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800"
                  >
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Ver menos
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

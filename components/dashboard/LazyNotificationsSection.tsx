"use client"

import React, { Suspense, lazy, useMemo, useState, useEffect, useRef } from "react"
import { FrontendTable } from "@/lib/supabase"
import { NotificationSkeleton } from "@/components/ui/loading-skeletons"
import { useProgressiveLoading } from "@/hooks/useLazyLoading"
import { usePaginatedNotifications, useNotificationFilters } from "@/hooks/useNotificationsQuery"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp, Bell, Eye, Filter, SortAsc, SortDesc, X, AlertTriangle, HandHeart, Receipt, ChefHat } from "lucide-react"

// Lazy load the actual NotificationsSection component
const NotificationsSection = lazy(() => 
  import("./NotificationsSection").then(module => ({ default: module.NotificationsSection }))
)

// Notification interface (matching the one from NotificationsSection)
interface Notification {
  id: number
  type: 'new_order' | 'bill_request' | 'waiter_call' | 'special_request'
  tableId: string
  message: string
  timestamp: Date
  dismissed: boolean
}

interface LazyNotificationsSectionProps {
  activeNotifications: Notification[]
  tipNotifications: { [key: string]: boolean }
  tables: FrontendTable[]
  dismissNotification: (notificationId: number) => void
  setTipNotifications: (notifications: { [key: string]: boolean }) => void
  dismissTipNotification: (tableId: string) => void
  maxVisible?: number
  loadingDelay?: number
}

export function LazyNotificationsSection({
  activeNotifications,
  tipNotifications,
  tables,
  dismissNotification,
  setTipNotifications,
  dismissTipNotification,
  maxVisible = 5,
  loadingDelay = 100
}: LazyNotificationsSectionProps) {
  // State for expanded view
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Only load if there are notifications to show
  const hasNotifications = useMemo(() =>
    activeNotifications.length > 0 || Object.values(tipNotifications).some(Boolean),
    [activeNotifications.length, tipNotifications]
  )

  // Simple loading state without complex lazy loading
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Simple effect to handle loading
  useEffect(() => {
    if (hasNotifications && !hasLoaded) {
      // Skip loading delay for now to test UI
      setHasLoaded(true)
      setIsLoading(false)
    }
  }, [hasNotifications, hasLoaded])

  const retry = () => {
    setError(null)
    setHasLoaded(false)
  }

  // Filter and sort notifications
  const {
    filteredNotifications,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useNotificationFilters(activeNotifications)

  // Use filtered notifications for progressive loading
  const notificationsToShow = useMemo(() => {
    return isExpanded ? filteredNotifications : filteredNotifications.slice(0, maxVisible)
  }, [isExpanded, filteredNotifications, maxVisible])

  // Progressive loading for notifications
  const {
    loadedItems: loadedNotifications,
    isLoading: isLoadingMore,
    hasMore,
    loadNextBatch
  } = useProgressiveLoading(notificationsToShow, maxVisible, 50)

  // Show empty state if no notifications
  if (!hasNotifications) {
    return (
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-center text-gray-400">
          <Bell className="h-5 w-5 mr-2" />
          <span className="text-sm">No hay notificaciones</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/80 border border-red-400 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-red-300" />
            <span className="text-red-100 text-sm">Error al cargar notificaciones</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={retry}
            className="text-red-200 hover:bg-red-800/50 hover:text-red-100 h-8 px-2"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="space-y-4">
      {isLoading || !hasLoaded ? (
        // Loading skeleton
        <div className="space-y-2">
          {Array.from({ length: Math.min(3, activeNotifications.length) }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      ) : (
        <Suspense fallback={
          <div className="space-y-2">
            {Array.from({ length: Math.min(3, notificationsToShow.length) }).map((_, index) => (
              <NotificationSkeleton key={index} />
            ))}
          </div>
        }>
          {/* Show inline notifications list when expanded, otherwise use original component */}
          {isExpanded ? (
            <div className="space-y-4">
              {/* Notifications summary */}
              <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div className="text-sm text-gray-300 font-medium">
                  Mostrando {filteredNotifications.length} de {activeNotifications.length} notificaciones
                </div>

                {filteredNotifications.filter(n => n.type === 'special_request').length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {filteredNotifications.filter(n => n.type === 'special_request').length} Urgente
                  </Badge>
                )}

                {filteredNotifications.filter(n => n.type === 'waiter_call').length > 0 && (
                  <Badge className="text-xs bg-blue-600 hover:bg-blue-700">
                    <HandHeart className="h-3 w-3 mr-1" />
                    {filteredNotifications.filter(n => n.type === 'waiter_call').length} Mesero
                  </Badge>
                )}

                {filteredNotifications.filter(n => n.type === 'bill_request').length > 0 && (
                  <Badge className="text-xs bg-green-600 hover:bg-green-700">
                    <Receipt className="h-3 w-3 mr-1" />
                    {filteredNotifications.filter(n => n.type === 'bill_request').length} Cuenta
                  </Badge>
                )}
              </div>

              {/* Inline notifications list */}
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const getIcon = (type: string) => {
                    switch (type) {
                      case 'special_request': return <AlertTriangle className="h-4 w-4 text-red-400" />
                      case 'waiter_call': return <HandHeart className="h-4 w-4 text-blue-400" />
                      case 'bill_request': return <Receipt className="h-4 w-4 text-green-400" />
                      case 'new_order': return <ChefHat className="h-4 w-4 text-orange-400" />
                      default: return <Bell className="h-4 w-4 text-gray-400" />
                    }
                  }

                  const getBgColor = (type: string) => {
                    switch (type) {
                      case 'special_request': return 'bg-red-950/20 border-red-800/30'
                      case 'waiter_call': return 'bg-blue-950/20 border-blue-800/30'
                      case 'bill_request': return 'bg-green-950/20 border-green-800/30'
                      case 'new_order': return 'bg-orange-950/20 border-orange-800/30'
                      default: return 'bg-zinc-800/50 border-zinc-700'
                    }
                  }

                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all hover:shadow-sm ${getBgColor(notification.type)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-1.5 rounded-full bg-zinc-800/50 flex-shrink-0">
                            {getIcon(notification.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {notification.type === 'special_request' ? 'Urgente' :
                                 notification.type === 'waiter_call' ? 'Mesero' :
                                 notification.type === 'bill_request' ? 'Cuenta' : 'Orden'}
                              </Badge>
                            </div>

                            <p className="text-sm font-medium text-gray-100 mb-1">
                              {notification.message}
                            </p>

                            <p className="text-xs text-gray-400">
                              Mesa ID: {notification.tableId}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissNotification(notification.id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <NotificationsSection
              activeNotifications={loadedNotifications}
              tipNotifications={tipNotifications}
              tables={tables}
              dismissNotification={dismissNotification}
              setTipNotifications={setTipNotifications}
              dismissTipNotification={dismissTipNotification}
            />
          )}
        </Suspense>
      )}

      {/* Load more notifications button and see all button */}
      {hasLoaded && (
        <div className="flex justify-center gap-2">
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadNextBatch}
              disabled={isLoadingMore}
              className="bg-transparent border-zinc-950 text-white hover:bg-gray-700"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                  Cargando...
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-2" />
                  Ver más ({activeNotifications.length - loadedNotifications.length})
                </>
              )}
            </Button>
          )}

          {/* Expand/collapse button */}
          {filteredNotifications.length > maxVisible && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-transparent border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-2" />
                  Ver menos
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-2" />
                  Ver todas ({filteredNotifications.length})
                </>
              )}
            </Button>
          )}

          {/* Show filters toggle */}
          {isExpanded && filteredNotifications.length > 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800"
            >
              <Filter className="h-3 w-3 mr-2" />
              {showFilters ? 'Ocultar filtros' : 'Filtros'}
            </Button>
          )}
        </div>
      )}

      {/* Filter Controls - shown when expanded */}
      {isExpanded && showFilters && (
        <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filter by type */}
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">Todas ({activeNotifications.length})</SelectItem>
                  <SelectItem value="special_request">Urgentes</SelectItem>
                  <SelectItem value="waiter_call">Mesero</SelectItem>
                  <SelectItem value="bill_request">Cuenta</SelectItem>
                  <SelectItem value="new_order">Órdenes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-[120px] bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
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

            {/* Dismiss all button */}
            {filteredNotifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  filteredNotifications.forEach(notification => {
                    dismissNotification(notification.id)
                  })
                }}
                className="bg-transparent border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <X className="h-3 w-3 mr-2" />
                Descartar todas
              </Button>
            )}
          </div>

          <Separator className="bg-zinc-700" />

          {/* Filter summary */}
          <div className="text-sm text-gray-400">
            Mostrando {filteredNotifications.length} de {activeNotifications.length} notificaciones
            {filter !== 'all' && ` (filtrado por ${filter})`}
          </div>
        </div>
      )}

      {/* Additional loading skeleton for more notifications */}
      {isLoadingMore && (
        <div className="space-y-2">
          {Array.from({
            length: Math.min(maxVisible, filteredNotifications.length - loadedNotifications.length)
          }).map((_, index) => (
            <NotificationSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// Compact notification preview for better performance
export function CompactNotificationPreview({
  activeNotifications,
  tipNotifications,
  onExpand,
  onDismissNotification,
  onDismissAll
}: {
  activeNotifications: Notification[]
  tipNotifications: { [key: string]: boolean }
  onExpand: () => void
  onDismissNotification?: (id: number) => void
  onDismissAll?: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const totalNotifications = activeNotifications.length +
    Object.values(tipNotifications).filter(Boolean).length

  if (totalNotifications === 0) {
    return null
  }

  const urgentCount = activeNotifications.filter(n => n.type === 'special_request').length
  const waiterCallCount = activeNotifications.filter(n => n.type === 'waiter_call').length
  const billRequestCount = activeNotifications.filter(n => n.type === 'bill_request').length

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
    onExpand()
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleExpand}
          className="flex-1 bg-transparent border-zinc-950 text-white hover:bg-gray-700 relative"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm">
                {totalNotifications} notificación{totalNotifications !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {urgentCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1 py-0 h-5">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {urgentCount}
                </Badge>
              )}
              {waiterCallCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-5 bg-blue-600">
                  <HandHeart className="h-3 w-3 mr-1" />
                  {waiterCallCount}
                </Badge>
              )}
              {billRequestCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-5 bg-green-600">
                  <Receipt className="h-3 w-3 mr-1" />
                  {billRequestCount}
                </Badge>
              )}
            </div>
          </div>
        </Button>

        {totalNotifications > 0 && onDismissAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDismissAll}
            className="bg-transparent border-red-600 text-red-400 hover:bg-red-600 hover:text-white px-3"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Expanded notification list */}
      {isExpanded && activeNotifications.length > 0 && (
        <div className="space-y-2 pl-4 border-l-2 border-zinc-700">
          {activeNotifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className="flex items-center justify-between p-2 bg-zinc-800/50 rounded text-xs"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {notification.type === 'special_request' && (
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                  )}
                  {notification.type === 'waiter_call' && (
                    <HandHeart className="h-3 w-3 text-blue-400" />
                  )}
                  {notification.type === 'bill_request' && (
                    <Receipt className="h-3 w-3 text-green-400" />
                  )}
                  {notification.type === 'new_order' && (
                    <ChefHat className="h-3 w-3 text-orange-400" />
                  )}
                </div>
                <span className="text-gray-300 truncate">
                  {notification.message}
                </span>
              </div>
              {onDismissNotification && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismissNotification(notification.id)}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-red-400 flex-shrink-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {activeNotifications.length > 5 && (
            <div className="text-center">
              <span className="text-xs text-gray-400">
                +{activeNotifications.length - 5} más notificaciones
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

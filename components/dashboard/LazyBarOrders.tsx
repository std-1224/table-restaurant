"use client"

import React, { Suspense, lazy } from "react"
import { BarOrderSkeleton } from "@/components/ui/loading-skeletons"
import { useProgressiveLoading, useLazyLoading } from "@/hooks/useLazyLoading"
import { Button } from "@/components/ui/button"
import { ChevronDown, Coffee } from "lucide-react"

// Lazy load the actual BarOrders component
const BarOrders = lazy(() => 
  import("./BarOrders").then(module => ({ default: module.BarOrders }))
)

// Bar order interface (matching the one from main dashboard)
interface BarOrder {
  id: number
  items: string[]
  status: "pending" | "preparing" | "ready" | "delivered"
  barId: number
  timestamp: Date
  assignedBartender?: string
  drinkTypes?: { [key: string]: number }
}

interface LazyBarOrdersProps {
  barOrders: BarOrder[]
  barFilter: string
  setBarFilter: (filter: string) => void
  markBarOrderAsDelivered: (orderId: number) => void
  batchSize?: number
  loadingDelay?: number
}

export function LazyBarOrders({
  barOrders,
  barFilter,
  setBarFilter,
  markBarOrderAsDelivered,
  batchSize = 5,
  loadingDelay = 150
}: LazyBarOrdersProps) {
  // Only load if there are orders to show
  const hasOrders = barOrders.length > 0

  const {
    ref,
    isVisible,
    hasLoaded,
    isLoading,
    error,
    retry
  } = useLazyLoading({
    enabled: hasOrders,
    delay: loadingDelay
  })

  // Progressive loading for orders
  const {
    loadedItems: loadedOrders,
    isLoading: isLoadingMore,
    hasMore,
    loadNextBatch
  } = useProgressiveLoading(barOrders, batchSize, 100)

  // Show empty state if no orders
  if (!hasOrders) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <Coffee className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No hay pedidos de barra</p>
          <p className="text-sm mt-2">Los pedidos aparecerán aquí cuando se realicen</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-400 space-y-4">
          <Coffee className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Error al cargar pedidos</p>
          <p className="text-sm">{error.message}</p>
          <Button
            onClick={retry}
            variant="outline"
            className="bg-transparent border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
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
        <div className="space-y-4">
          {Array.from({ length: Math.min(batchSize, barOrders.length) }).map((_, index) => (
            <BarOrderSkeleton key={index} />
          ))}
        </div>
      ) : (
        <Suspense fallback={
          <div className="space-y-4">
            {Array.from({ length: Math.min(batchSize, barOrders.length) }).map((_, index) => (
              <BarOrderSkeleton key={index} />
            ))}
          </div>
        }>
          <BarOrders
            barOrders={loadedOrders}
            barFilter={barFilter}
            setBarFilter={setBarFilter}
            markBarOrderAsDelivered={markBarOrderAsDelivered}
          />
        </Suspense>
      )}

      {/* Load more orders button */}
      {hasLoaded && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadNextBatch}
            disabled={isLoadingMore}
            className="bg-transparent border-zinc-950 text-white hover:bg-gray-700"
          >
            {isLoadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Cargando más pedidos...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Cargar más pedidos ({barOrders.length - loadedOrders.length} restantes)
              </>
            )}
          </Button>
        </div>
      )}

      {/* Additional loading skeleton for more orders */}
      {isLoadingMore && (
        <div className="space-y-4">
          {Array.from({ 
            length: Math.min(batchSize, barOrders.length - loadedOrders.length) 
          }).map((_, index) => (
            <BarOrderSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// Compact bar orders preview for better performance
export function CompactBarOrdersPreview({
  barOrders,
  onExpand
}: {
  barOrders: BarOrder[]
  onExpand: () => void
}) {
  if (barOrders.length === 0) {
    return null
  }

  const pendingCount = barOrders.filter(order => order.status === 'pending').length
  const preparingCount = barOrders.filter(order => order.status === 'preparing').length
  const readyCount = barOrders.filter(order => order.status === 'ready').length

  return (
    <Button
      variant="outline"
      onClick={onExpand}
      className="w-full bg-transparent border-zinc-950 text-white hover:bg-gray-700"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4" />
          <span className="text-sm">
            {barOrders.length} pedido{barOrders.length !== 1 ? 's' : ''} de barra
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {pendingCount > 0 && (
            <span className="bg-yellow-600 text-white px-2 py-1 rounded">
              {pendingCount} pendientes
            </span>
          )}
          {preparingCount > 0 && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded">
              {preparingCount} preparando
            </span>
          )}
          {readyCount > 0 && (
            <span className="bg-green-600 text-white px-2 py-1 rounded">
              {readyCount} listos
            </span>
          )}
        </div>
      </div>
    </Button>
  )
}

// Virtual scrolling for large number of orders
export function VirtualizedBarOrders({
  barOrders,
  barFilter,
  setBarFilter,
  markBarOrderAsDelivered,
  itemHeight = 120,
  containerHeight = 600
}: LazyBarOrdersProps & {
  itemHeight?: number
  containerHeight?: number
}) {
  const filteredOrders = React.useMemo(() => {
    if (barFilter === 'all') return barOrders
    return barOrders.filter(order => order.status === barFilter)
  }, [barOrders, barFilter])

  const [scrollTop, setScrollTop] = React.useState(0)
  const overscan = 3
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    filteredOrders.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleOrders = filteredOrders.slice(startIndex, endIndex + 1)
  const totalHeight = filteredOrders.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div 
      className="overflow-auto border border-zinc-950 rounded-lg"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <Suspense fallback={
            <div className="space-y-4 p-4">
              {Array.from({ length: Math.min(5, visibleOrders.length) }).map((_, index) => (
                <BarOrderSkeleton key={index} />
              ))}
            </div>
          }>
            <BarOrders
              barOrders={visibleOrders}
              barFilter={barFilter}
              setBarFilter={setBarFilter}
              markBarOrderAsDelivered={markBarOrderAsDelivered}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

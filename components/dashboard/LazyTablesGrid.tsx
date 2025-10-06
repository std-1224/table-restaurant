"use client"

import React, { Suspense, lazy } from "react"
import { FrontendTable } from "@/lib/supabase"
import { TablesGridSkeleton } from "@/components/ui/loading-skeletons"
import { useProgressiveLoading } from "@/hooks/useLazyLoading"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

// Lazy load the actual TablesGrid component
const TablesGrid = lazy(() => 
  import("./TablesGrid").then(module => ({ default: module.TablesGrid }))
)

interface LazyTablesGridProps {
  tables: FrontendTable[]
  quickFreeTable: (tableId: string) => void
  onCreateTable: () => void
  batchSize?: number
  loadingDelay?: number
}

export function LazyTablesGrid({
  tables,
  quickFreeTable,
  onCreateTable,
  batchSize = 8,
  loadingDelay = 150
}: LazyTablesGridProps) {
  const {
    loadedItems: loadedTables,
    isLoading: isLoadingMore,
    hasMore,
    loadNextBatch
  } = useProgressiveLoading(tables, batchSize, loadingDelay)

  return (
    <div className="space-y-4">
      <Suspense fallback={<TablesGridSkeleton count={batchSize} />}>
        <TablesGrid
          tables={loadedTables}
          quickFreeTable={quickFreeTable}
          onCreateTable={onCreateTable}
        />
      </Suspense>

      {/* Progressive loading controls */}
      {hasMore && (
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
                Cargando más mesas...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Cargar más mesas ({tables.length - loadedTables.length} restantes)
              </>
            )}
          </Button>
        </div>
      )}

      {/* Loading skeleton for additional items */}
      {isLoadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 p-4">
          {Array.from({ length: Math.min(batchSize, tables.length - loadedTables.length) }).map((_, index) => (
            <div key={`skeleton-${index}`} className="flex flex-col space-y-1 w-full min-w-0">
              <div className="h-32 sm:h-36 lg:h-40 w-full flex flex-col items-center justify-center gap-1 sm:gap-2 border-2 border-gray-700 rounded-lg p-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-700 rounded" />
                <div className="h-6 w-16 bg-gray-600 rounded" />
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-gray-700 rounded" />
                  <div className="h-3 w-8 bg-gray-700 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-gray-700 rounded" />
                  <div className="h-3 w-12 bg-gray-700 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-700 rounded" />
                </div>
              </div>
              <div className="flex gap-1">
                <div className="h-8 flex-1 bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  SkeletonComponent: React.ComponentType,
  displayName?: string
) {
  const LazyComponent = (props: T) => (
    <Suspense fallback={<SkeletonComponent />}>
      <Component {...props} />
    </Suspense>
  )

  LazyComponent.displayName = displayName || `LazyLoaded(${Component.displayName || Component.name})`
  
  return LazyComponent
}

// Error boundary for lazy loading
export class LazyLoadingErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center space-y-2">
            <p>Error loading component</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="bg-transparent border-zinc-950 text-white hover:bg-gray-700"
            >
              Retry
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

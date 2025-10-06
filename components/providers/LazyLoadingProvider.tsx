"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

// Types for lazy loading context
interface LazyLoadingState {
  isGlobalLoading: boolean
  loadingComponents: Set<string>
  loadedComponents: Set<string>
  errors: Map<string, Error>
  loadingProgress: number
}

interface LazyLoadingActions {
  startLoading: (componentId: string) => void
  finishLoading: (componentId: string) => void
  setError: (componentId: string, error: Error) => void
  clearError: (componentId: string) => void
  reset: () => void
}

type LazyLoadingContextType = LazyLoadingState & LazyLoadingActions

// Create context
const LazyLoadingContext = createContext<LazyLoadingContextType | null>(null)

// Hook to use lazy loading context
export function useLazyLoadingContext() {
  const context = useContext(LazyLoadingContext)
  if (!context) {
    throw new Error('useLazyLoadingContext must be used within a LazyLoadingProvider')
  }
  return context
}

// Provider component
interface LazyLoadingProviderProps {
  children: React.ReactNode
  totalComponents?: number
  showGlobalProgress?: boolean
}

export function LazyLoadingProvider({ 
  children, 
  totalComponents = 10,
  showGlobalProgress = false 
}: LazyLoadingProviderProps) {
  const [loadingComponents, setLoadingComponents] = useState<Set<string>>(new Set())
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Map<string, Error>>(new Map())

  // Calculate loading progress
  const loadingProgress = Math.round((loadedComponents.size / totalComponents) * 100)
  const isGlobalLoading = loadingComponents.size > 0

  const startLoading = useCallback((componentId: string) => {
    setLoadingComponents(prev => new Set(prev).add(componentId))
    setErrors(prev => {
      const newErrors = new Map(prev)
      newErrors.delete(componentId)
      return newErrors
    })
  }, [])

  const finishLoading = useCallback((componentId: string) => {
    setLoadingComponents(prev => {
      const newSet = new Set(prev)
      newSet.delete(componentId)
      return newSet
    })
    setLoadedComponents(prev => new Set(prev).add(componentId))
  }, [])

  const setError = useCallback((componentId: string, error: Error) => {
    setLoadingComponents(prev => {
      const newSet = new Set(prev)
      newSet.delete(componentId)
      return newSet
    })
    setErrors(prev => new Map(prev).set(componentId, error))
  }, [])

  const clearError = useCallback((componentId: string) => {
    setErrors(prev => {
      const newErrors = new Map(prev)
      newErrors.delete(componentId)
      return newErrors
    })
  }, [])

  const reset = useCallback(() => {
    setLoadingComponents(new Set())
    setLoadedComponents(new Set())
    setErrors(new Map())
  }, [])

  const contextValue: LazyLoadingContextType = {
    isGlobalLoading,
    loadingComponents,
    loadedComponents,
    errors,
    loadingProgress,
    startLoading,
    finishLoading,
    setError,
    clearError,
    reset
  }

  return (
    <LazyLoadingContext.Provider value={contextValue}>
      {showGlobalProgress && isGlobalLoading && (
        <GlobalLoadingIndicator progress={loadingProgress} />
      )}
      {children}
    </LazyLoadingContext.Provider>
  )
}

// Global loading indicator component
function GlobalLoadingIndicator({ progress }: { progress: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="h-1 bg-gray-800">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="p-2 text-center">
        <span className="text-white text-sm">Cargando componentes... {progress}%</span>
      </div>
    </div>
  )
}

// HOC for automatic loading state management
export function withLazyLoadingTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentId: string
) {
  return function TrackedComponent(props: T) {
    const { startLoading, finishLoading, setError } = useLazyLoadingContext()

    useEffect(() => {
      startLoading(componentId)
      
      // Simulate component loading time
      const timer = setTimeout(() => {
        finishLoading(componentId)
      }, 100)

      return () => {
        clearTimeout(timer)
      }
    }, [startLoading, finishLoading])

    try {
      return <Component {...props} />
    } catch (error) {
      setError(componentId, error as Error)
      throw error
    }
  }
}

// Hook for component-level loading management
export function useComponentLoading(componentId: string) {
  const { 
    startLoading, 
    finishLoading, 
    setError, 
    clearError,
    loadingComponents,
    errors 
  } = useLazyLoadingContext()

  const isLoading = loadingComponents.has(componentId)
  const error = errors.get(componentId)

  const load = useCallback(async (loadFn: () => Promise<void>) => {
    try {
      startLoading(componentId)
      await loadFn()
      finishLoading(componentId)
    } catch (err) {
      setError(componentId, err as Error)
      throw err
    }
  }, [componentId, startLoading, finishLoading, setError])

  const retry = useCallback(() => {
    clearError(componentId)
  }, [componentId, clearError])

  return {
    isLoading,
    error,
    load,
    retry
  }
}

// Performance monitoring hook
export function useLazyLoadingPerformance() {
  const { loadedComponents, loadingComponents, errors } = useLazyLoadingContext()
  const [metrics, setMetrics] = useState({
    totalLoaded: 0,
    totalErrors: 0,
    averageLoadTime: 0,
    loadTimes: [] as number[]
  })

  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      totalLoaded: loadedComponents.size,
      totalErrors: errors.size
    }))
  }, [loadedComponents.size, errors.size])

  const recordLoadTime = useCallback((componentId: string, loadTime: number) => {
    setMetrics(prev => {
      const newLoadTimes = [...prev.loadTimes, loadTime]
      const averageLoadTime = newLoadTimes.reduce((a, b) => a + b, 0) / newLoadTimes.length
      
      return {
        ...prev,
        loadTimes: newLoadTimes.slice(-100), // Keep last 100 measurements
        averageLoadTime
      }
    })
  }, [])

  return {
    ...metrics,
    recordLoadTime,
    isLoading: loadingComponents.size > 0
  }
}

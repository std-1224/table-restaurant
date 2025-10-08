import { useState, useEffect, useCallback, useRef } from 'react'
import { useIntersectionObserver } from './useIntersectionObserver'

// Types for lazy loading
export interface LazyLoadingOptions {
  threshold?: number
  rootMargin?: string
  enabled?: boolean
  delay?: number
}

export interface LazyLoadingState {
  isVisible: boolean
  hasLoaded: boolean
  isLoading: boolean
  error: Error | null
}

// Hook for lazy loading with intersection observer
export function useLazyLoading(options: LazyLoadingOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    enabled = true,
    delay = 0
  } = options

  const [state, setState] = useState<LazyLoadingState>({
    isVisible: false,
    hasLoaded: false,
    isLoading: false,
    error: null
  })

  const timeoutRef = useRef<NodeJS.Timeout>()
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    enabled
  })

  const load = useCallback(async (loadFn?: () => Promise<void>) => {
    setState(prev => {
      if (prev.hasLoaded || prev.isLoading || !enabled) return prev
      return { ...prev, isLoading: true, error: null }
    })

    try {
      if (delay > 0) {
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, delay)
        })
      }

      if (loadFn) {
        await loadFn()
      }

      setState(prev => ({
        ...prev,
        hasLoaded: true,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }))
    }
  }, [enabled, delay])

  useEffect(() => {
    if (isIntersecting && !state.isVisible) {
      setState(prev => ({ ...prev, isVisible: true }))
    }
  }, [isIntersecting])

  useEffect(() => {
    if (state.isVisible && !state.hasLoaded && !state.isLoading && enabled) {
      load()
    }
  }, [state.isVisible, state.hasLoaded, state.isLoading, enabled])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const retry = useCallback(() => {
    setState(prev => ({ ...prev, error: null, hasLoaded: false }))
  }, [])

  return {
    ref,
    ...state,
    load,
    retry
  }
}

// Hook for progressive data loading
export function useProgressiveLoading<T>(
  items: T[],
  batchSize: number = 10,
  delay: number = 100
) {
  const [loadedItems, setLoadedItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const loadNextBatch = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    try {
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(resolve, delay)
      })

      setLoadedItems(prev => {
        const currentLength = prev.length
        const nextBatch = items.slice(currentLength, currentLength + batchSize)

        if (nextBatch.length === 0) {
          setHasMore(false)
          return prev
        } else {
          setHasMore(currentLength + nextBatch.length < items.length)
          return [...prev, ...nextBatch]
        }
      })
    } finally {
      setIsLoading(false)
    }
  }, [items, batchSize, delay])

  // Reset when items change (with deep comparison to prevent unnecessary resets)
  useEffect(() => {
    setLoadedItems(prev => {
      // Only reset if the items actually changed
      const newItems = items.slice(0, batchSize)
      if (prev.length !== newItems.length ||
          prev.some((item, index) => item !== newItems[index])) {
        setHasMore(items.length > batchSize)
        return newItems
      }
      return prev
    })
  }, [items, batchSize])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    loadedItems,
    isLoading,
    hasMore,
    loadNextBatch
  }
}

// Hook for lazy component loading
export function useLazyComponent<T = any>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options: LazyLoadingOptions = {}
) {
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { ref, isVisible } = useLazyLoading(options)

  useEffect(() => {
    if (isVisible && !Component && !isLoading) {
      setIsLoading(true)
      setError(null)

      importFn()
        .then(module => {
          setComponent(() => module.default)
        })
        .catch(err => {
          setError(err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isVisible, Component, isLoading, importFn])

  return {
    ref,
    Component,
    isLoading,
    error,
    isVisible
  }
}

// Hook for debounced loading
export function useDebouncedLoading(delay: number = 300) {
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const startLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false)
    }, delay)
  }, [delay])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isLoading,
    startLoading,
    stopLoading
  }
}

// Hook for virtual scrolling (basic implementation)
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    handleScroll
  }
}

import { useEffect, useRef, useState } from 'react'

export interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
  enabled?: boolean
}

export function useIntersectionObserver({
  threshold = 0,
  rootMargin = '0px',
  root = null,
  enabled = true
}: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const elementRef = useRef<Element | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!enabled || !elementRef.current) return

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
      },
      {
        threshold,
        rootMargin,
        root
      }
    )

    // Start observing
    observerRef.current.observe(elementRef.current)

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold, rootMargin, root, enabled])

  // Ref callback to handle element changes
  const ref = (element: Element | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current)
    }

    elementRef.current = element

    if (element && observerRef.current && enabled) {
      observerRef.current.observe(element)
    }
  }

  return {
    ref,
    isIntersecting,
    entry
  }
}

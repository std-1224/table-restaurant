import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Table card skeleton
export function TableCardSkeleton() {
  return (
    <div className="flex flex-col space-y-1 w-full min-w-0">
      <div className="h-32 sm:h-36 lg:h-40 w-full flex flex-col items-center justify-center gap-1 sm:gap-2 border-2 border-gray-700 rounded-lg p-4">
        <Skeleton className="h-4 w-20 bg-gray-700" />
        <Skeleton className="h-6 w-16 bg-gray-600" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded bg-gray-700" />
          <Skeleton className="h-3 w-8 bg-gray-700" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded bg-gray-700" />
          <Skeleton className="h-3 w-12 bg-gray-700" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded bg-gray-700" />
          <Skeleton className="h-3 w-16 bg-gray-700" />
        </div>
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-8 flex-1 bg-gray-700" />
        <Skeleton className="h-8 w-8 bg-gray-700" />
      </div>
    </div>
  )
}

// Tables grid skeleton
export function TablesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Card className="border-zinc-950 bg-transparent">
      <CardHeader className="pb-3 lg:pb-4">
        <Skeleton className="h-6 w-16 bg-gray-700" />
      </CardHeader>
      <CardContent className="p-1 sm:p-2 lg:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: count }).map((_, index) => (
            <TableCardSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Table details skeleton
export function TableDetailsSkeleton() {
  return (
    <Card className="bg-transparent border-zinc-950">
      <CardHeader className="pb-3 lg:pb-4">
        <Skeleton className="h-6 w-32 bg-gray-700" />
      </CardHeader>
      <CardContent className="p-3 lg:p-6">
        <div className="space-y-3 lg:space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 bg-gray-700" />
            <Skeleton className="h-6 w-16 bg-gray-700" />
          </div>
          
          <div className="grid grid-cols-2 gap-2 lg:gap-3">
            <div className="space-y-1">
              <Skeleton className="h-4 w-16 bg-gray-700" />
              <Skeleton className="h-6 w-12 bg-gray-700" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-20 bg-gray-700" />
              <Skeleton className="h-6 w-16 bg-gray-700" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-gray-700" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-2 lg:p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 bg-gray-700" />
                    <Skeleton className="h-5 w-16 bg-gray-700" />
                  </div>
                  <Skeleton className="h-3 w-32 bg-gray-700" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-full bg-gray-700" />
                    <Skeleton className="h-3 w-3/4 bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 bg-gray-700" />
            <Skeleton className="h-10 w-20 bg-gray-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Notification skeleton
export function NotificationSkeleton() {
  return (
    <div className="p-3 lg:p-4 border rounded-lg border-gray-700 bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 bg-gray-700" />
          <Skeleton className="h-4 w-48 bg-gray-700" />
          <Skeleton className="h-5 w-12 bg-gray-700" />
        </div>
        <Skeleton className="h-8 w-8 bg-gray-700" />
      </div>
    </div>
  )
}

// Dashboard header skeleton
export function DashboardHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 p-4 lg:p-6 bg-transparent border border-zinc-950 rounded-lg">
      <div className="flex items-center gap-3 lg:gap-4">
        <Skeleton className="h-8 w-8 bg-gray-700" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-32 bg-gray-700" />
          <Skeleton className="h-4 w-24 bg-gray-700" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="text-center space-y-1">
              <Skeleton className="h-6 w-8 mx-auto bg-gray-700" />
              <Skeleton className="h-3 w-12 bg-gray-700" />
            </div>
          ))}
        </div>
        <Skeleton className="h-8 w-8 bg-gray-700" />
      </div>
    </div>
  )
}

// Bar order skeleton
export function BarOrderSkeleton() {
  return (
    <div className="border border-gray-700 rounded-lg p-3 lg:p-4 space-y-2 lg:space-y-3 bg-gray-800">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 bg-gray-700" />
        <Skeleton className="h-6 w-16 bg-gray-700" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-full bg-gray-700" />
        <Skeleton className="h-4 w-3/4 bg-gray-700" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 bg-gray-700" />
        <Skeleton className="h-8 w-20 bg-gray-700" />
      </div>
    </div>
  )
}

// Loading spinner component
export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  }
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-white ${sizeClasses[size]}`} />
  )
}

// Progressive loading container
export function ProgressiveLoader({ 
  isLoading, 
  skeleton, 
  children,
  fallback
}: {
  isLoading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  if (isLoading) {
    return <>{skeleton}</>
  }
  
  if (fallback && !children) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

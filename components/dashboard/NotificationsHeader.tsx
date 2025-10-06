"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Eye, 
  AlertTriangle, 
  HandHeart, 
  Receipt, 
  ChefHat,
  X,
  Settings
} from "lucide-react"
import { Notification } from "@/hooks/useNotificationsQuery"
import { NotificationsModal } from "./NotificationsModal"

interface NotificationsHeaderProps {
  notifications: Notification[]
  onDismissNotification: (id: number) => void
  onDismissAll: () => void
  className?: string
}

export function NotificationsHeader({
  notifications,
  onDismissNotification,
  onDismissAll,
  className = ""
}: NotificationsHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Calculate notification statistics
  const stats = {
    total: notifications.length,
    urgent: notifications.filter(n => n.type === 'special_request').length,
    waiterCall: notifications.filter(n => n.type === 'waiter_call').length,
    billRequest: notifications.filter(n => n.type === 'bill_request').length,
    newOrder: notifications.filter(n => n.type === 'new_order').length,
  }

  // Get the most recent notifications for preview
  const recentNotifications = notifications
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 3)

  if (stats.total === 0) {
    return (
      <div className={`flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 ${className}`}>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-400">Sin notificaciones</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-500"
          disabled
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className={`p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 ${className}`}>
        {/* Header with total count and actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-5 w-5 text-blue-400" />
              {stats.urgent > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-xs font-bold">
                  !
                </div>
              )}
            </div>
            <span className="font-medium text-white">
              {stats.total} Notificación{stats.total !== 1 ? 'es' : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-transparent border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white h-8"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver todas
            </Button>
            
            {stats.total > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismissAll}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Notification type badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {stats.urgent > 0 && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {stats.urgent} Urgente{stats.urgent !== 1 ? 's' : ''}
            </Badge>
          )}
          
          {stats.waiterCall > 0 && (
            <Badge className="text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <HandHeart className="h-3 w-3" />
              {stats.waiterCall} Mesero
            </Badge>
          )}
          
          {stats.billRequest > 0 && (
            <Badge className="text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700">
              <Receipt className="h-3 w-3" />
              {stats.billRequest} Cuenta
            </Badge>
          )}
          
          {stats.newOrder > 0 && (
            <Badge className="text-xs flex items-center gap-1 bg-orange-600 hover:bg-orange-700">
              <ChefHat className="h-3 w-3" />
              {stats.newOrder} Orden{stats.newOrder !== 1 ? 'es' : ''}
            </Badge>
          )}
        </div>

        {/* Recent notifications preview */}
        {recentNotifications.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-medium">Recientes:</div>
            {recentNotifications.map((notification) => (
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismissNotification(notification.id)}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-red-400 flex-shrink-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {stats.total > 3 && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 h-6"
                >
                  +{stats.total - 3} más notificaciones
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        notifications={notifications}
        onDismissNotification={onDismissNotification}
        onDismissAll={onDismissAll}
      />
    </>
  )
}

// Compact version for smaller spaces
export function CompactNotificationsHeader({
  notifications,
  onDismissNotification,
  onDismissAll,
  className = ""
}: NotificationsHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const stats = {
    total: notifications.length,
    urgent: notifications.filter(n => n.type === 'special_request').length,
    waiterCall: notifications.filter(n => n.type === 'waiter_call').length,
    billRequest: notifications.filter(n => n.type === 'bill_request').length,
  }

  if (stats.total === 0) {
    return null
  }

  return (
    <>
      <div className={`flex items-center justify-between p-2 bg-zinc-900/30 rounded border border-zinc-800 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-4 w-4 text-blue-400" />
            {stats.urgent > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-2 h-2" />
            )}
          </div>
          <span className="text-sm text-white">{stats.total}</span>
          
          <div className="flex gap-1">
            {stats.urgent > 0 && (
              <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                {stats.urgent}
              </Badge>
            )}
            {stats.waiterCall > 0 && (
              <Badge className="text-xs px-1 py-0 h-4 bg-blue-600">
                {stats.waiterCall}
              </Badge>
            )}
            {stats.billRequest > 0 && (
              <Badge className="text-xs px-1 py-0 h-4 bg-green-600">
                {stats.billRequest}
              </Badge>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>

      <NotificationsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        notifications={notifications}
        onDismissNotification={onDismissNotification}
        onDismissAll={onDismissAll}
      />
    </>
  )
}

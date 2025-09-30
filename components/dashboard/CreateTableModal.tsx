"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatabaseTableStatus } from "@/lib/supabase"

interface CreateTableModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTable: (tableData: {
    number: number
    capacity: number
    status: DatabaseTableStatus
    assignedWaiter?: string
    fixedPrice?: number
    personalizedService?: string
  }) => Promise<void>
}

export function CreateTableModal({ isOpen, onClose, onCreateTable }: CreateTableModalProps) {
  const [formData, setFormData] = useState({
    number: 0,
    capacity: 4,
    status: "free" as DatabaseTableStatus,
    assignedWaiter: "none",
    fixedPrice: 0,
    personalizedService: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      await onCreateTable({
        number: formData.number,
        capacity: formData.capacity,
        status: formData.status,
        assignedWaiter: formData.assignedWaiter === "none" ? undefined : formData.assignedWaiter,
        fixedPrice: formData.fixedPrice || undefined,
        personalizedService: formData.personalizedService || undefined,
      })

      // Reset form
      setFormData({
        number: 0,
        capacity: 4,
        status: "free",
        assignedWaiter: "none",
        fixedPrice: 0,
        personalizedService: "",
      })
      onClose()
    } catch (error) {
      console.error('Failed to create table:', error)
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset form
    setFormData({
      number: 0,
      capacity: 4,
      status: "free",
      assignedWaiter: "none",
      fixedPrice: 0,
      personalizedService: "",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Nueva Mesa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableNumber" className="text-sm font-medium text-gray-300">
                Número de Mesa
              </Label>
              <Input
                id="tableNumber"
                type="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-medium text-gray-300">
                Capacidad (personas)
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="20"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 4 })}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="4"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium text-gray-300">
              Estado
            </Label>
            <Select value={formData.status} onValueChange={(value: DatabaseTableStatus) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="free" className="text-white hover:bg-gray-700">
                  Libre
                </SelectItem>
                <SelectItem value="waiting_order" className="text-white hover:bg-gray-700">
                  Esperando
                </SelectItem>
                <SelectItem value="producing" className="text-white hover:bg-gray-700">
                  En Curso
                </SelectItem>
                <SelectItem value="bill_requested" className="text-white hover:bg-gray-700">
                  Cuenta Solicitada
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waiter" className="text-sm font-medium text-gray-300">
              Mozo Asignado
            </Label>
            <Select value={formData.assignedWaiter} onValueChange={(value) => setFormData({ ...formData, assignedWaiter: value === "none" ? "" : value })}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Seleccionar mozo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="none" className="text-white hover:bg-gray-700">
                  Sin asignar
                </SelectItem>
                <SelectItem value="Carlos" className="text-white hover:bg-gray-700">
                  Carlos
                </SelectItem>
                <SelectItem value="María" className="text-white hover:bg-gray-700">
                  María
                </SelectItem>
                <SelectItem value="Ana" className="text-white hover:bg-gray-700">
                  Ana
                </SelectItem>
                <SelectItem value="Luis" className="text-white hover:bg-gray-700">
                  Luis
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fixedPrice" className="text-sm font-medium text-gray-300">
              Precio de Consumo Fijo (opcional)
            </Label>
            <Input
              id="fixedPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.fixedPrice}
              onChange={(e) => setFormData({ ...formData, fixedPrice: parseFloat(e.target.value) || 0 })}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personalizedService" className="text-sm font-medium text-gray-300">
              Servicio Personalizado (Opcional)
            </Label>
            <Textarea
              id="personalizedService"
              value={formData.personalizedService}
              onChange={(e) => setFormData({ ...formData, personalizedService: e.target.value })}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none"
              placeholder="Ej: Mesa VIP, Terraza, etc."
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 disabled:opacity-50"
            >
              {isSubmitting ? "Creando..." : "Crear Mesa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

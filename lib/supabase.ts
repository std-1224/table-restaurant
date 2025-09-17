import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on the schema
export type DatabaseTableStatus = 'free' | 'occupied' | 'waiting_order' | 'producing' | 'delivered' | 'bill_requested' | 'paid'
export type FrontendTableStatus = 'libre' | 'esperando' | 'en-curso' | 'cuenta-solicitada'

// Database table interface
export interface DatabaseTable {
  id: string
  venue_id: string
  table_number: number
  capacity: number
  current_guests: number
  status: DatabaseTableStatus
  assigned_waiter_id: string | null
  created_at: string
  updated_at: string
}

// Frontend table interface (matches existing mock data structure)
export interface FrontendTable {
  id: number
  number: string
  status: FrontendTableStatus
  orders: Order[]
  waitTime?: number
  diners?: number
  assignedWaiter?: string
  startTime?: Date
  dbStatus?: DatabaseTableStatus // Keep original database status for dashboard calculations
}

export interface Order {
  id: number
  item: string
  status: 'pendiente' | 'en-cocina' | 'entregado'
  timestamp: Date
}

// Status mapping functions
export function mapDatabaseStatusToFrontend(dbStatus: DatabaseTableStatus): FrontendTableStatus {
  switch (dbStatus) {
    case 'free':
      return 'libre'
    case 'occupied':
    case 'waiting_order':
      return 'esperando'
    case 'producing':
    case 'delivered':
      return 'en-curso'
    case 'bill_requested':
    case 'paid':
      return 'cuenta-solicitada'
    default:
      return 'libre'
  }
}

export function mapFrontendStatusToDatabase(frontendStatus: FrontendTableStatus): DatabaseTableStatus {
  switch (frontendStatus) {
    case 'libre':
      return 'free'
    case 'esperando':
      return 'occupied'
    case 'en-curso':
      return 'producing'
    case 'cuenta-solicitada':
      return 'bill_requested'
    default:
      return 'free'
  }
}

// Dashboard mapping configuration
export const dashboardMapping = {
  free: ["free"],
  busy: ["occupied", "waiting_order", "producing", "bill_requested"],
  delivered: ["delivered"],
  paid: ["paid"]
} as const

// Dashboard analytics helper functions
export function getDashboardAnalytics(tables: FrontendTable[]) {
  return {
    freeTables: tables.filter((t) => dashboardMapping.free.includes(t.dbStatus as any)).length,
    busyTables: tables.filter((t) => dashboardMapping.busy.includes(t.dbStatus as any)).length,
    deliveredTables: tables.filter((t) => dashboardMapping.delivered.includes(t.dbStatus as any)).length,
    paidTables: tables.filter((t) => dashboardMapping.paid.includes(t.dbStatus as any)).length
  }
}

// Convert database table to frontend format
export function mapDatabaseTableToFrontend(dbTable: DatabaseTable): FrontendTable {
  // Generate mock data for fields not in database
  const mockOrders: Order[] = []
  const mockWaitTime = dbTable.status !== 'free' ? Math.floor(Math.random() * 30) + 1 : undefined
  const mockStartTime = dbTable.status !== 'free' ? new Date(Date.now() - (mockWaitTime || 0) * 60000) : undefined

  // Mock waiters list
  const waiters = ['Carlos', 'María', 'Ana', 'Luis', 'Pedro', 'Sofia']
  const mockWaiter = dbTable.assigned_waiter_id ? waiters[Math.floor(Math.random() * waiters.length)] : undefined

  return {
    id: parseInt(dbTable.id.split('-')[0], 16) % 10000, // Convert UUID to number for frontend compatibility
    number: dbTable.table_number.toString(),
    status: mapDatabaseStatusToFrontend(dbTable.status),
    orders: mockOrders,
    waitTime: mockWaitTime,
    diners: dbTable.current_guests,
    assignedWaiter: mockWaiter,
    startTime: mockStartTime,
    // Keep the original database status for dashboard calculations
    dbStatus: dbTable.status
  }
}

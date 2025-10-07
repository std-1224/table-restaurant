import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session in URL (for OAuth callbacks)
    detectSessionInUrl: true,
    // Storage key for session persistence
    storageKey: 'restaurant-dashboard-auth',
    // Custom storage implementation (optional)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  // Global configuration
  global: {
    headers: {
      'X-Client-Info': 'restaurant-dashboard',
    },
  },
})


// Database types based on the schema
export type DatabaseTableStatus = 'free' | 'occupied' | 'waiting_order' | 'producing' | 'delivered' | 'bill_requested' | 'paid'

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
  id: string
  number: string
  orders: Order[]
  waitTime?: number
  diners?: number
  assignedWaiter?: string
  startTime?: Date
  status: DatabaseTableStatus // Keep original database status for dashboard calculations
}

export interface Order {
  id: number
  item: string
  status: 'pending' | 'preparing' | 'ready' | 'delivered'
  timestamp: Date
}
// Dashboard mapping configuration
export const dashboardMapping = {
  free: ["free"],
  busy: ["occupied", "waiting_order", "producing", "bill_requested"],
  delivered: ["delivered"],
  paid: ["paid"]
} as const

// Frontend status type (for UI display)
export type FrontendTableStatus = 'free' | 'waiting' | 'in-progress' | 'delivered' | 'bill-requested' | 'paid'

// Map database status to frontend status
export function mapDatabaseStatusToFrontend(dbStatus: DatabaseTableStatus): FrontendTableStatus {
  switch (dbStatus) {
    case 'free':
      return 'free'
    case 'occupied':
    case 'waiting_order':
    case 'producing':
      return 'in-progress'
    case 'delivered':
      return 'delivered'
    case 'bill_requested':
      return 'bill-requested'
    case 'paid':
      return 'paid'
    default:
      return 'free'
  }
}

// Map frontend status to database status
export function mapFrontendStatusToDatabase(frontendStatus: FrontendTableStatus): DatabaseTableStatus {
  switch (frontendStatus) {
    case 'free':
      return 'free'
    case 'waiting':
      return 'waiting_order'
    case 'in-progress':
      return 'producing'
    case 'delivered':
      return 'delivered'
    case 'bill-requested':
      return 'bill_requested'
    case 'paid':
      return 'paid'
    default:
      return 'free'
  }
}

// Map database table to frontend table
export function mapDatabaseTableToFrontend(dbTable: any): FrontendTable {
  return {
    id: dbTable.id, // Use table ID as frontend ID
    number: `${dbTable.table_number}`, // Use table number as frontend ID
    orders: [],
    diners: dbTable.current_guests,
    status: dbTable.status,
    waitTime: 0,
    assignedWaiter: dbTable.assignedWaiter?.name || undefined,
    startTime: new Date(dbTable.created_at)
  }
}

// Dashboard analytics helper functions
export function getDashboardAnalytics(tables: FrontendTable[]) {
  return {
    freeTables: tables.filter((t) => dashboardMapping.free.includes(t.status as any)).length,
    busyTables: tables.filter((t) => dashboardMapping.busy.includes(t.status as any)).length,
    deliveredTables: tables.filter((t) => dashboardMapping.delivered.includes(t.status as any)).length,
    paidTables: tables.filter((t) => dashboardMapping.paid.includes(t.status as any)).length
  }
}
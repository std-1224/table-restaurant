import { supabase, DatabaseTable, FrontendTable, mapDatabaseTableToFrontend, mapFrontendStatusToDatabase, FrontendTableStatus } from '../supabase'

// Default venue ID - in a real app, this would come from user authentication
const DEFAULT_VENUE_ID = null;

// Database interfaces for new features
export interface TableSession {
  id: string
  table_id: string
  start_time: string
  end_time: string | null
  total_spent: number
  status: 'active' | 'closed'
}

export interface TableOrder {
  id: string
  table_id: string
  order_id: string
  created_at: string
}

export interface TableNotification {
  id: string
  table_id: string
  type: 'waiter_call' | 'bill_request' | 'special_request' | 'new_order'
  status: 'pending' | 'resolved'
  created_at: string
  resolved_at: string | null
}

export interface CreateTableData {
  number: string
  capacity: number
  status: FrontendTableStatus
  assignedWaiter?: string
  fixedPrice?: number
  personalizedService?: string
}

/**
 * Fetch all tables for the current venue
 */
export async function fetchTables(): Promise<FrontendTable[]> {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number', { ascending: true })

    if (error) {
      console.error('Error fetching tables:', error)
      throw error
    }

    if (!data) {
      return []
    }

    // Convert database tables to frontend format
    return data.map(mapDatabaseTableToFrontend)
  } catch (error) {
    console.error('Failed to fetch tables:', error)
    throw error
  }
}

/**
 * Create a new table
 */
export async function createTable(tableData: CreateTableData): Promise<FrontendTable> {
  try {
    // Check if table number already exists
    const { data: existingTable } = await supabase
      .from('tables')
      .select('id')
      .eq('venue_id', DEFAULT_VENUE_ID)
      .eq('table_number', parseInt(tableData.number))
      .single()

    if (existingTable) {
      throw new Error(`Table number ${tableData.number} already exists`)
    }

    // Create the table
    const { data, error } = await supabase
      .from('tables')
      .insert({
        venue_id: DEFAULT_VENUE_ID,
        table_number: parseInt(tableData.number),
        capacity: tableData.capacity,
        current_guests: tableData.status === 'libre' ? 0 : tableData.capacity,
        status: mapFrontendStatusToDatabase(tableData.status),
        assigned_waiter_id: tableData.assignedWaiter ? generateWaiterId(tableData.assignedWaiter) : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating table:', error)
      throw error
    }

    if (!data) {
      throw new Error('No data returned from table creation')
    }

    return mapDatabaseTableToFrontend(data)
  } catch (error) {
    console.error('Failed to create table:', error)
    throw error
  }
}

/**
 * Update table status
 */
export async function updateTableStatus(tableId: number, newStatus: FrontendTableStatus): Promise<void> {
  try {
    // Find the table by converting frontend ID back to database format
    const { data: tables } = await supabase
      .from('tables')
      .select('id, table_number')

    if (!tables) {
      throw new Error('No tables found')
    }

    // Find matching table (this is a workaround for the ID conversion)
    const targetTable = tables.find(table => {
      const frontendId = parseInt(table.id.split('-')[0], 16) % 10000
      return frontendId === tableId
    })

    if (!targetTable) {
      throw new Error(`Table with ID ${tableId} not found`)
    }

    const dbStatus = mapFrontendStatusToDatabase(newStatus)
    
    const { error } = await supabase
      .from('tables')
      .update({ 
        status: dbStatus,
        current_guests: newStatus === 'libre' ? 0 : undefined
      })
      .eq('id', targetTable.id)

    if (error) {
      console.error('Error updating table status:', error)
      throw error
    }
  } catch (error) {
    console.error('Failed to update table status:', error)
    throw error
  }
}

/**
 * Delete a table
 */
export async function deleteTable(tableId: number): Promise<void> {
  try {
    // Find the table by converting frontend ID back to database format
    const { data: tables } = await supabase
      .from('tables')
      .select('id')
      .eq('venue_id', DEFAULT_VENUE_ID)

    if (!tables) {
      throw new Error('No tables found')
    }

    const targetTable = tables.find(table => {
      const frontendId = parseInt(table.id.split('-')[0], 16) % 10000
      return frontendId === tableId
    })

    if (!targetTable) {
      throw new Error(`Table with ID ${tableId} not found`)
    }

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', targetTable.id)

    if (error) {
      console.error('Error deleting table:', error)
      throw error
    }
  } catch (error) {
    console.error('Failed to delete table:', error)
    throw error
  }
}

/**
 * Create a new table session
 */
export async function createTableSession(tableId: number): Promise<TableSession> {
  try {
    // Find the table by converting frontend ID back to database format
    const { data: tables } = await supabase
      .from('tables')
      .select('id')

    if (!tables) {
      throw new Error('No tables found')
    }

    const targetTable = tables.find(table => {
      const frontendId = parseInt(table.id.split('-')[0], 16) % 10000
      return frontendId === tableId
    })

    if (!targetTable) {
      throw new Error(`Table with ID ${tableId} not found`)
    }

    const startTime = new Date()

    const { data, error } = await supabase
      .from('table_sessions')
      .insert({
        table_id: targetTable.id,
        start_time: startTime.toISOString(),
        end_time: null,
        total_spent: 0,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating table session:', error)
      throw error
    }

    if (!data) {
      throw new Error('No data returned from table session creation')
    }

    return data
  } catch (error) {
    console.error('Failed to create table session:', error)
    throw error
  }
}

/**
 * Update table session end time (close session)
 */
export async function closeTableSession(tableId: number): Promise<void> {
  try {
    // Find the table by converting frontend ID back to database format
    const { data: tables } = await supabase
      .from('tables')
      .select('id')

    if (!tables) {
      throw new Error('No tables found')
    }

    const targetTable = tables.find(table => {
      const frontendId = parseInt(table.id.split('-')[0], 16) % 10000
      return frontendId === tableId
    })

    if (!targetTable) {
      throw new Error(`Table with ID ${tableId} not found`)
    }

    // Find active session for this table
    const { data: activeSessions, error: findError } = await supabase
      .from('table_sessions')
      .select('id')
      .eq('table_id', targetTable.id)
      .eq('status', 'active')

    if (findError) {
      console.error('Error finding active session:', findError)
      throw findError
    }

    if (!activeSessions || activeSessions.length === 0) {
      console.log('No active session found for table', tableId)
      return
    }

    // Close the most recent active session
    const { error } = await supabase
      .from('table_sessions')
      .update({
        end_time: new Date().toISOString(),
        status: 'closed'
      })
      .eq('id', activeSessions[0].id)

    if (error) {
      console.error('Error closing table session:', error)
      throw error
    }
  } catch (error) {
    console.error('Failed to close table session:', error)
    throw error
  }
}

/**
 * Create a new table order
 */
export async function createTableOrder(tableId: number, orderId: string): Promise<TableOrder> {
  try {
    // Find the table by converting frontend ID back to database format
    const { data: tables } = await supabase
      .from('tables')
      .select('id')

    if (!tables) {
      throw new Error('No tables found')
    }

    const targetTable = tables.find(table => {
      const frontendId = parseInt(table.id.split('-')[0], 16) % 10000
      return frontendId === tableId
    })

    if (!targetTable) {
      throw new Error(`Table with ID ${tableId} not found`)
    }

    const { data, error } = await supabase
      .from('table_orders')
      .insert({
        table_id: targetTable.id,
        order_id: orderId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating table order:', error)
      throw error
    }

    if (!data) {
      throw new Error('No data returned from table order creation')
    }

    return data
  } catch (error) {
    console.error('Failed to create table order:', error)
    throw error
  }
}

/**
 * Create a new table notification
 */
export async function createTableNotification(
  tableId: number,
  type: 'waiter_call' | 'bill_request' | 'special_request' | 'new_order'
): Promise<TableNotification> {
  try {
    // Find the table by converting frontend ID back to database format
    const { data: tables } = await supabase
      .from('tables')
      .select('id')

    if (!tables) {
      throw new Error('No tables found')
    }

    const targetTable = tables.find(table => {
      const frontendId = parseInt(table.id.split('-')[0], 16) % 10000
      return frontendId === tableId
    })

    if (!targetTable) {
      throw new Error(`Table with ID ${tableId} not found`)
    }

    const { data, error } = await supabase
      .from('table_notifications')
      .insert({
        table_id: targetTable.id,
        type: type,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating table notification:', error)
      throw error
    }

    if (!data) {
      throw new Error('No data returned from table notification creation')
    }

    return data
  } catch (error) {
    console.error('Failed to create table notification:', error)
    throw error
  }
}

/**
 * Get table orders for display in BarOrders
 */
export async function getTableOrders(): Promise<TableOrder[]> {
  try {
    const { data, error } = await supabase
      .from('table_orders')
      .select(`
        *,
        tables!inner(table_number, status)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching table orders:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch table orders:', error)
    throw error
  }
}

/**
 * Generate a mock waiter ID based on name
 * In a real app, this would be a proper UUID from a waiters table
 */
function generateWaiterId(waiterName: string): string {
  const waiterIds: { [key: string]: string } = {
    'Carlos': '11111111-1111-1111-1111-111111111111',
    'María': '22222222-2222-2222-2222-222222222222',
    'Ana': '33333333-3333-3333-3333-333333333333',
    'Luis': '44444444-4444-4444-4444-444444444444',
    'Pedro': '55555555-5555-5555-5555-555555555555',
    'Sofia': '66666666-6666-6666-6666-666666666666'
  }

  return waiterIds[waiterName] || '00000000-0000-0000-0000-000000000000'
}



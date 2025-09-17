import { supabase, DatabaseTable, FrontendTable, mapDatabaseTableToFrontend, mapFrontendStatusToDatabase, FrontendTableStatus } from '../supabase'

// Default venue ID - in a real app, this would come from user authentication
const DEFAULT_VENUE_ID = null;

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

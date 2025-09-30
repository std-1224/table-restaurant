import { supabase, DatabaseTableStatus, FrontendTable, mapDatabaseStatusToFrontend, mapDatabaseTableToFrontend} from '../supabase'

// Default venue ID - in a real app, this would come from user authentication
const DEFAULT_VENUE_ID = null;

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

export interface OrderItem {
  id: string,
  user_id : string
  total_amount : number,
  notes : string,
  is_table_order : true,
  table_number : string,
  payment_method : string,
  user_name : string,
  qr_id : null,
  table_id : string,
  status: 'pending' | 'preparing' | 'ready' | 'delivered',
  created_at: string,
}

export interface OrderWithItems {
  id: string
  table_id: string
  order_id: string
  created_at: string
  order_items: OrderItem[]
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
  number: number
  capacity: number
  status: DatabaseTableStatus
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
    return data.map((dbTable) => mapDatabaseTableToFrontend(dbTable))
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
      .eq('table_number', tableData.number)
      .single()

    if (existingTable) {
      throw new Error(`Table number ${tableData.number} already exists`)
    }

    // Create the table
    const { data, error } = await supabase
      .from('tables')
      .insert({
        venue_id: DEFAULT_VENUE_ID,
        table_number: tableData.number,
        capacity: tableData.capacity,
        current_guests: tableData.status === 'free' ? 0 : tableData.capacity,
        status: tableData.status,
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

    return data
  } catch (error) {
    console.error('Failed to create table:', error)
    throw error
  }
}

/**
 * Update table status
 */
export async function updateTableStatus(
  tableId: string,
  newStatus: DatabaseTableStatus
): Promise<void> {
  console.log('Updating table status:', { tableId, newStatus })

  try {
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Reset current_guests to 0 when table becomes free
    if (newStatus === "free") {
      updateData.current_guests = 0
    }

    const { data, error } = await supabase
      .from("tables")
      .update(updateData)
      .eq("id", tableId)
      .select()

    if (error) {
      console.error("Error updating table status:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`No table found with ID: ${tableId}`)
    }

    console.log("Table status updated successfully:", data[0])
  } catch (error) {
    console.error("Failed to update table status:", error);
    throw error;
  }
}

/**
 * Create a new table session
 */
export async function createTableSession(tableId: string): Promise<TableSession> {
  try {
    const startTime = new Date()

    const { data, error } = await supabase
      .from('table_sessions')
      .insert({
        table_id: tableId,
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
export async function closeTableSession(tableId: string): Promise<void> {
  try {
    // Find active session for this table
    const { data: activeSessions, error: findError } = await supabase
      .from('table_sessions')
      .select('id')
      .eq('table_id', tableId)
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
 * Create a new table notification
 */
export async function createTableNotification(
  tableId: string,
  type: 'waiter_call' | 'bill_request' | 'special_request' | 'new_order'
): Promise<TableNotification> {
  try {
    const { data, error } = await supabase
      .from('table_notifications')
      .insert({
        table_id: tableId,
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
 * Get table orders with order items for a specific table
 */
export async function getTableOrdersForTable(tableId: string): Promise<OrderWithItems[]> {
  try {
    // Get table orders
    const { data: tableOrders, error: tableOrdersError } = await supabase
      .from('table_orders')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })

    if (tableOrdersError) {
      console.error('Error fetching table orders:', tableOrdersError)
      throw tableOrdersError
    }

    if (!tableOrders || tableOrders.length === 0) {
      return []
    }

    // For each table order, fetch the order items from the orders table
    const ordersWithItems: OrderWithItems[] = []

    for (const tableOrder of tableOrders) {
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', tableOrder.order_id)

      if (orderItemsError) {
        console.error(`Error fetching order items for order ${tableOrder.order_id}:`, orderItemsError)
        // Continue with other orders even if one fails
        continue
      }

      ordersWithItems.push({
        id: tableOrder.id,
        table_id: tableOrder.table_id,
        order_id: tableOrder.order_id,
        created_at: tableOrder.created_at,
        order_items: orderItems || []
      })
    }

    return ordersWithItems
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



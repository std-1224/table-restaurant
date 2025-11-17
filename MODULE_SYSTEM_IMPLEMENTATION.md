# Module Enable System Implementation - Table-Restaurant

## Overview

This document describes the implementation of the module enable functionality in the **table-restaurant** project. The system allows tenant-level control over which features/modules are available in the restaurant dashboard.

---

## Module Structure

**Main Module: StockQR** (Core)
- `stockqr` - Complete restaurant dashboard for table and bar management

**Sub-functionalities:**
- `stockqr_orders` - Order management
- `stockqr_finances` - Finance panel (Supervisor view)
- `stockqr_roles` - Role administration
- `stockqr_menu` - Menu management
- `stockqr_qr_tracking` - QR tracking/Barra view
- `stockqr_stock` - Stock management

---

## Implementation Details

### 1. Type Definitions (`lib/types.ts`)

```typescript
export type ModuleKey = 
  | 'stockqr'                  // Main StockQR module (Core)
  | 'stockqr_orders'           // Order management
  | 'stockqr_finances'         // Finance panel
  | 'stockqr_roles'            // Role administration
  | 'stockqr_menu'             // Menu management
  | 'stockqr_qr_tracking'      // QR tracking
  | 'stockqr_stock';           // Stock management

export interface AppsRegistry {
  id: string;
  key: ModuleKey;
  name: string;
  description: string;
  is_core: boolean;
  created_at: string;
}

export interface TenantModule {
  id: string;
  tenant_id: string;
  app_id: string;
  enabled: boolean;
  activated_at: string | null;
  created_at: string;
  apps_registry?: AppsRegistry | null;
}
```

### 2. App Context (`contexts/AppContext.tsx`)

**Purpose:** Manages tenant modules and provides module checking functionality

**Key Features:**
- Fetches tenant modules from Supabase
- Uses hardcoded tenant ID: `22abca07-a1ce-4a57-8b7a-2f22961109ad`
- Provides `isModuleEnabled(moduleKey)` function
- Uses two-query approach to bypass RLS issues

**Functions:**
- `fetchTenantModules()` - Fetches modules for the tenant
- `isModuleEnabled(moduleKey)` - Checks if a module is enabled

### 3. Tab Navigation with Module Enable (`app/page.tsx`)

**Tab to Module Mapping:**
```typescript
const tabModules: Record<string, ModuleKey> = {
  'comandera': 'stockqr',           // Core module
  'barra': 'stockqr_qr_tracking',   // QR tracking/Barra
  'supervisor': 'stockqr_finances', // Supervisor/Finances
}
```

**Implementation:**
- Each tab checks if its required module is enabled
- Disabled tabs show with 50% opacity and are not clickable
- Tooltips display "Módulo no habilitado" on hover
- Loading state prevents premature disabling

**Behavior:**
- ✅ Enabled modules: Fully clickable and functional
- ❌ Disabled modules: Grayed out (50% opacity), not clickable, shows tooltip
- 🔄 Loading state: All tabs visible during loading

### 4. Route Protection (`contexts/ProtectedRoute.tsx`)

**Route to Module Mapping:**
```typescript
const ROUTE_MODULES: Record<string, ModuleKey> = {
  '/': 'stockqr',                    // Dashboard - Core module
  '/auth': 'stockqr',                // Auth routes - Core module
  '/role-access': 'stockqr_roles',   // Role access management
};
```

**Protection Logic:**
1. **Authentication Check**: Redirects to `/auth/login` if user is not authenticated
2. **Public Routes**: `/auth/login`, `/auth/signup`, `/auth/forgot-password` are accessible without authentication
3. **Module-Protected Routes**: All other routes check if the required module is enabled
4. **Access Denied**: Shows error page with option to go back or return to dashboard

**Access Denied UI:**
- Shows a card with error message
- Explains why access was denied (module not enabled)
- Provides "Volver" (go back) and "Ir al Dashboard" (go to dashboard) buttons
- Uses Lock icon for module denial, AlertCircle for auth denial

---

## Database Setup

### SQL Migration

Run the SQL script to set up modules:

```bash
# Execute: database/setup_stockqr_modules.sql
```

### Enable Modules for Tenant

```sql
INSERT INTO public.tenant_modules (tenant_id, app_id, enabled, activated_at)
SELECT 
  '22abca07-a1ce-4a57-8b7a-2f22961109ad'::uuid,
  id,
  true,
  NOW()
FROM apps_registry
WHERE key IN ('stockqr', 'stockqr_orders', 'stockqr_finances', 'stockqr_roles', 'stockqr_menu', 'stockqr_qr_tracking', 'stockqr_stock')
ON CONFLICT (tenant_id, app_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  activated_at = EXCLUDED.activated_at;
```

---

## Testing

### Test 1: Disable Supervisor Tab

```sql
UPDATE tenant_modules 
SET enabled = false 
WHERE tenant_id = '22abca07-a1ce-4a57-8b7a-2f22961109ad' 
AND app_id = (SELECT id FROM apps_registry WHERE key = 'stockqr_finances');
```

**Expected Results:**
1. **In Tab Navigation:**
   - ✅ "Supervisor" tab appears grayed out
   - ✅ Hovering shows "Módulo no habilitado" tooltip
   - ✅ Clicking does nothing

2. **Direct URL Access:**
   - ✅ Accessing supervisor-related routes shows access denied page

### Test 2: Disable Barra Tab

```sql
UPDATE tenant_modules 
SET enabled = false 
WHERE tenant_id = '22abca07-a1ce-4a57-8b7a-2f22961109ad' 
AND app_id = (SELECT id FROM apps_registry WHERE key = 'stockqr_qr_tracking');
```

**Expected Results:**
- ✅ "Barra" tab appears grayed out and not clickable

---

## Benefits

1. **Dual-Layer Security**: Both UI (tabs) and route-level protection
2. **Better UX**: Clear feedback at both navigation and route level
3. **Prevents Bypass**: Users can't access disabled features via direct URLs
4. **Tenant-Level Control**: Each restaurant can enable/disable features
5. **Type-Safe**: TypeScript ensures correct module keys
6. **User-Friendly**: Clear error messages and navigation options

---

## Files Modified/Created

### Created:
- `lib/types.ts` - Module type definitions
- `contexts/AppContext.tsx` - App context with module management
- `contexts/ProtectedRoute.tsx` - Route protection component (like payper-client)
- `database/setup_stockqr_modules.sql` - SQL setup script
- `MODULE_SYSTEM_IMPLEMENTATION.md` - This documentation

### Modified:
- `app/layout.tsx` - Added AppProvider and RouteProtection
- `app/page.tsx` - Added module checking to tabs with tooltips

---

## Next Steps

1. Run the database migration to set up the modules
2. Enable modules for your tenant (ID: `22abca07-a1ce-4a57-8b7a-2f22961109ad`)
3. Test the implementation by disabling modules and checking tab/route behavior
4. Customize module mappings as needed for your specific use case


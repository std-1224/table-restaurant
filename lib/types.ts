// Module system types for table-restaurant

export type ModuleKey = 'commander';

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


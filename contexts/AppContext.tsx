"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ModuleKey, TenantModule } from "@/lib/types";
import { useAuth } from "./AuthContext";

interface AppContextType {
  tenantModules: TenantModule[];
  tenantModulesLoading: boolean;
  isModuleEnabled: (moduleKey: ModuleKey) => boolean;
  fetchTenantModules: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const { user } = useAuth();
  const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
  const [tenantModulesLoading, setTenantModulesLoading] = useState(false);

  // Hardcoded tenant ID for table-restaurant
  const TENANT_ID = "22abca07-a1ce-4a57-8b7a-2f22961109ad";

  const fetchTenantModules = useCallback(async () => {
    if (!user?.id) {
      console.log("⚠️ No user ID, skipping tenant modules fetch");
      return;
    }

    try {
      setTenantModulesLoading(true);

      console.log("📦 Fetching tenant modules for tenant:", TENANT_ID);

      // Fetch tenant_modules without apps_registry join
      const { data: modulesData, error: modulesError } = await supabase
        .from("tenant_modules")
        .select("*")
        .eq("tenant_id", TENANT_ID);

      if (modulesError) {
        console.error("❌ Error fetching tenant_modules:", modulesError);
        throw modulesError;
      }

      console.log("📦 Fetched tenant modules:", modulesData);

      // Collect all unique app_ids
      const appIds = modulesData
        ?.map((m) => m.app_id)
        .filter((id): id is string => !!id) || [];

      // Fetch apps_registry data separately
      let appsData: any[] = [];
      if (appIds.length > 0) {
        const { data, error: appsError } = await supabase
          .from("apps_registry")
          .select("id, key, name, description, is_core")
          .in("id", appIds);

        if (appsError) {
          console.error("❌ Error fetching apps_registry:", appsError);
        } else {
          appsData = data || [];
          console.log("📋 Fetched apps registry:", appsData);
        }
      }

      // Merge the data manually
      const mergedModules = modulesData?.map((module) => ({
        ...module,
        apps_registry: appsData.find((app) => app.id === module.app_id) || null,
      })) || [];

      console.log("✅ Merged tenant modules:", mergedModules);
      setTenantModules(mergedModules);
    } catch (error) {
      console.error("❌ Error in fetchTenantModules:", error);
      setTenantModules([]);
    } finally {
      setTenantModulesLoading(false);
    }
  }, [user?.id]);

  const isModuleEnabled = useCallback(
    (moduleKey: ModuleKey): boolean => {
      const module = tenantModules.find(
        (m) => m.apps_registry?.key === moduleKey
      );

      if (!module) {
        console.warn(`⚠️ Module '${moduleKey}' not found in tenant modules`);
        return false;
      }

      return module.enabled;
    },
    [tenantModules]
  );

  // Fetch tenant modules when user changes
  useEffect(() => {
    if (user?.id) {
      fetchTenantModules();
    }
  }, [user?.id, fetchTenantModules]);

  return (
    <AppContext.Provider
      value={{
        tenantModules,
        tenantModulesLoading,
        isModuleEnabled,
        fetchTenantModules,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}


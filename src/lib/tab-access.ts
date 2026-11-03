import type { Database } from "@/integrations/supabase/types";

type Quota = Database["public"]["Enums"]["quota_level"];
type Module = Pick<Database["public"]["Tables"]["quota_modules"]["Row"], "quota" | "tab_key">;

export function isTabAllowed(modules: readonly Module[], quota: Quota, tabKey: string) {
  return modules.some((module) => module.quota === quota && module.tab_key === tabKey);
}

// Undefined configuration or identity never grants access while requests load or fail.
export function canAccessTab(
  modules: readonly Module[] | undefined,
  quota: Quota | undefined,
  viewer: { isAdmin: boolean } | null | undefined,
  tabKey: string,
) {
  if (!viewer || !quota) return false;
  if (viewer.isAdmin) return true;
  return !!modules && isTabAllowed(modules, quota, tabKey);
}
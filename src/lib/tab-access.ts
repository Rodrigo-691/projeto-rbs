import type { Database } from "@/integrations/supabase/types";

type Quota = Database["public"]["Enums"]["quota_level"];
type Module = Pick<Database["public"]["Tables"]["quota_modules"]["Row"], "quota" | "tab_key">;
export type TabOverride = Pick<Database["public"]["Tables"]["sponsor_tab_overrides"]["Row"], "tab_key" | "allowed">;

export function isTabAllowed(modules: readonly Module[], quota: Quota, tabKey: string) {
  return modules.some((module) => module.quota === quota && module.tab_key === tabKey);
}

// Undefined configuration or identity never grants access while requests load or fail.
// A sponsor-specific override wins over the quota default (mirrors quota_allows in the DB).
export function canAccessTab(
  modules: readonly Module[] | undefined,
  quota: Quota | undefined,
  viewer: { isAdmin: boolean } | null | undefined,
  tabKey: string,
  overrides?: readonly TabOverride[],
) {
  if (!viewer || !quota) return false;
  if (viewer.isAdmin) return true;
  const override = overrides?.find((o) => o.tab_key === tabKey);
  if (override) return override.allowed;
  return !!modules && isTabAllowed(modules, quota, tabKey);
}

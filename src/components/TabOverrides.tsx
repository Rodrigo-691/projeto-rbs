import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PanelList } from "@/components/Panel";
import { NativeSelect } from "@/components/ui/native-select";
import { QUOTA_LABEL, TABS, quotaModulesQuery, tabOverridesQuery, isTabAllowed, type Sponsor } from "@/lib/portal";

type Choice = "default" | "allow" | "deny";

// Admin-only controls for per-sponsor tab exceptions; the DB enforces them via quota_allows.
export function TabOverrides({ sponsor }: { sponsor: Sponsor }) {
  const qc = useQueryClient();
  const mods = useQuery(quotaModulesQuery);
  const overrides = useQuery(tabOverridesQuery(sponsor.id));
  const save = useMutation({
    mutationFn: async ({ tab, choice }: { tab: string; choice: Choice }) => {
      const res =
        choice === "default"
          ? await supabase.from("sponsor_tab_overrides").delete().eq("sponsor_id", sponsor.id).eq("tab_key", tab)
          : await supabase.from("sponsor_tab_overrides").upsert({ sponsor_id: sponsor.id, tab_key: tab, allowed: choice === "allow" });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Acesso atualizado");
      qc.invalidateQueries({ queryKey: ["tab_overrides", sponsor.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Panel flush title="Exceções de acesso às abas" description={`Por padrão vale a cota ${QUOTA_LABEL[sponsor.quota]}. Libere ou bloqueie abas só para esta marca.`}>
      <PanelList>
        {TABS.filter((t) => t.key !== "perfil").map((t) => {
          const o = overrides.data?.find((x) => x.tab_key === t.key);
          const value: Choice = o ? (o.allowed ? "allow" : "deny") : "default";
          const def = mods.data ? isTabAllowed(mods.data, sponsor.quota, t.key) : false;
          return (
            <li key={t.key} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
              <span className="truncate font-medium">{t.label}</span>
              <NativeSelect
                aria-label={`Acesso a ${t.label}`}
                className="w-56"
                value={value}
                disabled={save.isPending || overrides.isPending}
                onChange={(e) => save.mutate({ tab: t.key, choice: e.target.value as Choice })}
              >
                <option value="default">Padrão da cota ({def ? "liberada" : "bloqueada"})</option>
                <option value="allow">Liberada para esta marca</option>
                <option value="deny">Bloqueada para esta marca</option>
              </NativeSelect>
            </li>
          );
        })}
      </PanelList>
    </Panel>
  );
}

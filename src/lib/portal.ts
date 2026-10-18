import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Quota = Database["public"]["Enums"]["quota_level"];
export type Sponsor = Database["public"]["Tables"]["sponsors"]["Row"];

export const QUOTA_LABEL: Record<Quota, string> = {
  master: "Master",
  subcota_g: "Subcota G",
  subcota: "Subcota",
};

export const TABS = [
  { key: "perfil", label: "Perfil do cliente", to: "/patrocinador/$id" },
  { key: "aplicacoes", label: "Aplicações de marca", to: "/patrocinador/$id/aplicacoes" },
  { key: "midia", label: "Mídia e conteúdo", to: "/patrocinador/$id/midia" },
  { key: "cortesias", label: "Cortesias", to: "/patrocinador/$id/cortesias" },
  { key: "credenciamento", label: "Credenciamento", to: "/patrocinador/$id/credenciamento" },
  { key: "pesquisa", label: "Pesquisa da ativação", to: "/patrocinador/$id/pesquisa" },
  { key: "contrato", label: "Contrato", to: "/patrocinador/$id/contrato" },
] as const;

export const BUCKET = "sponsor-files";
export const MAX_FILE_MB = 25;
export const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = !!roles?.some((r) => r.role === "admin_rbs");
    return { id: user.id, email: user.email ?? "", isAdmin };
  },
});

export function useMe() {
  return useQuery(meQuery);
}

export const sponsorQuery = (id: string) =>
  queryOptions({
    queryKey: ["sponsor", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sponsors").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const quotaModulesQuery = queryOptions({
  queryKey: ["quota_modules"],
  queryFn: async () => {
    const { data, error } = await supabase.from("quota_modules").select("*");
    if (error) throw error;
    return data;
  },
});

export function useTabAccess(sponsor: Sponsor | null | undefined, tabKey: string) {
  const me = useMe();
  const mods = useQuery(quotaModulesQuery);
  if (me.data?.isAdmin) return true;
  if (!sponsor || !mods.data) return true;
  return mods.data.some((m) => m.quota === sponsor.quota && m.tab_key === tabKey);
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(d: string) {
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

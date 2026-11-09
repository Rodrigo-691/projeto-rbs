import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/Panel";
import { TabOverrides } from "@/components/TabOverrides";
import { Skeleton } from "@/components/ui/skeleton";
import { sponsorQuery, useMe, QUOTA_LABEL } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/acessos")({
  head: () =>
    portalHead(
      "Exceções de acesso",
      "Controle de liberação e bloqueio de abas fora do padrão da cota (exclusivo Admin RBS)."
    ),
  component: Acessos,
});

function Acessos() {
  const { id } = Route.useParams();
  const me = useMe();
  const sponsor = useQuery(sponsorQuery(id));
  const isAdmin = !!me.data?.isAdmin;

  if (me.isLoading || sponsor.isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Carregando">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Redireciona usuários que não são Admin RBS
  if (!isAdmin) {
    return <Navigate to="/patrocinador/$id" params={{ id }} replace />;
  }

  const s = sponsor.data;
  if (!s) return null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Exceções de acesso às abas"
        description={`Controle personalizado de permissões para ${s.name}. Defina quais abas devem ser liberadas ou bloqueadas independentemente da cota contratada (${QUOTA_LABEL[s.quota]}).`}
      />

      <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Esta aba é visível e gerenciável <strong>exclusivamente pela equipe Admin RBS</strong>. O patrocinador não tem visualização deste menu.
        </span>
      </div>

      <TabOverrides sponsor={s} />
    </div>
  );
}

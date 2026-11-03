import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, PanelList, PanelNote } from "@/components/Panel";
import { formatDate } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";
import { auditDescription } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/historico")({
  head: () => portalHead("Histórico de atualizações", "Registro das ações realizadas no perfil do patrocinador do Planeta Atlântida."),
  component: Historico,
});

function Historico() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["audit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_log").select("*").eq("sponsor_id", id).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <PageHeader
        title="Histórico de atualizações"
        description="Registro automático de todas as alterações, envios de materiais e uploads desta parceria."
      />
      <Panel flush>
        {q.isPending ? (
          <PanelNote>Carregando histórico...</PanelNote>
        ) : (q.data?.length ?? 0) === 0 ? (
          <PanelNote>Sem atualizações.</PanelNote>
        ) : (
          <PanelList className="border-t-0">
            {q.data?.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <p className="min-w-0">
                  <span className="font-semibold">{a.actor_email ?? "Sistema"}</span>{" "}
                  <span className="text-brand-ink">{auditDescription(a)}</span>
                </p>
                <span className="tabular text-muted-foreground shrink-0 text-xs">{formatDate(a.created_at)}</span>
              </li>
            ))}
          </PanelList>
        )}
      </Panel>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      <h2 className="text-2xl font-extrabold">Histórico de atualizações</h2>
      <div className="bg-card rounded-2xl border">
        <ul className="divide-y">
          {q.data?.length === 0 && <li className="text-muted-foreground px-5 py-3 text-sm">Sem atualizações.</li>}
          {q.data?.map((a) => (
            <li key={a.id} className="px-5 py-3 text-sm">
              <span className="font-semibold">{a.actor_email ?? "Sistema"}</span>{" "}
              <span className="text-primary">{auditDescription(a)}</span>
              <span className="text-muted-foreground block text-xs">{formatDate(a.created_at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

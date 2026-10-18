import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/historico")({
  component: Historico,
});

const TABLE: Record<string, string> = {
  sponsors: "Perfil",
  sponsor_members: "Acesso",
  sponsor_files: "Arquivo",
  media_items: "Mídia",
  survey_questions: "Perguntas da pesquisa",
  survey_results: "Resultado da pesquisa",
};
const ACTION: Record<string, string> = { insert: "adicionou", update: "atualizou", delete: "removeu" };

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
              <span className="font-semibold">{a.actor_email ?? "Sistema"}</span> {ACTION[a.action] ?? a.action}{" "}
              <span className="text-primary">{TABLE[a.table_name] ?? a.table_name}</span>
              {a.summary ? `: ${a.summary}` : ""}
              <span className="text-muted-foreground block text-xs">{formatDate(a.created_at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

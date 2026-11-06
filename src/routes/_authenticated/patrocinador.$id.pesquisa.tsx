import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileSection } from "@/components/FileSection";
import { Panel, PanelNote } from "@/components/Panel";
import { TabGate } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMe } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/pesquisa")({
  head: () => portalHead("Pesquisa da ativação", "Perguntas e resultados da pesquisa de ativação do patrocinador no Planeta Atlântida."),
  component: Pesquisa,
});

function Pesquisa() {
  const { id } = Route.useParams();
  const me = useMe();
  const isAdmin = !!me.data?.isAdmin;
  return (
    <TabGate id={id} tab="pesquisa" title="Pesquisa da ativação" intro="Sua marca tem direito a 3 perguntas personalizadas na pesquisa oficial do festival.">
      <Questions id={id} isAdmin={isAdmin} />
      <Results id={id} isAdmin={isAdmin} />
      <FileSection sponsorId={id} tab="pesquisa" category="resultado_pesquisa" title="Arquivo de resultados" description="Relatório completo enviado pela empresa de pesquisa." uploader="admin" />
    </TabGate>
  );
}

function Questions({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["survey_q", id],
    queryFn: async () => (await supabase.from("survey_questions").select("*").eq("sponsor_id", id).maybeSingle()).data,
  });
  const [v, setV] = useState({ q1: "", q2: "", q3: "", locked: false });
  useEffect(() => {
    if (q.data) setV({ q1: q.data.q1 ?? "", q2: q.data.q2 ?? "", q3: q.data.q3 ?? "", locked: q.data.locked });
  }, [q.data]);
  const save = useMutation({
    mutationFn: async () => {
      const payload = { sponsor_id: id, q1: v.q1, q2: v.q2, q3: v.q3, updated_at: new Date().toISOString(), ...(isAdmin ? { locked: v.locked } : {}) };
      const { error } = await supabase.from("survey_questions").upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perguntas salvas");
      qc.invalidateQueries({ queryKey: ["survey_q", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const locked = !!q.data?.locked && !isAdmin;
  return (
    <Panel
      title="Suas 3 perguntas"
      description={locked ? "Perguntas enviadas. Para alterar, fale com a equipe RBS." : isAdmin ? "A RBS pode editar e desbloquear as perguntas." : "Atenção: depois de salvar, as perguntas ficam bloqueadas para edição."}
    >
      <div className="space-y-3">
        {(["q1", "q2", "q3"] as const).map((k, i) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={`survey-${k}`}>Pergunta {i + 1}</Label>
            <Input
              id={`survey-${k}`}
              disabled={locked}
              value={v[k]}
              onChange={(e) => setV({ ...v, [k]: e.target.value })}
              placeholder={`Digite a pergunta ${i + 1} para o público do festival`}
            />
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {isAdmin ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Switch checked={v.locked} onCheckedChange={(c) => setV({ ...v, locked: c })} /> Bloquear edição pelo cliente
            </label>
          ) : (
            <span />
          )}
          {!locked && (
            <Button
              onClick={() => {
                if (!isAdmin && !window.confirm("Depois de salvar, as perguntas não poderão mais ser editadas. Deseja enviar?")) return;
                save.mutate();
              }}
              disabled={save.isPending}
            >
              {save.isPending ? "Salvando..." : "Salvar perguntas"}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Results({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const r = useQuery({
    queryKey: ["survey_r", id],
    queryFn: async () => (await supabase.from("survey_results").select("*").eq("sponsor_id", id).order("question")).data ?? [],
  });
  async function remove(rid: string) {
    await supabase.from("survey_results").delete().eq("id", rid);
    qc.invalidateQueries({ queryKey: ["survey_r", id] });
  }
  const groups = (r.data ?? []).reduce<Record<string, typeof r.data>>((acc, x) => {
    (acc[x.question] ??= []).push(x);
    return acc;
  }, {});
  return (
    <Panel flush title="Resultados" description="Distribuição percentual das respostas coletadas durante o festival.">
      {Object.keys(groups).length === 0 ? (
        <PanelNote className="border-t">Os resultados aparecem aqui logo após o evento.</PanelNote>
      ) : (
        <div className="divide-y border-t">
          {Object.entries(groups).map(([question, rows]) => (
            <div key={question} className="space-y-2.5 px-5 py-4">
              <p className="text-sm font-semibold">{question}</p>
              <div className="space-y-2">
                {rows!.map((x) => (
                  <div key={x.id} className="flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 truncate font-medium" title={x.answer}>
                      {x.answer}
                    </span>
                    <div className="bg-secondary h-2.5 flex-1 overflow-hidden rounded-full">
                      <div className="bg-brand h-full rounded-full" style={{ width: `${Math.min(100, Number(x.percent))}%` }} />
                    </div>
                    <span className="tabular w-12 text-right text-xs font-semibold">{Number(x.percent)}%</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => remove(x.id)}
                        aria-label="Excluir"
                        className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

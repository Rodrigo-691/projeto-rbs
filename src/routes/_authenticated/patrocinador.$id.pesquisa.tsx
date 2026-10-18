import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileSection } from "@/components/FileSection";
import { TabGate } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMe } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/pesquisa")({
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
    <div className="bg-card space-y-3 rounded-2xl border p-5">
      <h3 className="font-bold">Suas 3 perguntas</h3>
      {(["q1", "q2", "q3"] as const).map((k, i) => (
        <div key={k} className="space-y-1">
          <Label>Pergunta {i + 1}</Label>
          <Input disabled={locked} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isAdmin ? (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={v.locked} onCheckedChange={(c) => setV({ ...v, locked: c })} /> Bloquear edição pelo cliente
          </label>
        ) : (
          <span className="text-muted-foreground text-sm">{locked ? "Perguntas fechadas pela RBS." : "Você pode editar até a RBS fechar o prazo."}</span>
        )}
        {!locked && <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar perguntas</Button>}
      </div>
    </div>
  );
}

function Results({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const r = useQuery({
    queryKey: ["survey_r", id],
    queryFn: async () => (await supabase.from("survey_results").select("*").eq("sponsor_id", id).order("question")).data ?? [],
  });
  const [f, setF] = useState({ question: "", answer: "", percent: "" });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("survey_results").insert({ sponsor_id: id, question: f.question, answer: f.answer, percent: Number(f.percent) });
      if (error) throw error;
    },
    onSuccess: () => {
      setF({ ...f, answer: "", percent: "" });
      qc.invalidateQueries({ queryKey: ["survey_r", id] });
    },
    onError: (e: Error) => toast.error(e.message),
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
    <div className="bg-card space-y-3 rounded-2xl border p-5">
      <h3 className="font-bold">Resultados</h3>
      {Object.keys(groups).length === 0 && <p className="text-muted-foreground text-sm">Os resultados aparecem aqui logo após o evento.</p>}
      {Object.entries(groups).map(([question, rows]) => (
        <div key={question}>
          <p className="text-sm font-semibold">{question}</p>
          {rows!.map((x) => (
            <div key={x.id} className="mt-1 flex items-center gap-2 text-sm">
              <span className="w-20 shrink-0">{x.answer}</span>
              <div className="bg-muted h-3 flex-1 overflow-hidden rounded-full">
                <div className="bg-sunset h-full" style={{ width: `${Math.min(100, Number(x.percent))}%` }} />
              </div>
              <span className="w-10 text-right">{Number(x.percent)}%</span>
              {isAdmin && <button onClick={() => remove(x.id)} aria-label="Excluir"><Trash2 className="h-3 w-3" /></button>}
            </div>
          ))}
        </div>
      ))}
      {isAdmin && (
        <form className="grid gap-2 border-t pt-3 sm:grid-cols-[2fr_1fr_90px_auto]" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <Input required placeholder="Pergunta" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />
          <Input required placeholder="Resposta" value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} />
          <Input required type="number" min={0} max={100} placeholder="%" value={f.percent} onChange={(e) => setF({ ...f, percent: e.target.value })} />
          <Button type="submit">Adicionar</Button>
        </form>
      )}
    </div>
  );
}

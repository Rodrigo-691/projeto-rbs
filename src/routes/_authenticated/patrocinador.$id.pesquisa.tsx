import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileSection } from "@/components/FileSection";
import { Panel, PanelNote } from "@/components/Panel";
import { TabGate } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMe } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";
import {
  parseSurveySheet,
  isGenderQuestion,
  isAgeQuestion,
  type SurveyItem,
} from "@/lib/survey-sheet";

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
      {isAdmin && <SurveyImportAndTemplate id={id} />}
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
    qc.invalidateQueries({ queryKey: ["report", id] });
  }

  async function removeAll() {
    if (!window.confirm("Deseja realmente excluir todos os resultados desta pesquisa?")) return;
    await supabase.from("survey_results").delete().eq("sponsor_id", id);
    qc.invalidateQueries({ queryKey: ["survey_r", id] });
    qc.invalidateQueries({ queryKey: ["report", id] });
    toast.success("Todos os resultados foram removidos.");
  }

  const allItems = r.data ?? [];
  const brandGroups = allItems.reduce<Record<string, typeof r.data>>((acc, x) => {
    if (!isGenderQuestion(x.question) && !isAgeQuestion(x.question)) {
      (acc[x.question] ??= []).push(x);
    }
    return acc;
  }, {});

  const demographicGroups = allItems.reduce<Record<string, typeof r.data>>((acc, x) => {
    if (isGenderQuestion(x.question) || isAgeQuestion(x.question)) {
      (acc[x.question] ??= []).push(x);
    }
    return acc;
  }, {});

  const hasAnyResults = allItems.length > 0;

  return (
    <Panel
      flush
      title="Resultados da pesquisa"
      description="Distribuição percentual das respostas coletadas no festival, incluindo dados demográficos."
      actions={
        isAdmin && hasAnyResults && (
          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 text-xs gap-1.5" onClick={removeAll}>
            <Trash2 className="h-3.5 w-3.5" /> Limpar todos os resultados
          </Button>
        )
      }
    >
      {!hasAnyResults ? (
        <PanelNote className="border-t">Os resultados aparecem aqui logo após o evento e o envio da planilha pela equipe.</PanelNote>
      ) : (
        <div className="divide-y border-t">
          {/* Perguntas da Ativação da Marca */}
          {Object.keys(brandGroups).length > 0 && (
            <div className="space-y-4 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
                  Perguntas da Ativação
                </span>
                <span className="text-xs text-muted-foreground">({Object.keys(brandGroups).length} perguntas)</span>
              </div>

              <div className="space-y-5">
                {Object.entries(brandGroups).map(([question, rows]) => (
                  <div key={question} className="rounded-lg border bg-muted/20 p-3.5 space-y-2.5">
                    <p className="text-sm font-semibold text-foreground">{question}</p>
                    <div className="space-y-2">
                      {rows!.map((x) => (
                        <div key={x.id} className="flex items-center gap-3 text-sm">
                          <span className="w-36 shrink-0 truncate font-medium text-xs" title={x.answer}>
                            {x.answer}
                          </span>
                          <div className="bg-secondary h-2.5 flex-1 overflow-hidden rounded-full">
                            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(100, Number(x.percent))}%` }} />
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
            </div>
          )}

          {/* Dados Demográficos (Gênero e Faixa Etária) */}
          {Object.keys(demographicGroups).length > 0 && (
            <div className="space-y-4 px-5 py-4 bg-muted/10">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="bg-secondary text-secondary-foreground rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
                  Perfil dos Respondentes (Gênero e Faixa Etária)
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(demographicGroups).map(([question, rows]) => (
                  <div key={question} className="rounded-lg border bg-card p-3.5 space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{question}</p>
                    <div className="space-y-2">
                      {rows!.map((x) => (
                        <div key={x.id} className="flex items-center gap-3 text-sm">
                          <span className="w-32 shrink-0 truncate font-medium text-xs" title={x.answer}>
                            {x.answer}
                          </span>
                          <div className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
                            <div className="bg-brand h-full rounded-full transition-all" style={{ width: `${Math.min(100, Number(x.percent))}%` }} />
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
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

// Upload and template manager for the activation survey spreadsheet
function SurveyImportAndTemplate({ id }: { id: string }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{
    items: SurveyItem[];
    brandQuestions: Record<string, { answer: string; percent: number }[]>;
    demographics: Record<string, { answer: string; percent: number }[]>;
    errors: string[];
  } | null>(null);

  async function downloadTemplate() {
    try {
      const { data } = await supabase.from("survey_questions").select("q1,q2,q3").eq("sponsor_id", id).maybeSingle();
      const qs = [data?.q1, data?.q2, data?.q3].map((q, i) => q?.trim() || `Pergunta ${i + 1} da marca`);
      const { default: writeXlsxFile } = await import("write-excel-file/browser");

      const head = [
        { value: "Pergunta / Indicador", fontWeight: "bold" as const },
        { value: "Resposta / Opção", fontWeight: "bold" as const },
        { value: "Percentual (%)", fontWeight: "bold" as const },
      ];

      // 3 variações de respostas para cada uma das 3 perguntas da marca
      const questionRows = qs.flatMap((q) => [
        [{ value: q }, { value: "Resposta 1 / Opção A" }, { value: 50, type: Number }],
        [{ value: q }, { value: "Resposta 2 / Opção B" }, { value: 30, type: Number }],
        [{ value: q }, { value: "Resposta 3 / Opção C" }, { value: 20, type: Number }],
      ]);

      // Dados demográficos: Gênero (3 variações)
      const genderRows = [
        [{ value: "Gênero dos entrevistados" }, { value: "Feminino" }, { value: 52, type: Number }],
        [{ value: "Gênero dos entrevistados" }, { value: "Masculino" }, { value: 45, type: Number }],
        [{ value: "Gênero dos entrevistados" }, { value: "Outro / Prefere não informar" }, { value: 3, type: Number }],
      ];

      // Dados demográficos: Faixa Etária em anos (3 variações)
      const ageRows = [
        [{ value: "Faixa etária em anos" }, { value: "18 a 24 anos" }, { value: 48, type: Number }],
        [{ value: "Faixa etária em anos" }, { value: "25 a 34 anos" }, { value: 36, type: Number }],
        [{ value: "Faixa etária em anos" }, { value: "35 anos ou mais" }, { value: 16, type: Number }],
      ];

      await writeXlsxFile([head, ...questionRows, ...genderRows, ...ageRows], {
        columns: [{ width: 48 }, { width: 34 }, { width: 18 }],
      }).toFile("modelo-pesquisa-ativacao.xlsx");

      toast.success("Modelo da pesquisa baixado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar modelo:", err);
      toast.error("Não foi possível gerar o modelo da planilha.");
    }
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith(".xlsx")) {
      toast.error("Envie um arquivo no formato Excel (.xlsx).");
      return;
    }

    setFile(selected);
    setReading(true);
    setPreview(null);

    try {
      const { readSheet } = await import("read-excel-file/browser");
      const rows = (await readSheet(selected)) as unknown[][];
      const parsed = parseSurveySheet(rows);

      if (parsed.errors.length > 0 && parsed.items.length === 0) {
        toast.error(parsed.errors[0] || "Erro ao ler a planilha.");
        setReading(false);
        return;
      }

      const brandQuestions: Record<string, { answer: string; percent: number }[]> = {};
      const demographics: Record<string, { answer: string; percent: number }[]> = {};

      for (const item of parsed.items) {
        if (isGenderQuestion(item.question) || isAgeQuestion(item.question)) {
          (demographics[item.question] ??= []).push({ answer: item.answer, percent: item.percent });
        } else {
          (brandQuestions[item.question] ??= []).push({ answer: item.answer, percent: item.percent });
        }
      }

      setPreview({
        items: parsed.items,
        brandQuestions,
        demographics,
        errors: parsed.errors,
      });

      if (parsed.errors.length > 0) {
        toast.warning(`${parsed.errors.length} linha(s) com dados incompletos foram ignoradas.`);
      }
    } catch (err) {
      console.error("Erro ao processar planilha:", err);
      toast.error("Não foi possível ler o arquivo enviado.");
    } finally {
      setReading(false);
    }
  }

  async function handleConfirmSave() {
    if (!preview || preview.items.length === 0) return;
    setSaving(true);
    try {
      // Remove resultados anteriores da pesquisa deste patrocinador
      await supabase.from("survey_results").delete().eq("sponsor_id", id);

      // Insere os novos resultados
      const toInsert = preview.items.map((i) => ({
        sponsor_id: id,
        question: i.question,
        answer: i.answer,
        percent: i.percent,
      }));

      const { error } = await supabase.from("survey_results").insert(toInsert);
      if (error) throw error;

      toast.success(`${toInsert.length} resultados da pesquisa e perfil do público salvos com sucesso!`);
      qc.invalidateQueries({ queryKey: ["survey_r", id] });
      qc.invalidateQueries({ queryKey: ["report", id] });
      setModalOpen(false);
      setPreview(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Erro ao salvar resultados da pesquisa:", err);
      toast.error(err.message || "Erro ao salvar resultados da pesquisa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title="Gerenciar planilha de pesquisa"
      description="Baixe o modelo com as 3 perguntas da marca, 3 variações de respostas e dados demográficos (gênero e faixa etária), ou envie a planilha preenchida."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" /> Baixar modelo (.xlsx)
        </Button>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Importar planilha de resultados
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="text-primary h-5 w-5" /> Importar resultados da pesquisa
              </DialogTitle>
              <DialogDescription>
                Faça upload do arquivo <strong>.xlsx</strong> contendo as perguntas da marca (com 3 variações de respostas), além dos dados de gênero e faixa etária em anos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {!preview && (
                <div className="rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/10">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    id="survey-upload-input"
                    onChange={onFileSelected}
                  />
                  <label htmlFor="survey-upload-input" className="flex cursor-pointer flex-col items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      {reading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                    </div>
                    <span className="text-sm font-semibold">
                      {reading ? "Processando planilha..." : "Clique para selecionar a planilha (.xlsx)"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Contendo colunas: Pergunta, Resposta e Percentual (%)
                    </span>
                  </label>
                </div>
              )}

              {preview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3.5 py-2.5 text-xs">
                    <span className="font-semibold">{file?.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setPreview(null);
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Trocar arquivo
                    </Button>
                  </div>

                  {/* Resumo do que foi identificado */}
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-lg border bg-card p-3">
                      <p className="font-semibold text-foreground">Perguntas da marca identificadas:</p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {Object.keys(preview.brandQuestions).length}
                      </p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        {Object.values(preview.brandQuestions).reduce((acc, r) => acc + r.length, 0)} variações de respostas extraídas
                      </p>
                    </div>

                    <div className="rounded-lg border bg-card p-3">
                      <p className="font-semibold text-foreground">Dados demográficos da pessoa:</p>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Gênero: <strong>{Object.keys(preview.demographics).some(isGenderQuestion) ? "Identificado" : "Não informado"}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Faixa etária: <strong>{Object.keys(preview.demographics).some(isAgeQuestion) ? "Identificada" : "Não informada"}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pré-visualização detalhada */}
                  <div className="max-h-60 overflow-y-auto rounded-lg border bg-card divide-y text-xs">
                    {Object.entries(preview.brandQuestions).map(([q, rows]) => (
                      <div key={q} className="p-3 space-y-1.5">
                        <p className="font-semibold text-foreground">{q}</p>
                        <div className="grid gap-1 pl-2 border-l-2 border-primary/30">
                          {rows.map((r, idx) => (
                            <div key={idx} className="flex justify-between text-muted-foreground">
                              <span>• {r.answer}</span>
                              <span className="font-semibold text-foreground">{r.percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {Object.entries(preview.demographics).map(([q, rows]) => (
                      <div key={q} className="p-3 space-y-1.5 bg-muted/20">
                        <p className="font-semibold text-foreground">{q}</p>
                        <div className="grid gap-1 pl-2 border-l-2 border-brand/50">
                          {rows.map((r, idx) => (
                            <div key={idx} className="flex justify-between text-muted-foreground">
                              <span>• {r.answer}</span>
                              <span className="font-semibold text-foreground">{r.percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {preview.errors.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        <span>Inconsistências encontradas ({preview.errors.length}):</span>
                      </div>
                      <ul className="mt-1 list-disc pl-4 space-y-0.5 text-muted-foreground">
                        {preview.errors.slice(0, 3).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              {preview && (
                <Button type="button" disabled={saving || preview.items.length === 0} onClick={handleConfirmSave} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Confirmar e salvar {preview.items.length} respostas
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Panel>
  );
}

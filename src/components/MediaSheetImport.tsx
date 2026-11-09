import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PanelList, PanelNote } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { parseMediaSheet, FIXED_HEADERS, type ParsedRow, type RowError } from "@/lib/media-sheet";

type SponsorRef = { id: string; name: string; cnpj?: string | null };

interface PreviewData {
  ok: ParsedRow[];
  errors: RowError[];
  duplicateBrands: string[];
  file: string;
  fileObj?: File;
}

// Admin-only import of the standardized RBS spreadsheet; each row becomes a publication in that sponsor's report.
export function MediaSheetImport({ sponsors, sponsorLabel }: { sponsors: SponsorRef[]; sponsorLabel?: string }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);

  async function downloadTemplate() {
    const { default: writeXlsxFile } = await import("write-excel-file/browser");
    const headers = [
      { value: "Data", fontWeight: "bold" as const },
      { value: "Veículo", fontWeight: "bold" as const },
      { value: "Pepsi", fontWeight: "bold" as const },
      { value: "Areia Logistica", fontWeight: "bold" as const },
      { value: "Heineken", fontWeight: "bold" as const },
    ];

    const rows = [
      headers,
      [
        { value: new Date(Date.UTC(2026, 9, 1, 12)), type: Date, format: "yyyy-mm-dd" },
        { value: "Digital" },
        { value: 100000, type: Number },
        { value: 0, type: Number },
        { value: 110000, type: Number },
      ],
      [
        { value: new Date(Date.UTC(2026, 9, 13, 12)), type: Date, format: "yyyy-mm-dd" },
        { value: "Rádio" },
        { value: 10000, type: Number },
        { value: 30000, type: Number },
        { value: 20000, type: Number },
      ],
      [
        { value: new Date(Date.UTC(2026, 10, 5, 12)), type: Date, format: "yyyy-mm-dd" },
        { value: "TV" },
        { value: 300000, type: Number },
        { value: 120000, type: Number },
        { value: 400000, type: Number },
      ],
      [
        { value: new Date(Date.UTC(2026, 9, 24, 12)), type: Date, format: "yyyy-mm-dd" },
        { value: "Jornal" },
        { value: 130000, type: Number },
        { value: 0, type: Number },
        { value: 0, type: Number },
      ],
    ];

    await writeXlsxFile(rows, {
      columns: [
        { width: 14 },
        { width: 14 },
        { width: 16 },
        { width: 18 },
        { width: 16 },
      ],
    }).toFile("modelo-midia-planeta-atlantida.xlsx");
  }

  function downloadCsvTemplate() {
    const csvContent =
      "Data,Veículo,Pepsi,Areia Logistica,Heineken\n" +
      "2026-10-01,Digital,100000,0,110000\n" +
      "2026-10-13,Rádio,10000,30000,20000\n" +
      "2026-11-05,TV,300000,120000,400000\n" +
      "2026-10-24,Jornal,130000,0,0\n";

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo-midia-planeta-atlantida.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function onFile(file: File) {
    setReading(true);
    try {
      let rows: unknown[][] = [];
      if (file.name.endsWith(".csv") || file.type === "text/csv") {
        const text = await file.text();
        rows = text
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .map((line) => line.split(",").map((c) => c.trim().replace(/^["'](.*)["']$/, "$1")));
      } else {
        const { readSheet } = await import("read-excel-file/browser");
        rows = (await readSheet(file)) as unknown[][];
      }
      const parsed = parseMediaSheet(rows, sponsors);

      // Verificação contra veiculações já cadastradas no banco de dados
      const sponsorIds = Array.from(new Set(parsed.ok.map((r) => r.sponsorId)));
      let existingDbMedia: { sponsor_id: string; channel: string | null; created_at: string; reach: number | null }[] = [];

      if (sponsorIds.length > 0) {
        try {
          const { data } = await supabase
            .from("media_items")
            .select("sponsor_id, channel, created_at, reach")
            .in("sponsor_id", sponsorIds);
          if (data) existingDbMedia = data;
        } catch (dbErr) {
          console.warn("Não foi possível carregar mídias anteriores para comparação:", dbErr);
        }
      }

      // Marcar duplicatas encontradas contra o banco
      const enrichedOk = parsed.ok.map((item) => {
        if (item.isDuplicate) return item;

        const itemDateStr = item.date.toISOString().slice(0, 10);
        const match = existingDbMedia.find((db) => {
          if (db.sponsor_id !== item.sponsorId) return false;
          const dbChannel = (db.channel || "").toLowerCase().trim();
          const itemVehicle = (item.vehicle || "").toLowerCase().trim();
          if (dbChannel !== itemVehicle) return false;
          const dbDateStr = db.created_at ? new Date(db.created_at).toISOString().slice(0, 10) : "";
          return dbDateStr === itemDateStr;
        });

        if (match) {
          return {
            ...item,
            isDuplicate: true,
            duplicateReason: "Veiculação já cadastrada anteriormente no portal",
          };
        }
        return item;
      });

      // Inicializa checkboxes: marca automaticamente APENAS as veiculações NÃO duplicadas
      const nonDuplicateIds = new Set(enrichedOk.filter((r) => !r.isDuplicate).map((r) => r.id));
      setSelectedIds(nonDuplicateIds);

      setPreview({
        ok: enrichedOk,
        errors: parsed.errors,
        duplicateBrands: parsed.duplicateBrands,
        file: file.name,
        fileObj: file,
      });

      const duplicateCount = enrichedOk.filter((r) => r.isDuplicate).length;
      if (duplicateCount > 0) {
        toast.warning(
          `${duplicateCount} veiculação(ões) duplicada(s) detectada(s). Os checkboxes foram desmarcados automaticamente.`
        );
      }
    } catch {
      toast.error("Não foi possível ler a planilha. Envie um arquivo .xlsx ou .csv.");
    } finally {
      setReading(false);
    }
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (!preview) return;
    if (selectedIds.size === preview.ok.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(preview.ok.map((r) => r.id)));
    }
  }

  function selectOnlyNew() {
    if (!preview) return;
    setSelectedIds(new Set(preview.ok.filter((r) => !r.isDuplicate).map((r) => r.id)));
  }

  async function confirm() {
    if (!preview) return;

    const itemsToInsert = preview.ok.filter((r) => selectedIds.has(r.id));

    if (itemsToInsert.length === 0) {
      toast.error("Nenhuma veiculação marcada com checkbox para importação.");
      return;
    }

    setBusy(true);
    const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });

    const { error } = await supabase.from("media_items").insert(
      itemsToInsert.map((r) => ({
        sponsor_id: r.sponsorId,
        kind: "report",
        channel: r.vehicle,
        title: `Veiculação ${r.vehicle} · ${fmt(r.date)}`,
        body: `Importado da planilha ${preview.file}`,
        reach: r.reach,
        created_at: r.date.toISOString(),
      })),
    );

    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    // Registrar histórico da importação
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("media_imports").insert({
      file_name: preview.file,
      rows_ok: itemsToInsert.length,
      rows_error: preview.errors.length,
      errors: preview.errors,
    });

    setBusy(false);
    toast.success(`${itemsToInsert.length} veiculações importadas com sucesso!`);
    setPreview(null);
    setSelectedIds(new Set());
    qc.invalidateQueries();
  }

  const duplicatesInPreview = preview?.ok.filter((r) => r.isDuplicate) ?? [];
  const isAllSelected = preview && preview.ok.length > 0 && selectedIds.size === preview.ok.length;
  const isSomeSelected = selectedIds.size > 0 && preview && selectedIds.size < preview.ok.length;

  return (
    <Panel
      flush
      title="Importar planilha de mídia"
      description="Colunas: Data, Veículo e uma coluna por patrocinador com o alcance. Células vazias ou 0 são ignoradas."
    >
      <div className="flex flex-wrap gap-2 border-t px-5 py-4">
        <Button type="button" variant="outline" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" /> Baixar modelo (.xlsx)
        </Button>
        <Button type="button" variant="outline" onClick={downloadCsvTemplate} className="gap-2">
          <Download className="h-4 w-4" /> Baixar modelo (.csv)
        </Button>
        <Button type="button" disabled={reading} onClick={() => input.current?.click()} className="gap-2">
          {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {reading ? "Lendo planilha..." : "Enviar planilha"}
        </Button>
        <input
          ref={input}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          aria-label="Planilha de mídia"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {preview && (
        <>
          <PanelNote className="border-t">
            <FileSpreadsheet className="mr-1 inline h-4 w-4" aria-hidden />
            <strong>{preview.file}</strong>: {preview.ok.length} veiculações encontradas, {preview.errors.length} com erro.
          </PanelNote>

          {/* Alerta de Marcas Duplicadas nas Colunas */}
          {preview.duplicateBrands && preview.duplicateBrands.length > 0 && (
            <div className="mx-5 my-2 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Atenção: Marcas duplicadas no cabeçalho:</strong> A(s) marca(s){" "}
                <strong>{preview.duplicateBrands.join(", ")}</strong> aparece(m) em mais de uma coluna na planilha. As
                colunas repetidas foram unificadas para prevenir duplicações.
              </span>
            </div>
          )}

          {/* Alerta de Veiculações Duplicadas com Checkboxes desmarcados */}
          {duplicatesInPreview.length > 0 && (
            <div className="mx-5 my-2 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>{duplicatesInPreview.length} veiculação(ões) duplicada(s) identificada(s):</strong> Os
                  checkboxes dessas linhas foram <strong>desmarcados automaticamente</strong> para evitar duplicidade no
                  relatório.
                </span>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={selectOnlyNew} className="text-xs h-7">
                Manter apenas novas
              </Button>
            </div>
          )}

          {/* Erros estruturais ou linhas inválidas */}
          {preview.errors.length > 0 && (
            <PanelList>
              {preview.errors.map((e, i) => (
                <li key={i} className="text-destructive px-5 py-2 text-xs">
                  Linha {e.line}: {e.message}
                </li>
              ))}
            </PanelList>
          )}

          {/* Tabela de Pré-visualização com Checkboxes */}
          {preview.ok.length > 0 && (
            <div className="border-t">
              {/* Barra de controle de seleção */}
              <div className="flex items-center justify-between bg-muted/40 px-5 py-2.5 text-xs text-muted-foreground border-b">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Selecionar todas as veiculações"
                  />
                  <span className="font-medium text-foreground">
                    {selectedIds.size} de {preview.ok.length} veiculação(ões) selecionada(s)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {duplicatesInPreview.length > 0 && (
                    <button
                      type="button"
                      onClick={selectOnlyNew}
                      className="text-primary hover:underline font-medium"
                    >
                      Apenas novas ({preview.ok.length - duplicatesInPreview.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-primary hover:underline font-medium"
                  >
                    {selectedIds.size === preview.ok.length ? "Desmarcar todas" : "Selecionar todas"}
                  </button>
                </div>
              </div>

              {/* Lista de veiculações */}
              <div className="max-h-72 overflow-y-auto divide-y">
                {preview.ok.map((r) => {
                  const isChecked = selectedIds.has(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleItem(r.id)}
                      className={`flex items-center gap-3 px-5 py-2 text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-background hover:bg-muted/30"
                          : "opacity-60 bg-muted/10 hover:bg-muted/20"
                      }`}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleItem(r.id)}
                          aria-label={`Incluir veiculação de ${r.sponsorName}`}
                        />
                      </div>

                      <span className="font-mono text-muted-foreground w-12">#{r.line}</span>
                      <span className={`w-44 truncate font-medium ${isChecked ? "text-foreground" : "line-through text-muted-foreground"}`}>
                        {r.sponsorName}
                      </span>
                      <span className="w-24 text-muted-foreground">
                        {r.date.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                      </span>
                      <span className="w-20 font-medium">{r.vehicle}</span>
                      <span className="w-28 tabular-nums font-mono text-right text-foreground">
                        {r.reach.toLocaleString("pt-BR")} alc.
                      </span>

                      {/* Tag de Duplicada */}
                      {r.isDuplicate && (
                        <span
                          title={r.duplicateReason}
                          className="ml-auto inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {r.duplicateReason || "Duplicada"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rodapé com Ação */}
          <div className="flex items-center justify-between gap-2 border-t px-5 py-3 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size > 0
                ? `${selectedIds.size} veiculação(ões) pronta(s) para importação`
                : "Selecione ao menos uma veiculação para importar"}
            </span>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy || selectedIds.size === 0}
                onClick={confirm}
                className="gap-2"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Importar {selectedIds.size} veiculações
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      <ImportHistory />
    </Panel>
  );
}

type ImportRow = {
  id: string;
  file_name: string;
  imported_by_email: string | null;
  rows_ok: number;
  rows_error: number;
  created_at: string;
};

function ImportHistory() {
  const query = useQuery({
    queryKey: ["media_imports"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("media_imports")
        .select("id, file_name, imported_by_email, rows_ok, rows_error, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) return [] as ImportRow[];
      return (data ?? []) as ImportRow[];
    },
  });

  const rows = query.data ?? [];
  if (!rows.length) return null;

  return (
    <div className="border-t">
      <PanelNote>Últimas importações</PanelNote>
      <PanelList>
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2 text-xs">
            <span className="truncate font-medium">{r.file_name}</span>
            <span className="text-muted-foreground">
              {new Date(r.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
              <strong className="text-foreground">{r.rows_ok}</strong> importadas
              {r.rows_error > 0 && <span className="text-destructive font-medium"> ({r.rows_error} com erro)</span>}
            </span>
          </li>
        ))}
      </PanelList>
    </div>
  );
}

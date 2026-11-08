import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PanelList, PanelNote } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { parseMediaSheet, FIXED_HEADERS, type ParsedRow, type RowError } from "@/lib/media-sheet";
import { importMediaSpreadsheet } from "@/lib/backend-api";

type SponsorRef = { id: string; name: string; cnpj?: string | null };

// Admin-only import of the standardized RBS spreadsheet; each row becomes a publication in that sponsor's report.
export function MediaSheetImport({ sponsors, sponsorLabel }: { sponsors: SponsorRef[]; sponsorLabel?: string }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ ok: ParsedRow[]; errors: RowError[]; file: string; fileObj?: File } | null>(null);
  const [busy, setBusy] = useState(false);

  async function downloadTemplate() {
    const { default: writeXlsxFile } = await import("write-excel-file/browser");
    const names = sponsors.length ? sponsors.map((x) => x.name) : [sponsorLabel ?? "Nome do patrocinador"];
    await writeXlsxFile(
      [
        [...FIXED_HEADERS, ...names].map((h) => ({ value: h, fontWeight: "bold" as const })),
        [{ value: new Date(), type: Date, format: "dd/mm/yyyy" }, { value: "TV" }, ...names.map(() => ({ value: 0, type: Number }))],
      ],
      { columns: [{ width: 14 }, { width: 14 }, ...names.map(() => ({ width: 22 }))] },
    ).toFile("modelo-midia-planeta-atlantida.xlsx");
  }

  async function onFile(file: File) {
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const rows = await readSheet(file);
      setPreview({ ...parseMediaSheet(rows as unknown[][], sponsors), file: file.name, fileObj: file });
    } catch {
      toast.error("Não foi possível ler a planilha. Envie um arquivo .xlsx.");
    }
  }

  async function confirm() {
    if (!preview?.ok.length) return;
    setBusy(true);
    // Processamento robusto no Backend Java (Apache POI) com fallback automático
    if (preview.fileObj) {
      try {
        const javaResult = await importMediaSpreadsheet(preview.fileObj);
        if (javaResult.success && javaResult.rowsImported > 0) {
          setBusy(false);
          toast.success(`${javaResult.rowsImported} veiculações importadas com sucesso via Java (Apache POI)!`);
          if (javaResult.warnings?.length) {
            javaResult.warnings.forEach((w) => toast.warning(w));
          }
          setPreview(null);
          qc.invalidateQueries();
          return;
        }
      } catch (backendErr) {
        console.warn("Backend Java indisponível ou em fallback, prosseguindo com insert direto:", backendErr);
      }
    }

    const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    const { error } = await supabase.from("media_items").insert(
      preview.ok.map((r) => ({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("media_imports").insert({
      file_name: preview.file,
      rows_ok: preview.ok.length,
      rows_error: preview.errors.length,
      errors: preview.errors,
    });
    setBusy(false);
    toast.success(`${preview.ok.length} veiculações importadas`);
    setPreview(null);
    qc.invalidateQueries();
  }

  return (
    <Panel
      flush
      title="Importar planilha de mídia"
      description="Colunas: Data, Veículo e, ao lado, uma coluna por patrocinador com o alcance. Para incluir um patrocinador, adicione uma coluna com o nome dele. Veículo: TV, Rádio, Digital ou Jornal. Células vazias ou 0 são ignoradas."
    >
      <div className="flex flex-wrap gap-2 border-t px-5 py-4">
        <Button type="button" variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> Baixar modelo
        </Button>
        <Button type="button" onClick={() => input.current?.click()}>
          <Upload className="h-4 w-4" /> Enviar planilha
        </Button>
        <input
          ref={input}
          type="file"
          accept=".xlsx"
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
            {preview.file}: {preview.ok.length} linhas prontas, {preview.errors.length} com erro.
          </PanelNote>
          {preview.errors.length > 0 && (
            <PanelList>
              {preview.errors.map((e, i) => (
                <li key={i} className="text-destructive px-5 py-2 text-sm">
                  Linha {e.line}: {e.message}
                </li>
              ))}
            </PanelList>
          )}
          {preview.ok.length > 0 && (
            <PanelList>
              {preview.ok.slice(0, 50).map((r, i) => (
                <li key={i} className="grid grid-cols-4 gap-3 px-5 py-2 text-sm">
                  <span className="truncate font-medium">{r.sponsorName}</span>
                  <span>{r.date.toLocaleDateString("pt-BR", { timeZone: "UTC" })}</span>
                  <span>{r.vehicle}</span>
                  <span className="tabular text-right">{r.reach.toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </PanelList>
          )}
          <div className="flex justify-end gap-2 border-t px-5 py-3">
            <Button type="button" variant="ghost" onClick={() => setPreview(null)}>Cancelar</Button>
            <Button type="button" disabled={busy || !preview.ok.length} onClick={confirm}>
              Importar {preview.ok.length} linhas
            </Button>
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
  errors: RowError[];
  created_at: string;
};

function ImportHistory() {
  const q = useQuery({
    queryKey: ["media_imports"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("media_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as ImportRow[];
    },
  });
  return (
    <div className="border-t">
      <p className="px-5 pt-4 pb-2 text-sm font-semibold">Histórico de importações</p>
      {q.isPending ? (
        <PanelNote>Carregando...</PanelNote>
      ) : !q.data?.length ? (
        <PanelNote>Nenhuma importação feita ainda.</PanelNote>
      ) : (
        <PanelList>
          {q.data.map((r) => (
            <li key={r.id} className="px-5 py-2.5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {new Date(r.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
                  {r.imported_by_email ?? "—"}
                </span>
                <span className="tabular text-muted-foreground">
                  {r.rows_ok} posts importados · {r.rows_error} com erro
                </span>
              </div>
              <p className="text-muted-foreground truncate text-xs">{r.file_name}</p>
              {r.errors?.length > 0 && (
                <details className="mt-1 text-xs">
                  <summary className="text-destructive cursor-pointer">Ver erros</summary>
                  <ul className="mt-1 space-y-0.5">
                    {r.errors.map((e, i) => (
                      <li key={i} className="text-destructive">Linha {e.line}: {e.message}</li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </PanelList>
      )}
    </div>
  );
}

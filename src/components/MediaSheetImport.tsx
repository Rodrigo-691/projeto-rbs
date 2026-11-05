import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PanelList, PanelNote } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { parseMediaSheet, SHEET_HEADERS, type ParsedRow, type RowError } from "@/lib/media-sheet";

type SponsorRef = { id: string; name: string; cnpj?: string | null };

// Admin-only import of the standardized RBS spreadsheet; each row becomes a publication in that sponsor's report.
export function MediaSheetImport({ sponsors, sponsorLabel }: { sponsors: SponsorRef[]; sponsorLabel?: string }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ ok: ParsedRow[]; errors: RowError[]; file: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function downloadTemplate() {
    const { default: writeXlsxFile } = await import("write-excel-file/browser");
    const example = sponsorLabel ?? sponsors[0]?.name ?? "Nome do patrocinador";
    await writeXlsxFile(
      [
        SHEET_HEADERS.map((h) => ({ value: h, fontWeight: "bold" as const })),
        [{ value: example }, { value: new Date(), type: Date, format: "dd/mm/yyyy" }, { value: "TV" }, { value: 120000, type: Number }],
      ],
      { columns: [{ width: 32 }, { width: 14 }, { width: 14 }, { width: 14 }] },
    ).toFile("modelo-midia-planeta-atlantida.xlsx");
  }

  async function onFile(file: File) {
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const rows = await readSheet(file);
      setPreview({ ...parseMediaSheet(rows as unknown[][], sponsors), file: file.name });
    } catch {
      toast.error("Não foi possível ler a planilha. Envie um arquivo .xlsx.");
    }
  }

  async function confirm() {
    if (!preview?.ok.length) return;
    setBusy(true);
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
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${preview.ok.length} veiculações importadas`);
    setPreview(null);
    qc.invalidateQueries();
  }

  return (
    <Panel
      flush
      title="Importar planilha de mídia"
      description={`Colunas: ${SHEET_HEADERS.join(", ")}. Veículo: TV, Rádio, Digital ou Jornal. Os dados vão direto para o relatório de cada patrocinador.`}
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
              {preview.errors.map((e) => (
                <li key={e.line} className="text-destructive px-5 py-2 text-sm">
                  Linha {e.line}: {e.message}
                </li>
              ))}
            </PanelList>
          )}
          {preview.ok.length > 0 && (
            <PanelList>
              {preview.ok.slice(0, 50).map((r) => (
                <li key={r.line} className="grid grid-cols-4 gap-3 px-5 py-2 text-sm">
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
    </Panel>
  );
}

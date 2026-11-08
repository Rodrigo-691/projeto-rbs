import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { importSponsorsSpreadsheet, type SponsorBatchImportResult } from "@/lib/backend-api";
import { supabase } from "@/integrations/supabase/client";
import { QuotaTag } from "@/components/QuotaTag";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { type Quota } from "@/lib/portal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  parseSponsorSheet,
  type ParsedSponsorItem,
  type ParsedSponsorError,
} from "@/lib/sponsor-sheet";

type PreviewItem = ParsedSponsorItem;
type PreviewError = ParsedSponsorError;

interface PreviewState {
  fileName: string;
  valid: PreviewItem[];
  invalid: PreviewError[];
}

export function SponsorBatchImport() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SponsorBatchImportResult | null>(null);

  function resetState() {
    setSelectedFile(null);
    setPreview(null);
    setSelectedRows(new Set());
    setResult(null);
    setLoading(false);
    setParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleRow(rowNumber: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (!preview) return;
    if (selectedRows.size === preview.valid.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(preview.valid.map((i) => i.rowNumber)));
    }
  }

  async function handleDownloadTemplate() {
    try {
      const { default: writeXlsxFile } = await import("write-excel-file/browser");

      const headers = [
        { value: "Nome", fontWeight: "bold" as const },
        { value: "CNPJ", fontWeight: "bold" as const },
        { value: "Segmento", fontWeight: "bold" as const },
        { value: "Ponto Focal Comercial", fontWeight: "bold" as const },
        { value: "Telefone / WhatsApp", fontWeight: "bold" as const },
        { value: "Cota", fontWeight: "bold" as const },
      ];

      const sampleRow1 = [
        { value: "Budweiser", type: String },
        { value: "12.345.678/0001-90", type: String },
        { value: "Bebidas", type: String },
        { value: "Carlos Silva", type: String },
        { value: "(51) 99999-9999", type: String },
        { value: "Master", type: String },
      ];

      const sampleRow2 = [
        { value: "Banrisul", type: String },
        { value: "98.765.432/0001-10", type: String },
        { value: "Banco", type: String },
        { value: "Mariana Costa", type: String },
        { value: "(51) 98888-8888", type: String },
        { value: "Subcota G", type: String },
      ];

      const sampleRow3 = [
        { value: "Panvel", type: String },
        { value: "11.222.333/0001-44", type: String },
        { value: "Farmácias", type: String },
        { value: "Felipe Ramos", type: String },
        { value: "(51) 97777-7777", type: String },
        { value: "Subcota", type: String },
      ];

      await writeXlsxFile([headers, sampleRow1, sampleRow2, sampleRow3], {
        columns: [
          { width: 28 },
          { width: 22 },
          { width: 20 },
          { width: 24 },
          { width: 22 },
          { width: 16 },
        ],
      }).toFile("modelo-importacao-patrocinadores.xlsx");

      toast.success("Modelo baixado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar modelo:", err);
      toast.error("Não foi possível gerar o modelo da planilha.");
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      toast.error("Por favor, envie um arquivo de planilha no formato .xlsx");
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setParsing(true);

    try {
      const { readSheet } = await import("read-excel-file/browser");
      const rows = (await readSheet(file)) as any[][];

      if (!rows || rows.length < 2) {
        toast.error("A planilha está vazia ou sem linhas de dados.");
        setParsing(false);
        return;
      }

      // Carrega patrocinadores existentes no banco para checagem dupla de duplicidade
      let dbSponsors: { id: string; name: string; cnpj: string | null }[] = [];
      try {
        const { data } = await supabase.from("sponsors").select("id, name, cnpj");
        if (data) dbSponsors = data;
      } catch (dbErr) {
        console.warn("Não foi possível carregar patrocinadores cadastrados no banco:", dbErr);
      }

      const parsed = parseSponsorSheet(rows, dbSponsors);

      if (parsed.missingHeaders && parsed.missingHeaders.length > 0) {
        toast.error(`Colunas obrigatórias ausentes na planilha: ${parsed.missingHeaders.join(", ")}`);
        setParsing(false);
        return;
      }

      setPreview({
        fileName: file.name,
        valid: parsed.valid,
        invalid: parsed.invalid,
      });

      // Marca por padrão APENAS os patrocinadores NÃO duplicados
      const nonDuplicateRows = new Set(
        parsed.valid.filter((item) => !item.isDuplicate).map((i) => i.rowNumber)
      );
      setSelectedRows(nonDuplicateRows);

      if (parsed.totalDuplicatesCount > 0) {
        toast.warning(
          `${parsed.totalDuplicatesCount} marca(s) duplicada(s) foram identificadas e desmarcadas automaticamente.`
        );
      }
    } catch (err) {
      console.error("Erro ao analisar planilha:", err);
      toast.error("Não foi possível ler o arquivo. Certifique-se de que é um Excel .xlsx válido.");
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirmImport() {
    if (!preview) return;

    const itemsToSave = preview.valid.filter((item) => selectedRows.has(item.rowNumber));

    if (itemsToSave.length === 0) {
      toast.error("Nenhum patrocinador selecionado com checkbox para cadastrar.");
      return;
    }

    setLoading(true);
    setResult(null);

    // Se todos os válidos continuarem selecionados e não houver linhas desmarcadas, tenta enviar via arquivo ao Java
    const allSelected = selectedRows.size === preview.valid.length && preview.invalid.length === 0;

    if (allSelected && selectedFile) {
      try {
        const res = await importSponsorsSpreadsheet(selectedFile);
        setResult(res);

        if (res.successCount > 0) {
          toast.success(`${res.successCount} patrocinador(es) cadastrado(s) com sucesso via Java (Apache POI)!`);
          qc.invalidateQueries({ queryKey: ["sponsors"] });
        }

        if (res.errorCount > 0) {
          toast.warning(`${res.errorCount} linha(s) com inconsistências não foram cadastradas.`);
        }
        setLoading(false);
        return;
      } catch (err) {
        console.warn("Backend Java em fallback, prosseguindo com inserção dos itens selecionados:", err);
      }
    }

    // Inserção dos itens marcados com checkbox
    try {
      const toInsert = itemsToSave.map((item) => ({
        name: item.name,
        cnpj: item.cnpj,
        quota: item.quota,
        segment: item.segment,
        contact_name: item.contactName,
        contact_phone: item.contactPhone,
        notes: "Importado em lote via planilha pelo administrador",
      }));

      const { error: insertErr } = await supabase.from("sponsors").insert(toInsert);
      if (insertErr) throw insertErr;

      toast.success(`${toInsert.length} patrocinador(es) selecionado(s) cadastrado(s) com sucesso!`);
      qc.invalidateQueries({ queryKey: ["sponsors"] });

      setResult({
        success: true,
        totalRows: itemsToSave.length + preview.invalid.length,
        successCount: toInsert.length,
        errorCount: preview.invalid.length,
        createdSponsors: toInsert as any,
        errors: preview.invalid.map((inv) => ({
          rowNumber: inv.rowNumber,
          sponsorName: inv.name,
          cnpj: inv.cnpj,
          errorMessage: inv.reason,
        })),
      });
    } catch (err: any) {
      console.error("Falha ao cadastrar selecionados:", err);
      toast.error(err.message || "Erro ao cadastrar patrocinadores selecionados.");
    } finally {
      setLoading(false);
    }
  }

  const isAllSelected =
    preview && preview.valid.length > 0 && selectedRows.size === preview.valid.length;
  const isSomeSelected =
    selectedRows.size > 0 && preview && selectedRows.size < preview.valid.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Importar planilha
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="text-primary h-5 w-5" />
            Importar patrocinadores via planilha
          </DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha <strong>.xlsx</strong> e marque os patrocinadores que deseja cadastrar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Se ainda não selecionou arquivo nem gerou preview */}
          {!preview && !result && (
            <>
              {/* Instruções de colunas */}
              <div className="rounded-lg border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">Colunas da planilha:</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>
                    <strong className="text-foreground">Nome</strong> (Obrigatória): Razão social ou nome da marca.
                  </li>
                  <li>
                    <strong className="text-foreground">CNPJ</strong> (Obrigatória): Número do CNPJ.
                  </li>
                  <li>
                    <strong className="text-foreground">Cota</strong> (Obrigatória): <em>Master</em>, <em>Subcota G</em> ou <em>Subcota</em>.
                  </li>
                  <li>
                    <strong>Segmento</strong> (Opcional): Ramo de atuação (ex: Bebidas, Banco).
                  </li>
                  <li>
                    <strong>Ponto Focal Comercial</strong> (Opcional): Nome do contato na marca.
                  </li>
                  <li>
                    <strong>Telefone / WhatsApp</strong> (Opcional): Telefone de contato.
                  </li>
                </ul>

                <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                  <span>Baixe a planilha pronta com as colunas padronizadas:</span>
                  <Button type="button" size="sm" variant="secondary" onClick={handleDownloadTemplate} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Baixar modelo (.xlsx)
                  </Button>
                </div>
              </div>

              {/* Área de seleção de arquivo */}
              <div className="rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/10">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  id="sponsor-sheet-input"
                  onChange={handleFileSelected}
                />

                <label
                  htmlFor="sponsor-sheet-input"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2"
                >
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    {parsing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                  </div>
                  <span className="text-sm font-semibold">
                    {parsing ? "Lendo e validando planilha..." : "Clique para selecionar a planilha (.xlsx)"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Você poderá selecionar individualmente as marcas antes de confirmar
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Modo de PRÉ-VISUALIZAÇÃO COM CHECKBOXES */}
          {preview && !result && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="text-primary h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{preview.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>{selectedRows.size}</strong> de {preview.valid.length} marca(s) selecionada(s) para inclusão
                      {preview.invalid.length > 0 && ` • ${preview.invalid.length} com inconsistência`}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetState}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Trocar planilha
                </Button>
              </div>

              {/* Alerta de Duplicidades */}
              {(() => {
                const dbDups = preview.valid.filter((i) => i.duplicateType === "database");
                const sheetDups = preview.valid.filter((i) => i.duplicateType === "sheet");
                const totalDups = dbDups.length + sheetDups.length;
                if (totalDups === 0) return null;

                return (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">
                          Atenção: {totalDups} marca(s) com duplicidade identificada(s)
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          {dbDups.length > 0 && (
                            <span>• <strong>{dbDups.length}</strong> já cadastrada(s) na plataforma. </span>
                          )}
                          {sheetDups.length > 0 && (
                            <span>• <strong>{sheetDups.length}</strong> repetida(s) na própria planilha. </span>
                          )}
                          Elas foram <strong>desmarcadas automaticamente</strong> para proteger o cadastro.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tabela de Patrocinadores com Checkboxes */}
              {preview.valid.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                      Selecione as marcas que deseja cadastrar ({selectedRows.size}/{preview.valid.length}):
                    </span>
                    <div className="flex items-center gap-3">
                      {preview.valid.some((i) => i.isDuplicate) && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRows(
                              new Set(preview.valid.filter((i) => !i.isDuplicate).map((i) => i.rowNumber))
                            )
                          }
                          className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                        >
                          Manter apenas novos
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-primary hover:underline font-medium"
                      >
                        {selectedRows.size === preview.valid.length ? "Desmarcar todos" : "Selecionar todos"}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto rounded-lg border bg-background">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 border-b bg-muted/70 font-semibold text-muted-foreground">
                        <tr>
                          <th className="w-10 px-3 py-2.5 text-center">
                            <Checkbox
                              checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                              onCheckedChange={toggleSelectAll}
                              aria-label="Selecionar todas as marcas"
                            />
                          </th>
                          <th className="px-3 py-2.5">Linha</th>
                          <th className="px-3 py-2.5">Marca / Nome</th>
                          <th className="px-3 py-2.5">CNPJ</th>
                          <th className="px-3 py-2.5">Cota</th>
                          <th className="px-3 py-2.5">Segmento</th>
                          <th className="px-3 py-2.5">Contato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.valid.map((item) => {
                          const isChecked = selectedRows.has(item.rowNumber);
                          return (
                            <tr
                              key={item.rowNumber}
                              onClick={() => toggleRow(item.rowNumber)}
                              className={`cursor-pointer transition-colors ${
                                item.isDuplicate
                                  ? isChecked
                                    ? "bg-amber-500/10 hover:bg-amber-500/15"
                                    : "bg-amber-500/5 opacity-70 hover:opacity-90"
                                  : isChecked
                                  ? "bg-primary/5 hover:bg-primary/10"
                                  : "opacity-60 hover:bg-muted/40"
                              }`}
                            >
                              <td className="w-10 px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleRow(item.rowNumber)}
                                  aria-label={`Selecionar ${item.name}`}
                                />
                              </td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">#{item.rowNumber}</td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                    <span
                                      className={`font-semibold text-foreground ${
                                        !isChecked && !item.isDuplicate ? "line-through text-muted-foreground" : ""
                                      }`}
                                    >
                                      {item.name}
                                    </span>
                                  </div>
                                  {item.isDuplicate && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                      <AlertTriangle className="h-3 w-3 shrink-0" />
                                      {item.duplicateReason}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">{item.cnpj}</td>
                              <td className="px-3 py-2">
                                <QuotaTag quota={item.quota} />
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{item.segment || "—"}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {item.contactName ? `${item.contactName} ${item.contactPhone ? `(${item.contactPhone})` : ""}` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center text-sm text-destructive">
                  Nenhum patrocinador válido foi encontrado na planilha com os campos obrigatórios preenchidos.
                </div>
              )}

              {/* Tabela de Inconsistências / Erros prévios */}
              {preview.invalid.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {preview.invalid.length} linha(s) ignoradas por falta de dados obrigatórios:
                    </span>
                  </div>

                  <div className="mt-3 max-h-40 overflow-y-auto rounded border bg-background">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 border-b bg-muted/60 font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Linha</th>
                          <th className="px-3 py-2">Nome</th>
                          <th className="px-3 py-2">CNPJ</th>
                          <th className="px-3 py-2">Inconsistência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.invalid.map((err, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-mono text-muted-foreground">#{err.rowNumber}</td>
                            <td className="px-3 py-2 font-medium text-foreground">{err.name}</td>
                            <td className="px-3 py-2 text-muted-foreground">{err.cnpj}</td>
                            <td className="px-3 py-2 font-medium text-destructive">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resultado Pós-Importação */}
          {result && (
            <div className="space-y-4 py-2">
              {result.successCount > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-semibold">Importação concluída com sucesso!</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>{result.successCount} patrocinador(es)</strong> foram cadastrados e já estão disponíveis no painel.
                    </p>
                  </div>
                </div>
              )}

              {result.errorCount > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Linhas que não puderam ser cadastradas ({result.errorCount}):</span>
                  </div>
                  <div className="mt-2.5 max-h-48 overflow-y-auto rounded border bg-background">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 border-b bg-muted/60 font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Linha</th>
                          <th className="px-3 py-2">Nome Informado</th>
                          <th className="px-3 py-2">CNPJ</th>
                          <th className="px-3 py-2">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.errors.map((e, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-mono text-muted-foreground">#{e.rowNumber}</td>
                            <td className="px-3 py-2 font-medium text-foreground">{e.sponsorName}</td>
                            <td className="px-3 py-2 text-muted-foreground">{e.cnpj}</td>
                            <td className="px-3 py-2 font-medium text-destructive">{e.errorMessage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              resetState();
            }}
          >
            {result ? "Concluir" : "Cancelar"}
          </Button>

          {preview && !result && (
            <Button
              type="button"
              disabled={loading || selectedRows.size === 0}
              onClick={handleConfirmImport}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar e cadastrar {selectedRows.size} marca(s) selecionada(s)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

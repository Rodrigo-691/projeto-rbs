import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { importSponsorsSpreadsheet, type SponsorBatchImportResult } from "@/lib/backend-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SponsorBatchImport() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SponsorBatchImportResult | null>(null);

  function resetState() {
    setSelectedFile(null);
    setResult(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        { value: "Exemplo Marca Master", type: String },
        { value: "12.345.678/0001-90", type: String },
        { value: "Bebidas", type: String },
        { value: "Carlos Silva", type: String },
        { value: "(51) 99999-9999", type: String },
        { value: "Master", type: String },
      ];

      const sampleRow2 = [
        { value: "Exemplo Marca Subcota G", type: String },
        { value: "98.765.432/0001-10", type: String },
        { value: "Vestuário", type: String },
        { value: "Mariana Costa", type: String },
        { value: "(51) 98888-8888", type: String },
        { value: "Subcota G", type: String },
      ];

      const sampleRow3 = [
        { value: "Exemplo Marca Subcota", type: String },
        { value: "11.222.333/0001-44", type: String },
        { value: "Tecnologia", type: String },
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

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx")) {
        toast.error("Por favor, envie um arquivo de planilha no formato .xlsx");
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  }

  async function handleImport() {
    if (!selectedFile) {
      toast.error("Selecione um arquivo .xlsx antes de prosseguir.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await importSponsorsSpreadsheet(selectedFile);
      setResult(res);

      if (res.successCount > 0) {
        toast.success(`${res.successCount} patrocinador(es) cadastrado(s) com sucesso!`);
        qc.invalidateQueries({ queryKey: ["sponsors"] });
      }

      if (res.errorCount > 0) {
        toast.warning(`${res.errorCount} linha(s) continham erros e não foram cadastradas.`);
      }
    } catch (err: any) {
      console.error("Falha ao importar:", err);
      toast.error(err.message || "Erro ao processar planilha no servidor.");
    } finally {
      setLoading(false);
    }
  }

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

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="text-primary h-5 w-5" />
            Importar patrocinadores via planilha
          </DialogTitle>
          <DialogDescription>
            Envie uma planilha <strong>.xlsx</strong> para extrair e cadastrar patrocinadores em lote. O processamento é
            realizado pelo motor <strong>Apache POI</strong> no backend Java.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Instruções de colunas */}
          <div className="rounded-lg border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Colunas da planilha:</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>
                <strong className="text-foreground">Nome</strong> (Obrigatória): Razão social ou nome da marca.
              </li>
              <li>
                <strong className="text-foreground">CNPJ</strong> (Obrigatória): Número do CNPJ (com ou sem formatação).
              </li>
              <li>
                <strong className="text-foreground">Cota</strong> (Obrigatória): Categoria do patrocinador (
                <em>Master</em>, <em>Subcota G</em> ou <em>Subcota</em>).
              </li>
              <li>
                <strong>Segmento</strong> (Opcional): Ramo de atuação (ex: Bebidas, Telecom).
              </li>
              <li>
                <strong>Ponto Focal Comercial</strong> (Opcional): Nome do contato responsável na marca.
              </li>
              <li>
                <strong>Telefone / WhatsApp</strong> (Opcional): Número de contato com DDD.
              </li>
            </ul>

            <div className="mt-3 flex items-center justify-between border-t pt-2.5">
              <span>Utilize o modelo padronizado com os cabeçalhos corretos:</span>
              <Button type="button" size="sm" variant="secondary" onClick={handleDownloadTemplate} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Baixar modelo (.xlsx)
              </Button>
            </div>
          </div>

          {/* Área de seleção de arquivo */}
          <div className="rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/10">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              id="sponsor-sheet-input"
              onChange={handleFileSelected}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <FileSpreadsheet className="text-primary h-6 w-6" />
                  <span>{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="gap-1 text-xs text-destructive hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" /> Remover arquivo
                </Button>
              </div>
            ) : (
              <label
                htmlFor="sponsor-sheet-input"
                className="flex cursor-pointer flex-col items-center justify-center gap-2"
              >
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Clique para selecionar a planilha (.xlsx)</span>
                <span className="text-xs text-muted-foreground">Ou arraste e solte o arquivo aqui</span>
              </label>
            )}
          </div>

          {/* Exibição dos Resultados e Erros Detalhados */}
          {result && (
            <div className="space-y-3">
              {result.successCount > 0 && (
                <div className="flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>
                    <strong>{result.successCount} patrocinador(es)</strong> cadastrado(s) com sucesso na plataforma!
                  </span>
                </div>
              )}

              {result.errorCount > 0 && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {result.errorCount} patrocinador(es) apresentaram inconsistências e não foram cadastrados:
                    </span>
                  </div>

                  <div className="mt-3 max-h-56 overflow-y-auto rounded border bg-background">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 border-b bg-muted/60 font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Linha</th>
                          <th className="px-3 py-2">Nome Informado</th>
                          <th className="px-3 py-2">CNPJ</th>
                          <th className="px-3 py-2">Motivo do Erro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-mono text-muted-foreground">#{err.rowNumber}</td>
                            <td className="px-3 py-2 font-medium text-foreground">{err.sponsorName}</td>
                            <td className="px-3 py-2 text-muted-foreground">{err.cnpj}</td>
                            <td className="px-3 py-2 font-medium text-destructive">{err.errorMessage}</td>
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
            Fechar
          </Button>

          <Button
            type="button"
            disabled={!selectedFile || loading}
            onClick={handleImport}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando planilha...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Processar e cadastrar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

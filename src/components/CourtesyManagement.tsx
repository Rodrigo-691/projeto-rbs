import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Ticket,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BUCKET, type Sponsor } from "@/lib/portal";
import {
  downloadCourtesyTemplate,
  exportCourtesiesToExcel,
  parseCourtesyGrid,
  type CourtesyRow,
  type ParseCourtesySheetResult,
} from "@/lib/courtesy-sheet";

interface CourtesyManagementProps {
  sponsorId: string;
  sponsor: Sponsor;
  isAdmin: boolean;
}

export function CourtesyManagement({ sponsorId, sponsor, isAdmin }: CourtesyManagementProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter / Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [ticketFilter, setTicketFilter] = useState("all");

  // Admin Quota Modal State
  const [isQuotaOpen, setIsQuotaOpen] = useState(false);
  const [quotaInput, setQuotaInput] = useState<number>(sponsor.courtesy_quota ?? 0);

  // Import Preview Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<ParseCourtesySheetResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);

  // Fetch courtesies from Supabase
  const courtesiesQuery = useQuery({
    queryKey: ["sponsor_courtesies", sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsor_courtesies")
        .select("*")
        .eq("sponsor_id", sponsorId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CourtesyRow[];
    },
  });

  const list = courtesiesQuery.data ?? [];
  const quota = sponsor.courtesy_quota ?? 0;
  const progressPercent = quota > 0 ? Math.min(100, Math.round((list.length / quota) * 100)) : 0;

  // Filtered rows
  const filteredList = list.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesTerm =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.cpf.toLowerCase().includes(term) ||
      (item.email && item.email.toLowerCase().includes(term)) ||
      (item.phone && item.phone.toLowerCase().includes(term));

    const matchesSector = sectorFilter === "all" || item.sector.toLowerCase() === sectorFilter.toLowerCase();
    const matchesTicket = ticketFilter === "all" || item.ticket_type.toLowerCase() === ticketFilter.toLowerCase();

    return matchesTerm && matchesSector && matchesTicket;
  });

  // Sector and Ticket breakdowns
  const ticketCounts = list.reduce(
    (acc, row) => {
      const t = row.ticket_type;
      if (t === "Passaporte") acc.passaporte++;
      else if (t === "Sexta") acc.sexta++;
      else if (t === "Sábado") acc.sabado++;
      else acc.outros++;
      return acc;
    },
    { passaporte: 0, sexta: 0, sabado: 0, outros: 0 },
  );

  // Mutation: Update Courtesy Quota
  const updateQuota = useMutation({
    mutationFn: async (newQuota: number) => {
      const { error } = await supabase
        .from("sponsors")
        .update({ courtesy_quota: newQuota })
        .eq("id", sponsorId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cota de cortesias atualizada com sucesso");
      setIsQuotaOpen(false);
      qc.invalidateQueries({ queryKey: ["sponsor", sponsorId] });
    },
    onError: (err: Error) => toast.error(`Erro ao salvar cota: ${err.message}`),
  });

  // Mutation: Delete Single Courtesy
  const deleteCourtesy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sponsor_courtesies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cortesia removida");
      qc.invalidateQueries({ queryKey: ["sponsor_courtesies", sponsorId] });
    },
    onError: (err: Error) => toast.error(`Erro ao remover: ${err.message}`),
  });

  // Mutation: Confirm Batch Import
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!importResult || importResult.rows.length === 0) return;

      // 1. If replacing, remove previous courtesies for this sponsor
      if (replaceExisting) {
        const { error: delError } = await supabase
          .from("sponsor_courtesies")
          .delete()
          .eq("sponsor_id", sponsorId);
        if (delError) throw delError;
      }

      // 2. Insert new rows in chunks of 100
      const payload = importResult.rows.map((r) => ({
        sponsor_id: sponsorId,
        name: r.name,
        cpf: r.cpf,
        email: r.email || null,
        phone: r.phone || null,
        sector: r.sector || "Arena",
        ticket_type: r.ticket_type,
      }));

      const CHUNK_SIZE = 100;
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        const chunk = payload.slice(i, i + CHUNK_SIZE);
        const { error: insError } = await supabase.from("sponsor_courtesies").insert(chunk);
        if (insError) throw insError;
      }

      // 3. Save copy of raw file to storage & sponsor_files if provided
      if (pendingFile) {
        try {
          const storagePath = `${sponsorId}/cortesias/${Date.now()}-${pendingFile.name}`;
          await supabase.storage.from(BUCKET).upload(storagePath, pendingFile, {
            contentType: pendingFile.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            upsert: true,
          });

          await supabase.from("sponsor_files").insert({
            sponsor_id: sponsorId,
            tab: "cortesias",
            category: "Planilha de Cortesias",
            file_name: pendingFile.name,
            storage_path: storagePath,
            size_bytes: pendingFile.size,
            mime_type: pendingFile.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
        } catch (e) {
          console.warn("Could not archive courtesy file to storage:", e);
        }
      }
    },
    onSuccess: () => {
      toast.success(`${importResult?.rows.length} cortesias importadas com sucesso!`);
      setIsImportOpen(false);
      setImportResult(null);
      setPendingFile(null);
      qc.invalidateQueries({ queryKey: ["sponsor_courtesies", sponsorId] });
      qc.invalidateQueries({ queryKey: ["sponsor_files", sponsorId] });
    },
    onError: (err: Error) => toast.error(`Falha na importação: ${err.message}`),
  });

  // Handle File Upload Change
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { default: readXlsxFile } = await import("read-excel-file/browser");
      const matrix = await readXlsxFile(file);
      const res = parseCourtesyGrid(matrix as unknown[][]);

      if (res.errors.length > 0 && res.rows.length === 0) {
        toast.error(res.errors[0]);
        return;
      }

      setPendingFile(file);
      setImportResult(res);
      setIsImportOpen(true);
    } catch (err: any) {
      toast.error(`Erro ao ler planilha: ${err?.message || "Arquivo inválido"}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function getTicketBadge(ticket: string) {
    if (ticket === "Passaporte") {
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30">
          Passaporte (2 dias)
        </Badge>
      );
    }
    if (ticket === "Sexta") {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
          Sexta (29/Jan)
        </Badge>
      );
    }
    if (ticket === "Sábado") {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
          Sábado (30/Jan)
        </Badge>
      );
    }
    return <Badge variant="outline">{ticket}</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {/* Top Section: Quota Tracker & Action Buttons */}
      <Panel
        title="Gestão de Ingressos de Cortesia"
        description="Acompanhamento e envio nominal dos convidados contemplados pela cota da marca."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCourtesyTemplate()}
              className="text-xs"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Baixar modelo (.xlsx)
            </Button>

            {list.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCourtesiesToExcel(list, sponsor.name)}
                className="text-xs"
              >
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                Exportar lista
              </Button>
            )}

            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuotaInput(sponsor.courtesy_quota ?? 0);
                    setIsQuotaOpen(true);
                  }}
                  className="text-xs"
                >
                  <Ticket className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Definir cota contratada
                </Button>

                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Importar planilha
                </Button>
              </>
            )}
          </div>
        }
      >
        <div className="space-y-5 pt-2">
          {/* Quota Progress Banner */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Cota Contratada de Cortesias:
                  </span>
                  {quota > 0 ? (
                    <Badge variant="secondary" className="font-bold">
                      {quota} ingressos
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">
                      Não definida pela RBS
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {quota > 0
                    ? `${list.length} de ${quota} pessoas cadastradas (${progressPercent}% preenchido)`
                    : "O administrador RBS definirá o limite de cortesias contratuais para esta marca."}
                </p>
              </div>

              {quota > 0 && (
                <div className="shrink-0">
                  {list.length === quota ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Cota 100% preenchida
                    </Badge>
                  ) : list.length > quota ? (
                    <Badge variant="destructive">
                      <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                      Excede a cota em {list.length - quota}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      Restam {quota - list.length} vagas
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {quota > 0 && (
              <div className="mt-3 space-y-1">
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-muted-foreground text-xs">Total Cadastrado</span>
              <p className="text-lg font-bold text-foreground mt-0.5">{list.length}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-muted-foreground text-xs">Passaportes</span>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {ticketCounts.passaporte}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-muted-foreground text-xs">Ingressos Sexta</span>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {ticketCounts.sexta}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-muted-foreground text-xs">Ingressos Sábado</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {ticketCounts.sabado}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* Main Table Panel: List of Courtesies */}
      <Panel
        flush
        title="Beneficiários das Cortesias"
        description="Lista consolidada de pessoas que receberão os ingressos da marca."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-3.5 w-3.5" />
              <Input
                placeholder="Buscar por nome, CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        }
      >
        {courtesiesQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando lista de cortesias...
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="text-muted-foreground/40 mx-auto h-10 w-10 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">Nenhuma cortesia registrada ainda</h3>
            <p className="text-muted-foreground text-xs max-w-md mx-auto mt-1">
              {isAdmin
                ? "Faça upload da planilha padronizada com a lista de beneficiários (Nome, CPF, E-mail, Telefone, Setor e Ingresso)."
                : "A equipe RBS ainda não disponibilizou a lista de cortesias desta marca no portal."}
            </p>
            {isAdmin && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Importar planilha agora
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Ingresso / Dia</TableHead>
                  {isAdmin && <TableHead className="text-right">Ação</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center text-xs text-muted-foreground">
                      Nenhum beneficiário encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((row) => (
                    <TableRow key={row.id || `${row.cpf}-${row.name}`}>
                      <TableCell className="font-medium text-foreground">
                        {row.name}
                      </TableCell>
                      <TableCell className="tabular font-mono text-xs text-muted-foreground">
                        {row.cpf}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.email ? (
                          <a href={`mailto:${row.email}`} className="hover:underline hover:text-primary">
                            {row.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {row.sector}
                        </Badge>
                      </TableCell>
                      <TableCell>{getTicketBadge(row.ticket_type)}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => row.id && deleteCourtesy.mutate(row.id)}
                            disabled={deleteCourtesy.isPending}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Remover cortesia"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      {/* Modal: Definir Cota de Cortesias (Admin RBS) */}
      <Dialog open={isQuotaOpen} onOpenChange={setIsQuotaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Definir Cota de Cortesias</DialogTitle>
            <DialogDescription>
              Informe quantas pessoas/ingressos de cortesia foram acordados em contrato para {sponsor.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="courtesy-quota-input">Quantidade total de cortesias</Label>
              <Input
                id="courtesy-quota-input"
                type="number"
                min={0}
                placeholder="Ex: 50"
                value={quotaInput}
                onChange={(e) => setQuotaInput(Number(e.target.value) || 0)}
              />
              <p className="text-muted-foreground text-xs">
                Este número será a meta máxima contratual exibida na barra de progresso da marca.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuotaOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => updateQuota.mutate(quotaInput)}
              disabled={updateQuota.isPending}
            >
              {updateQuota.isPending ? "Salvando..." : "Salvar Cota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Pré-visualização da Importação da Planilha */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Planilha de Cortesias</DialogTitle>
            <DialogDescription>
              Revise os dados encontrados no arquivo antes de consolidar no portal da marca.
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4 py-2">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <span className="text-muted-foreground text-xs">Cortesias válidas</span>
                  <p className="text-xl font-bold text-foreground mt-0.5">{importResult.totalValid}</p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <span className="text-muted-foreground text-xs">Cota da marca</span>
                  <p className="text-xl font-bold text-primary mt-0.5">
                    {quota > 0 ? quota : "Sem cota"}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <span className="text-muted-foreground text-xs">Duplicidades na planilha</span>
                  <p className="text-xl font-bold text-amber-600 mt-0.5">
                    {importResult.duplicatesInSheet.length}
                  </p>
                </div>
              </div>

              {/* Warning: Exceeds Quota */}
              {quota > 0 && importResult.totalValid > quota && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Atenção: A planilha ultrapassa a cota contratual!</span>
                    <p className="mt-0.5">
                      Foram encontradas {importResult.totalValid} cortesias para uma cota definida de {quota}.
                    </p>
                  </div>
                </div>
              )}

              {/* Warning: Duplicates in file */}
              {importResult.duplicatesInSheet.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">CPFs duplicados detectados na planilha:</span>
                    <p className="mt-0.5">
                      {importResult.duplicatesInSheet.slice(0, 4).join(", ")}
                      {importResult.duplicatesInSheet.length > 4 && ` (+${importResult.duplicatesInSheet.length - 4} outros)`}
                    </p>
                  </div>
                </div>
              )}

              {/* Preview table of first 5 items */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Pré-visualização (primeiras {Math.min(5, importResult.rows.length)} linhas):
                </p>
                <div className="max-h-56 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Nome</TableHead>
                        <TableHead className="text-xs">CPF</TableHead>
                        <TableHead className="text-xs">Setor</TableHead>
                        <TableHead className="text-xs">Ingresso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.rows.slice(0, 5).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium">{r.name}</TableCell>
                          <TableCell className="text-xs font-mono">{r.cpf}</TableCell>
                          <TableCell className="text-xs">{r.sector}</TableCell>
                          <TableCell className="text-xs">{getTicketBadge(r.ticket_type)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Import Options */}
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="replace-courtesies"
                  checked={replaceExisting}
                  onCheckedChange={(c) => setReplaceExisting(!!c)}
                />
                <Label htmlFor="replace-courtesies" className="text-xs cursor-pointer">
                  Substituir a lista anterior de cortesias desta marca (recomendado ao subir nova versão consolidada)
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending || !importResult || importResult.rows.length === 0}
            >
              {importMutation.isPending
                ? "Importando..."
                : `Confirmar Importação (${importResult?.totalValid ?? 0})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

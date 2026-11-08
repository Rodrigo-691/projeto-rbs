import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Layers,
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
import { NativeSelect } from "@/components/ui/native-select";
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
  type CourtesyQuotaRule,
  type CourtesyRow,
  type ParseCourtesySheetResult,
} from "@/lib/courtesy-sheet";

interface CourtesyManagementProps {
  sponsorId: string;
  sponsor: Sponsor;
  isAdmin: boolean;
}

const PRESET_SECTORS = [
  "Camarote",
  "Arena",
  "Premium",
  "Área VIP",
  "Lounge",
  "Planeta Open Bar",
  "Pista",
  "Frontstage",
];

const PRESET_TICKETS = [
  { value: "Passaporte", label: "Passaporte (2 dias)" },
  { value: "Sábado", label: "Sábado" },
  { value: "Domingo", label: "Domingo" },
];

export function CourtesyManagement({ sponsorId, sponsor, isAdmin }: CourtesyManagementProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter / Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "regular" | "exceeded" | "uncontracted">("all");

  // Admin Quota Rules Modal State
  const [isQuotaOpen, setIsQuotaOpen] = useState(false);

  // Extract current rules from sponsor
  const rawRules = (sponsor as any).courtesy_quota_rules;
  const currentRules: CourtesyQuotaRule[] = useMemo(() => {
    if (Array.isArray(rawRules) && rawRules.length > 0) {
      return rawRules;
    }
    if ((sponsor.courtesy_quota ?? 0) > 0) {
      return [
        {
          id: "default-rule-1",
          sector: "Camarote",
          ticket_type: "Passaporte",
          quantity: sponsor.courtesy_quota ?? 0,
        },
      ];
    }
    return [];
  }, [rawRules, sponsor.courtesy_quota]);

  const [rulesInput, setRulesInput] = useState<CourtesyQuotaRule[]>([]);

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
  const totalContractQuota = currentRules.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0) || (sponsor.courtesy_quota ?? 0);
  const progressPercent = totalContractQuota > 0 ? Math.min(100, Math.round((list.length / totalContractQuota) * 100)) : 0;

  // Normalized group key
  const getGroupKey = (sector: string, ticket: string) =>
    `${(sector || "").trim().toLowerCase()}::${(ticket || "").trim().toLowerCase()}`;

  // Breakdown of beneficiaries by rule
  const countByGroup = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of list) {
      const k = getGroupKey(b.sector, b.ticket_type);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [list]);

  // Quota breakdown per rule
  const quotaRulesStatus = useMemo(() => {
    return currentRules.map((rule) => {
      const k = getGroupKey(rule.sector, rule.ticket_type);
      const allocated = countByGroup.get(k) ?? 0;
      const remaining = Math.max(0, rule.quantity - allocated);
      const exceeded = Math.max(0, allocated - rule.quantity);
      const percent = rule.quantity > 0 ? Math.min(100, Math.round((allocated / rule.quantity) * 100)) : 0;
      return {
        rule,
        allocated,
        remaining,
        exceeded,
        percent,
        isFilled: allocated >= rule.quantity,
        isExceeded: allocated > rule.quantity,
      };
    });
  }, [currentRules, countByGroup]);

  // Beneficiaries not matching any rule
  const uncontractedBeneficiaries = useMemo(() => {
    if (currentRules.length === 0) return [];
    return list.filter((b) => {
      return !currentRules.some(
        (r) =>
          r.sector.trim().toLowerCase() === (b.sector || "").trim().toLowerCase() &&
          r.ticket_type.trim().toLowerCase() === (b.ticket_type || "").trim().toLowerCase()
      );
    });
  }, [list, currentRules]);

  // Beneficiary allocation status
  const beneficiariesWithStatus = useMemo(() => {
    const runningCount = new Map<string, number>();

    return list.map((item) => {
      const k = getGroupKey(item.sector, item.ticket_type);
      const order = (runningCount.get(k) ?? 0) + 1;
      runningCount.set(k, order);

      if (currentRules.length === 0) {
        return {
          row: item,
          status: "regular" as const,
          label: "Cadastrado",
          order,
          ruleQuantity: null,
        };
      }

      const matchingRule = currentRules.find(
        (r) =>
          r.sector.trim().toLowerCase() === (item.sector || "").trim().toLowerCase() &&
          r.ticket_type.trim().toLowerCase() === (item.ticket_type || "").trim().toLowerCase()
      );

      if (!matchingRule) {
        return {
          row: item,
          status: "uncontracted" as const,
          label: "Fora da cota contratada",
          order,
          ruleQuantity: null,
        };
      }

      if (order > matchingRule.quantity) {
        return {
          row: item,
          status: "exceeded" as const,
          label: `Excede cota (${order}/${matchingRule.quantity})`,
          order,
          ruleQuantity: matchingRule.quantity,
        };
      }

      return {
        row: item,
        status: "regular" as const,
        label: `Dentro da cota (${order}/${matchingRule.quantity})`,
        order,
        ruleQuantity: matchingRule.quantity,
      };
    });
  }, [list, currentRules]);

  // Filtered rows for the table
  const filteredBeneficiaries = useMemo(() => {
    return beneficiariesWithStatus.filter(({ row: item, status }) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesTerm =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.cpf.toLowerCase().includes(term) ||
        (item.email && item.email.toLowerCase().includes(term)) ||
        (item.phone && item.phone.toLowerCase().includes(term));

      const matchesSector = sectorFilter === "all" || item.sector.toLowerCase() === sectorFilter.toLowerCase();
      const matchesTicket = ticketFilter === "all" || item.ticket_type.toLowerCase() === ticketFilter.toLowerCase();
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesTerm && matchesSector && matchesTicket && matchesStatus;
    });
  }, [beneficiariesWithStatus, searchTerm, sectorFilter, ticketFilter, statusFilter]);

  // Unique sectors for filtering
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    for (const r of currentRules) set.add(r.sector);
    for (const b of list) set.add(b.sector);
    return Array.from(set).filter(Boolean);
  }, [currentRules, list]);

  // Sector and Ticket breakdowns for quick cards
  const ticketCounts = useMemo(() => {
    return list.reduce(
      (acc, row) => {
        const t = row.ticket_type;
        if (t === "Passaporte") acc.passaporte++;
        else if (t === "Sábado") acc.sabado++;
        else if (t === "Domingo") acc.domingo++;
        else acc.outros++;
        return acc;
      },
      { passaporte: 0, sabado: 0, domingo: 0, outros: 0 },
    );
  }, [list]);

  // Mutation: Save Quota Rules
  const updateQuotaRules = useMutation({
    mutationFn: async (rulesToSave: CourtesyQuotaRule[]) => {
      const validRules = rulesToSave.filter((r) => r.sector.trim() && Number(r.quantity) > 0);

      // Garantir que os setores não se repitam
      const sectors = validRules.map((r) => r.sector.trim().toLowerCase());
      const uniqueSectors = new Set(sectors);
      if (sectors.length !== uniqueSectors.size) {
        throw new Error("Cada setor pode ter apenas uma cota contratada definida. Remova os setores duplicados.");
      }

      const total = validRules.reduce((acc, r) => acc + Number(r.quantity), 0);

      const { error } = await supabase
        .from("sponsors")
        .update({
          courtesy_quota: total,
          courtesy_quota_rules: validRules as any,
        })
        .eq("id", sponsorId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cotas de cortesias atualizadas com sucesso!");
      setIsQuotaOpen(false);
      qc.invalidateQueries({ queryKey: ["sponsor", sponsorId] });
      qc.invalidateQueries({ queryKey: ["sponsors"] });
    },
    onError: (err: Error) => toast.error(`Erro ao salvar cotas: ${err.message}`),
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

  function handleOpenQuotaModal() {
    if (currentRules.length > 0) {
      setRulesInput(
        currentRules.map((r) => ({
          ...r,
          id: r.id || `rule-${Math.random().toString(36).substring(2, 9)}`,
          ticket_type: r.ticket_type === "Sexta" ? "Passaporte" : r.ticket_type,
        }))
      );
    } else {
      setRulesInput([
        {
          id: `rule-${Date.now()}-1`,
          sector: "Camarote",
          ticket_type: "Passaporte",
          quantity: 10,
        },
      ]);
    }
    setIsQuotaOpen(true);
  }

  function handleAddRule() {
    const selectedSectors = rulesInput.map((r) => r.sector.trim().toLowerCase());
    const nextAvailable = PRESET_SECTORS.find(
      (s) => !selectedSectors.includes(s.trim().toLowerCase())
    );

    if (!nextAvailable) {
      toast.info("Todos os setores disponíveis já foram adicionados às cotas.");
      return;
    }

    setRulesInput((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}-${prev.length + 1}`,
        sector: nextAvailable,
        ticket_type: "Passaporte",
        quantity: 10,
      },
    ]);
  }

  function handleRemoveRule(id: string) {
    setRulesInput((prev) => prev.filter((r) => r.id !== id));
  }

  function handleRuleChange(id: string, field: keyof CourtesyQuotaRule, value: any) {
    setRulesInput((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function getTicketBadge(ticket: string) {
    if (ticket === "Passaporte") {
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30">
          Passaporte (2 dias)
        </Badge>
      );
    }
    if (ticket === "Sábado") {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
          Sábado
        </Badge>
      );
    }
    if (ticket === "Domingo") {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">
          Domingo
        </Badge>
      );
    }
    if (ticket === "Sexta") {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
          Sexta
        </Badge>
      );
    }
    return <Badge variant="outline">{ticket}</Badge>;
  }

  // Comparison in import modal against quotas
  const importBreakdown = useMemo(() => {
    if (!importResult) return [];
    const countMap = new Map<string, number>();
    for (const row of importResult.rows) {
      const k = getGroupKey(row.sector, row.ticket_type);
      countMap.set(k, (countMap.get(k) ?? 0) + 1);
    }

    const items: {
      sector: string;
      ticket_type: string;
      foundInSheet: number;
      quota: number | null;
      status: "ok" | "exceeded" | "uncontracted";
    }[] = [];

    // Checked rules
    for (const rule of currentRules) {
      const k = getGroupKey(rule.sector, rule.ticket_type);
      const found = countMap.get(k) ?? 0;
      items.push({
        sector: rule.sector,
        ticket_type: rule.ticket_type,
        foundInSheet: found,
        quota: rule.quantity,
        status: found > rule.quantity ? "exceeded" : "ok",
      });
      countMap.delete(k);
    }

    // Remaining items from sheet not in rules
    for (const [k, found] of countMap.entries()) {
      const [sec, tic] = k.split("::");
      items.push({
        sector: sec || "Arena",
        ticket_type: tic || "Passaporte",
        foundInSheet: found,
        quota: null,
        status: currentRules.length > 0 ? "uncontracted" : "ok",
      });
    }

    return items;
  }, [importResult, currentRules]);

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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCourtesyTemplate(currentRules, sponsor.name)}
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
                  onClick={handleOpenQuotaModal}
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
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Cota Contratada Total:
                  </span>
                  {totalContractQuota > 0 ? (
                    <Badge variant="secondary" className="font-bold text-sm">
                      {totalContractQuota} ingressos
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">
                      Não definida pela RBS
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {totalContractQuota > 0
                    ? `${list.length} de ${totalContractQuota} pessoas cadastradas (${progressPercent}% preenchido)`
                    : "O administrador RBS definirá as cotas por setor e dia acordadas em contrato."}
                </p>
              </div>

              {totalContractQuota > 0 && (
                <div className="shrink-0 flex items-center gap-2">
                  {list.length === totalContractQuota ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Cota 100% preenchida
                    </Badge>
                  ) : list.length > totalContractQuota ? (
                    <Badge variant="destructive">
                      <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                      Excede o total em {list.length - totalContractQuota}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      Restam {totalContractQuota - list.length} vagas
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {totalContractQuota > 0 && (
              <div className="space-y-1">
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {/* Breakdown por Cota Contratada (Setor + Tipo de Ingresso) */}
            {quotaRulesStatus.length > 0 && (
              <div className="pt-2 border-t space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Detalhamento das Cotas por Setor & Tipo
                  </span>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenQuotaModal}
                      className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Editar cotas
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {quotaRulesStatus.map(({ rule, allocated, remaining, exceeded, percent, isFilled, isExceeded }) => (
                    <div
                      key={rule.id}
                      className="rounded-lg border bg-muted/20 p-3 space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{rule.sector}</p>
                          <div className="mt-0.5">{getTicketBadge(rule.ticket_type)}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold tabular text-foreground">
                            {allocated} / {rule.quantity}
                          </span>
                          <p className="text-[10px] text-muted-foreground">{percent}%</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Progress
                          value={percent}
                          className="h-1.5"
                        />
                        <div className="flex items-center justify-between text-[11px]">
                          {isExceeded ? (
                            <span className="text-destructive font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Excede em {exceeded}
                            </span>
                          ) : isFilled ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Cota atingida
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Restam {remaining} vagas
                            </span>
                          )}
                          <span className="text-muted-foreground font-mono text-[10px]">
                            Meta: {rule.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerta de Beneficiários fora das cotas contratuais */}
            {uncontractedBeneficiaries.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-0.5 flex-1">
                  <span className="font-semibold">
                    {uncontractedBeneficiaries.length} beneficiário(s) cadastrado(s) com setor ou dia fora das cotas contratadas.
                  </span>
                  <p className="text-[11px] opacity-90">
                    Verifique se os setores e tipos informados na planilha correspondem ao contrato ou atualize as cotas contratadas da marca.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter("uncontracted")}
                  className="h-7 text-xs shrink-0 border-amber-500/40 hover:bg-amber-500/20"
                >
                  Filtrar irregulares
                </Button>
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
              <span className="text-muted-foreground text-xs">Passaportes (2 dias)</span>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {ticketCounts.passaporte}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-muted-foreground text-xs">Ingressos Sábado</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {ticketCounts.sabado}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-muted-foreground text-xs">Ingressos Domingo</span>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {ticketCounts.domingo}
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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-3.5 w-3.5" />
              <Input
                placeholder="Buscar por nome, CPF ou contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <NativeSelect
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="h-8 text-xs w-[140px]"
            >
              <option value="all">Todos os setores</option>
              {availableSectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value)}
              className="h-8 text-xs w-[150px]"
            >
              <option value="all">Todos os ingressos</option>
              <option value="Passaporte">Passaporte (2 dias)</option>
              <option value="Sábado">Sábado</option>
              <option value="Domingo">Domingo</option>
            </NativeSelect>

            {currentRules.length > 0 && (
              <NativeSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-8 text-xs w-[145px]"
              >
                <option value="all">Todos os status</option>
                <option value="regular">Regulares (na cota)</option>
                <option value="exceeded">Excedentes da cota</option>
                <option value="uncontracted">Fora do contrato</option>
              </NativeSelect>
            )}
          </div>
        }
      >
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="text-muted-foreground mx-auto h-10 w-10 opacity-40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">Nenhuma cortesia registrada ainda</h3>
            <p className="text-muted-foreground text-xs max-w-md mx-auto mt-1">
              {isAdmin
                ? "Faça download do modelo oficial abaixo, preencha os convidados e suba a planilha preenchida."
                : "A equipe RBS ainda não disponibilizou a lista de cortesias desta marca no portal."}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCourtesyTemplate(currentRules, sponsor.name)}
                className="text-xs"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Baixar modelo (.xlsx)
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Importar planilha agora
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] text-xs">#</TableHead>
                  <TableHead className="text-xs">Nome do Beneficiário</TableHead>
                  <TableHead className="text-xs">CPF</TableHead>
                  <TableHead className="text-xs">Contato</TableHead>
                  <TableHead className="text-xs">Setor</TableHead>
                  <TableHead className="text-xs">Tipo de Ingresso</TableHead>
                  {currentRules.length > 0 && <TableHead className="text-xs">Status da Cota</TableHead>}
                  {isAdmin && <TableHead className="w-[60px] text-right text-xs">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBeneficiaries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={currentRules.length > 0 ? (isAdmin ? 8 : 7) : (isAdmin ? 7 : 6)}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      Nenhum beneficiário encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBeneficiaries.map(({ row, status, label, order, ruleQuantity }, idx) => (
                    <TableRow key={row.id || `${row.cpf}-${idx}`}>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {row.cpf}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.email && <div className="truncate max-w-[180px]">{row.email}</div>}
                        {row.phone && <div className="text-[11px] opacity-80">{row.phone}</div>}
                        {!row.email && !row.phone && "—"}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <Badge variant="outline" className="font-normal">
                          {row.sector}
                        </Badge>
                      </TableCell>
                      <TableCell>{getTicketBadge(row.ticket_type)}</TableCell>
                      {currentRules.length > 0 && (
                        <TableCell className="text-xs">
                          {status === "regular" && (
                            <Badge
                              variant="outline"
                              className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-normal text-[11px]"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Regular ({order}/{ruleQuantity})
                            </Badge>
                          )}
                          {status === "exceeded" && (
                            <Badge
                              variant="destructive"
                              className="font-normal text-[11px]"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Excede cota ({order}/{ruleQuantity})
                            </Badge>
                          )}
                          {status === "uncontracted" && (
                            <Badge
                              variant="outline"
                              className="text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/10 font-normal text-[11px]"
                            >
                              Fora da cota
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => row.id && deleteCourtesy.mutate(row.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
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

      {/* Modal: Definir Cotas Contratadas por Setor e Tipo (Admin RBS) */}
      <Dialog open={isQuotaOpen} onOpenChange={setIsQuotaOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Definir Cotas Contratadas de Cortesias</DialogTitle>
            <DialogDescription>
              Configure a distribuição de cortesias acordadas em contrato para {sponsor.name}, especificando o setor, tipo de ingresso e quantidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-3">
              {rulesInput.map((rule, index) => (
                <div
                  key={rule.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 rounded-lg border bg-muted/20"
                >
                  {/* Setor */}
                  <div className="flex-1 w-full space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Setor</Label>
                    {(() => {
                      const otherSelectedSectors = rulesInput
                        .filter((r) => r.id !== rule.id)
                        .map((r) => r.sector.trim().toLowerCase());

                      const sectorsList = Array.from(
                        new Set([
                          ...PRESET_SECTORS,
                          ...(rule.sector && !PRESET_SECTORS.some((s) => s.toLowerCase() === rule.sector.toLowerCase())
                            ? [rule.sector]
                            : []),
                        ])
                      );

                      return (
                        <NativeSelect
                          value={rule.sector}
                          onChange={(e) => handleRuleChange(rule.id, "sector", e.target.value)}
                          className="h-8 text-xs w-full"
                        >
                          <option value="" disabled>
                            Selecione um setor...
                          </option>
                          {sectorsList.map((s) => {
                            const isTaken = otherSelectedSectors.includes(s.trim().toLowerCase());
                            return (
                              <option key={s} value={s} disabled={isTaken}>
                                {s} {isTaken ? "(já utilizado em outra cota)" : ""}
                              </option>
                            );
                          })}
                        </NativeSelect>
                      );
                    })()}
                  </div>

                  {/* Tipo de Ingresso */}
                  <div className="w-full sm:w-44 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Tipo de Ingresso</Label>
                    <NativeSelect
                      value={rule.ticket_type}
                      onChange={(e) => handleRuleChange(rule.id, "ticket_type", e.target.value)}
                      className="h-8 text-xs"
                    >
                      {PRESET_TICKETS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  {/* Quantidade */}
                  <div className="w-full sm:w-24 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Qtd"
                      value={rule.quantity || ""}
                      onChange={(e) =>
                        handleRuleChange(rule.id, "quantity", Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Remover Linha */}
                  <div className="self-end sm:self-center pt-2 sm:pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRule(rule.id)}
                      disabled={rulesInput.length === 1 && index === 0}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Remover esta cota"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão Adicionar outra Cota */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRule}
              disabled={rulesInput.length >= PRESET_SECTORS.length}
              className="w-full text-xs border-dashed"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {rulesInput.length >= PRESET_SECTORS.length
                ? "Todos os setores disponíveis já foram configurados"
                : "Adicionar outro setor"}
            </Button>

            {/* Total Geral da Cota */}
            <div className="flex items-center justify-between rounded-lg border bg-card p-3 text-xs">
              <span className="text-muted-foreground">Total geral contratado para esta marca:</span>
              <span className="font-bold text-sm text-foreground tabular">
                {rulesInput.reduce((acc, r) => acc + (Math.max(0, Number(r.quantity)) || 0), 0)} ingressos
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuotaOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => updateQuotaRules.mutate(rulesInput)}
              disabled={updateQuotaRules.isPending}
            >
              {updateQuotaRules.isPending ? "Salvando..." : "Salvar Cotas Contratadas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Pré-visualização da Importação da Planilha */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Planilha de Cortesias</DialogTitle>
            <DialogDescription>
              Revise a validação e o comparativo com as cotas contratadas antes de consolidar.
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
                  <span className="text-muted-foreground text-xs">Cota total da marca</span>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {totalContractQuota > 0 ? totalContractQuota : "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <span className="text-muted-foreground text-xs">CPFs duplicados</span>
                  <p
                    className={`text-xl font-bold mt-0.5 ${
                      importResult.duplicatesInSheet.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                    }`}
                  >
                    {importResult.duplicatesInSheet.length}
                  </p>
                </div>
              </div>

              {/* Comparativo de Cotas na Importação */}
              {importBreakdown.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Comparativo com as Cotas Contratadas:
                  </p>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Setor</TableHead>
                          <TableHead className="text-xs">Tipo de Ingresso</TableHead>
                          <TableHead className="text-xs text-center">Na Planilha</TableHead>
                          <TableHead className="text-xs text-center">Cota Contratada</TableHead>
                          <TableHead className="text-xs text-right">Situação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importBreakdown.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-medium">{item.sector}</TableCell>
                            <TableCell className="text-xs">{getTicketBadge(item.ticket_type)}</TableCell>
                            <TableCell className="text-xs text-center font-bold tabular">
                              {item.foundInSheet}
                            </TableCell>
                            <TableCell className="text-xs text-center text-muted-foreground tabular">
                              {item.quota !== null ? item.quota : "Não definida"}
                            </TableCell>
                            <TableCell className="text-xs text-right">
                              {item.status === "ok" && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                  Dentro da cota
                                </Badge>
                              )}
                              {item.status === "exceeded" && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Excede cota (+{item.foundInSheet - (item.quota ?? 0)})
                                </Badge>
                              )}
                              {item.status === "uncontracted" && (
                                <Badge variant="outline" className="text-amber-600 border-amber-500/40 bg-amber-500/10 text-[10px]">
                                  Fora da cota
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Duplicates Alert */}
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

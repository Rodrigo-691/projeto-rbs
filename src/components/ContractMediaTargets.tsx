import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Globe,
  Loader2,
  Newspaper,
  Radio,
  Sliders,
  TrendingUp,
  Tv,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  countMediaByVehicle,
  parseMediaTargets,
  serializeMediaTargets,
  type MediaTargets,
} from "@/lib/media-targets";

interface ContractMediaTargetsProps {
  sponsorId: string;
  isAdmin: boolean;
  notes?: string | null;
  items: { channel: string | null; kind?: string }[];
}

export function ContractMediaTargets({
  sponsorId,
  isAdmin,
  notes,
  items,
}: ContractMediaTargetsProps) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { targets, cleanNotes } = parseMediaTargets(notes);
  const counts = countMediaByVehicle(items);

  const [form, setForm] = useState<MediaTargets>({
    minTotal: targets.minTotal,
    minTv: targets.minTv,
    minRadio: targets.minRadio,
    minDigital: targets.minDigital,
    minJornal: targets.minJornal,
  });

  // Atualiza form sempre que abrir o modal
  function openModal() {
    setForm({
      minTotal: targets.minTotal,
      minTv: targets.minTv,
      minRadio: targets.minRadio,
      minDigital: targets.minDigital,
      minJornal: targets.minJornal,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedNotes = serializeMediaTargets(cleanNotes, form);
      const { error } = await supabase
        .from("sponsors")
        .update({ notes: updatedNotes })
        .eq("id", sponsorId);

      if (error) throw error;

      toast.success("Metas contratuais salvas com sucesso!");
      qc.invalidateQueries({ queryKey: ["sponsors"] });
      qc.invalidateQueries({ queryKey: ["sponsor", sponsorId] });
      setModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar metas contratuais:", err);
      toast.error(err.message || "Não foi possível salvar as metas contratuais.");
    } finally {
      setSaving(false);
    }
  }

  const hasAnyTarget =
    targets.minTotal > 0 ||
    targets.minTv > 0 ||
    targets.minRadio > 0 ||
    targets.minDigital > 0 ||
    targets.minJornal > 0;

  const totalProgress =
    targets.minTotal > 0 ? Math.min(100, Math.round((counts.total / targets.minTotal) * 100)) : null;

  return (
    <Panel
      title="Metas de veiculação em contrato"
      description="Acompanhamento do volume mínimo de veiculações acordadas em contrato para esta marca."
      actions={
        isAdmin && (
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={openModal} className="gap-2 text-xs">
                <Sliders className="h-3.5 w-3.5" />
                Configurar metas contratuais
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sliders className="text-primary h-5 w-5" />
                  Metas contratuais de veiculação
                </DialogTitle>
                <DialogDescription>
                  Defina a quantidade mínima de veiculações garantidas no contrato desta marca.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSave} className="space-y-4 py-2">
                <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
                  <Label htmlFor="target-total" className="text-xs font-bold text-foreground">
                    Total mínimo de veiculações contratadas
                  </Label>
                  <Input
                    id="target-total"
                    type="number"
                    min="0"
                    value={form.minTotal || ""}
                    placeholder="Ex: 50"
                    onChange={(e) => setForm({ ...form, minTotal: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Alimenta o card na página inicial e o status geral de cumprimento.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="target-tv" className="flex items-center gap-1.5">
                      <Tv className="h-3.5 w-3.5 text-muted-foreground" />
                      Mínimo TV
                    </Label>
                    <Input
                      id="target-tv"
                      type="number"
                      min="0"
                      value={form.minTv || ""}
                      placeholder="0"
                      onChange={(e) => setForm({ ...form, minTv: Math.max(0, parseInt(e.target.value) || 0) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="target-radio" className="flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                      Mínimo Rádio
                    </Label>
                    <Input
                      id="target-radio"
                      type="number"
                      min="0"
                      value={form.minRadio || ""}
                      placeholder="0"
                      onChange={(e) => setForm({ ...form, minRadio: Math.max(0, parseInt(e.target.value) || 0) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="target-digital" className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      Mínimo Digital
                    </Label>
                    <Input
                      id="target-digital"
                      type="number"
                      min="0"
                      value={form.minDigital || ""}
                      placeholder="0"
                      onChange={(e) => setForm({ ...form, minDigital: Math.max(0, parseInt(e.target.value) || 0) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="target-jornal" className="flex items-center gap-1.5">
                      <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
                      Mínimo Jornal
                    </Label>
                    <Input
                      id="target-jornal"
                      type="number"
                      min="0"
                      value={form.minJornal || ""}
                      placeholder="0"
                      onChange={(e) => setForm({ ...form, minJornal: Math.max(0, parseInt(e.target.value) || 0) })}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar metas"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )
      }
    >
      {!hasAnyTarget ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          {isAdmin ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Nenhuma meta contratual definida ainda.</p>
              <p>Clique no botão acima "Configurar metas contratuais" para estipular a quantidade mínima de veiculações.</p>
            </div>
          ) : (
            <p>Metas contratuais de veiculação em alinhamento comercial com a equipe RBS.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Principal: Total Geral */}
          {targets.minTotal > 0 && (
            <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total de Veiculações Contratadas
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {counts.total} de {targets.minTotal} veiculações
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      counts.total >= targets.minTotal
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {counts.total >= targets.minTotal && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {totalProgress}% concluído
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {counts.total >= targets.minTotal
                      ? "Meta contratada superada!"
                      : `Faltam ${targets.minTotal - counts.total} veiculações`}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="bg-secondary h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    counts.total >= targets.minTotal ? "bg-emerald-500" : "bg-primary"
                  }`}
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Grid dos Tipos de Veículos */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            {/* TV */}
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[11px]">TV</span>
                <Tv className="h-3.5 w-3.5" />
              </div>
              <p className="text-base font-bold text-foreground">
                {counts.tv} {targets.minTv > 0 && <span className="text-muted-foreground font-normal text-xs">/ {targets.minTv} mín.</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {targets.minTv > 0
                  ? counts.tv >= targets.minTv
                    ? "Meta atingida"
                    : `Faltam ${targets.minTv - counts.tv}`
                  : `${counts.tv} veiculações`}
              </p>
            </div>

            {/* Rádio */}
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Rádio</span>
                <Radio className="h-3.5 w-3.5" />
              </div>
              <p className="text-base font-bold text-foreground">
                {counts.radio} {targets.minRadio > 0 && <span className="text-muted-foreground font-normal text-xs">/ {targets.minRadio} mín.</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {targets.minRadio > 0
                  ? counts.radio >= targets.minRadio
                    ? "Meta atingida"
                    : `Faltam ${targets.minRadio - counts.radio}`
                  : `${counts.radio} veiculações`}
              </p>
            </div>

            {/* Digital */}
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Digital</span>
                <Globe className="h-3.5 w-3.5" />
              </div>
              <p className="text-base font-bold text-foreground">
                {counts.digital} {targets.minDigital > 0 && <span className="text-muted-foreground font-normal text-xs">/ {targets.minDigital} mín.</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {targets.minDigital > 0
                  ? counts.digital >= targets.minDigital
                    ? "Meta atingida"
                    : `Faltam ${targets.minDigital - counts.digital}`
                  : `${counts.digital} veiculações`}
              </p>
            </div>

            {/* Jornal */}
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Jornal</span>
                <Newspaper className="h-3.5 w-3.5" />
              </div>
              <p className="text-base font-bold text-foreground">
                {counts.jornal} {targets.minJornal > 0 && <span className="text-muted-foreground font-normal text-xs">/ {targets.minJornal} mín.</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {targets.minJornal > 0
                  ? counts.jornal >= targets.minJornal
                    ? "Meta atingida"
                    : `Faltam ${targets.minJornal - counts.jornal}`
                  : `${counts.jornal} veiculações`}
              </p>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

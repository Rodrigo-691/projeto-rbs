import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileSection } from "@/components/FileSection";
import { TabGate } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/contrato")({
  head: () => portalHead("Contrato", "Signatários e documentos contratuais do patrocinador do Planeta Atlântida."),
  component: Contrato,
});

function Contrato() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [v, setV] = useState({ name: "", email: "", document: "" });

  const signers = useQuery({
    queryKey: ["signers", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_signers")
        .select("*")
        .eq("sponsor_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contract_signers").insert({
        sponsor_id: id,
        name: v.name.trim(),
        email: v.email.trim() || null,
        document: v.document.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setV({ name: "", email: "", document: "" });
      toast.success("Signatário adicionado");
      qc.invalidateQueries({ queryKey: ["signers", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (signerId: string) => {
      const { error } = await supabase.from("contract_signers").delete().eq("id", signerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Signatário removido");
      qc.invalidateQueries({ queryKey: ["signers", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <TabGate id={id} tab="contrato" title="Contrato" intro="Cadastre quem assina o contrato. A RBS sobe o contrato final assinado para histórico.">
      <div className="bg-card rounded-2xl border p-5">
        <h3 className="font-bold">Signatários</h3>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (v.name.trim()) add.mutate();
          }}
        >
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>E-mail</Label>
            <Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>CPF/CNPJ</Label>
            <Input value={v.document} onChange={(e) => setV({ ...v, document: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={add.isPending}>
              <UserPlus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </form>
        <ul className="mt-4 divide-y">
          {signers.data?.length === 0 && <li className="text-muted-foreground py-2 text-sm">Nenhum signatário cadastrado.</li>}
          {signers.data?.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-muted-foreground text-xs">
                  {[p.email, p.document].filter(Boolean).join(" · ") || "Sem contato"} · adicionado por {p.created_by_email} em {formatDate(p.created_at)}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(p.id)} aria-label="Remover">
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <FileSection sponsorId={id} tab="contrato" category="contrato_assinado" title="Contrato assinado" uploader="admin" />
    </TabGate>
  );
}

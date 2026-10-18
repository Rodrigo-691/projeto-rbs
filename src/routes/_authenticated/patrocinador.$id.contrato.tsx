import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FileSection } from "@/components/FileSection";
import { TabGate } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sponsorQuery } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/contrato")({
  component: Contrato,
});

function Contrato() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const s = useQuery(sponsorQuery(id));
  const [v, setV] = useState({ signer_name: "", signer_email: "", signer_document: "" });
  useEffect(() => {
    if (s.data) setV({ signer_name: s.data.signer_name ?? "", signer_email: s.data.signer_email ?? "", signer_document: s.data.signer_document ?? "" });
  }, [s.data]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sponsors").update(v).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados do signatário salvos");
      qc.invalidateQueries({ queryKey: ["sponsor", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <TabGate id={id} tab="contrato" title="Contrato" intro="Informe quem assina. A RBS sobe o contrato final assinado para histórico.">
      <form className="bg-card grid gap-3 rounded-2xl border p-5 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <div className="space-y-1"><Label>Nome do signatário</Label><Input value={v.signer_name} onChange={(e) => setV({ ...v, signer_name: e.target.value })} /></div>
        <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={v.signer_email} onChange={(e) => setV({ ...v, signer_email: e.target.value })} /></div>
        <div className="space-y-1"><Label>CPF/CNPJ</Label><Input value={v.signer_document} onChange={(e) => setV({ ...v, signer_document: e.target.value })} /></div>
        <Button type="submit" className="sm:col-span-3 sm:justify-self-end">Salvar</Button>
      </form>
      <FileSection sponsorId={id} tab="contrato" category="contrato_assinado" title="Contrato assinado" uploader="admin" />
    </TabGate>
  );
}

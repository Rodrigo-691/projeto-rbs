import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileSection } from "@/components/FileSection";
import { TabGate } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QUOTA_LABEL, sponsorQuery, useMe, type Quota } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/")({
  head: () => portalHead("Perfil do cliente", "Dados da marca, contatos e acessos do patrocinador do Planeta Atlântida."),
  component: Perfil,
});

function Perfil() {
  const { id } = Route.useParams();
  const me = useMe();
  const isAdmin = !!me.data?.isAdmin;
  return (
    <TabGate id={id} tab="perfil" title="Perfil do cliente" intro="Dados da marca, cota contratada e acessos liberados.">
      <ProfileForm id={id} isAdmin={isAdmin} />
      <Members id={id} isAdmin={isAdmin} />
      <FileSection sponsorId={id} tab="perfil" category="plano_comercial" title="Plano comercial" description="Tudo o que a marca comprou e vai receber." uploader="admin" />
      <FileSection sponsorId={id} tab="perfil" category="doc_ingressos" title="Documento para compra de ingressos" description="Comprovante para compra com valor de patrocinador." uploader="admin" />
    </TabGate>
  );
}

function ProfileForm({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const s = useQuery(sponsorQuery(id));
  const [form, setForm] = useState({ name: "", quota: "subcota" as Quota, cnpj: "", segment: "", contact_name: "", contact_phone: "", notes: "" });
  useEffect(() => {
    if (s.data)
      setForm({
        name: s.data.name,
        quota: s.data.quota,
        cnpj: s.data.cnpj ?? "",
        segment: s.data.segment ?? "",
        contact_name: s.data.contact_name ?? "",
        contact_phone: s.data.contact_phone ?? "",
        notes: s.data.notes ?? "",
      });
  }, [s.data]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sponsors").update(form).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil salvo");
      qc.invalidateQueries({ queryKey: ["sponsor", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const f = (k: keyof typeof form) => ({
    value: form[k],
    disabled: !isAdmin,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }),
  });
  return (
    <div className="bg-card grid gap-3 rounded-2xl border p-5 sm:grid-cols-2">
      <div className="space-y-1"><Label>Nome da marca</Label><Input {...f("name")} /></div>
      <div className="space-y-1">
        <Label>Cota</Label>
        {isAdmin ? (
          <select
            value={form.quota}
            onChange={(e) => setForm({ ...form, quota: e.target.value as Quota })}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            {Object.entries(QUOTA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        ) : (
          <Input value={QUOTA_LABEL[form.quota] ?? form.quota} disabled readOnly />
        )}

      </div>

      <div className="space-y-1"><Label>CNPJ</Label><Input {...f("cnpj")} placeholder="00.000.000/0000-00" /></div>
      <div className="space-y-1"><Label>Segmento</Label><Input {...f("segment")} /></div>
      <div className="space-y-1"><Label>Contato principal</Label><Input {...f("contact_name")} /></div>
      <div className="space-y-1"><Label>Telefone</Label><Input {...f("contact_phone")} /></div>
      <div className="space-y-1 sm:col-span-2"><Label>Observações</Label><Textarea {...f("notes")} /></div>
      {isAdmin && <Button className="sm:col-span-2 sm:justify-self-end" onClick={() => save.mutate()} disabled={save.isPending}>Salvar perfil</Button>}
    </div>
  );
}

function Members({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const q = useQuery({
    queryKey: ["members", id],
    queryFn: async () => (await supabase.from("sponsor_members").select("*").eq("sponsor_id", id).order("email")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sponsor_members").insert({ sponsor_id: id, email: email.toLowerCase().trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setEmail("");
      toast.success("E-mail liberado. A pessoa já pode criar a senha em “Primeiro acesso”.");
      qc.invalidateQueries({ queryKey: ["members", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  async function remove(mid: string) {
    await supabase.from("sponsor_members").delete().eq("id", mid);
    qc.invalidateQueries({ queryKey: ["members", id] });
  }
  return (
    <div className="bg-card rounded-2xl border p-5">
      <h3 className="font-bold">E-mails com acesso</h3>
      {isAdmin && (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <Input type="email" required placeholder="cliente@marca.com.br" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit">Liberar acesso</Button>
        </form>
      )}
      <ul className="mt-3 flex flex-wrap gap-2">
        {q.data?.length === 0 && <li className="text-muted-foreground text-sm">Nenhum e-mail liberado.</li>}
        {q.data?.map((m) => (
          <li key={m.id} className="bg-muted flex items-center gap-1 rounded-full px-3 py-1 text-sm">
            {m.email}
            {isAdmin && <button onClick={() => remove(m.id)} aria-label="Remover"><X className="h-3 w-3" /></button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

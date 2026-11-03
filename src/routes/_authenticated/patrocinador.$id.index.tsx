import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileSection } from "@/components/FileSection";
import { Panel, PanelList, PanelNote } from "@/components/Panel";
import { TabGate } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
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
    id: `profile-${k}`,
    value: form[k],
    disabled: !isAdmin,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }),
  });
  return (
    <Panel title="Dados cadastrais" description="Informações da marca e ponto focal da parceria.">
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (isAdmin) save.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Nome da marca</Label>
          <Input {...f("name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-quota">Cota</Label>
          {isAdmin ? (
            <NativeSelect
              id="profile-quota"
              value={form.quota}
              onChange={(e) => setForm({ ...form, quota: e.target.value as Quota })}
            >
              {Object.entries(QUOTA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <Input id="profile-quota" value={QUOTA_LABEL[form.quota] ?? form.quota} disabled readOnly />
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-cnpj">CNPJ</Label>
          <Input {...f("cnpj")} placeholder="00.000.000/0000-00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-segment">Segmento</Label>
          <Input {...f("segment")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-contact_name">Contato principal</Label>
          <Input {...f("contact_name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-contact_phone">Telefone</Label>
          <Input {...f("contact_phone")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profile-notes">Observações</Label>
          <Textarea {...f("notes")} />
        </div>
        {isAdmin && (
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Salvando..." : "Salvar perfil"}
            </Button>
          </div>
        )}
      </form>
    </Panel>
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
    <Panel
      flush
      title="E-mails com acesso"
      description="Pessoas autorizadas pela RBS a acessar os dados desta marca no portal."
    >
      {isAdmin && (
        <form
          className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <Input
            type="email"
            required
            placeholder="cliente@marca.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="sm:max-w-sm"
          />
          <Button type="submit" disabled={add.isPending}>
            <UserPlus className="h-4 w-4" /> Liberar acesso
          </Button>
        </form>
      )}
      {q.isPending ? (
        <PanelNote className="border-t">Carregando acessos...</PanelNote>
      ) : (q.data?.length ?? 0) === 0 ? (
        <PanelNote className="border-t">Nenhum e-mail liberado.</PanelNote>
      ) : (
        <PanelList>
          {q.data?.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
              <span className="truncate font-medium">{m.email}</span>
              {isAdmin && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="hover:text-destructive h-8 w-8"
                  onClick={() => remove(m.id)}
                  aria-label="Remover"
                  title="Remover acesso"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

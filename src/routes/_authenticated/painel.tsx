import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalHeader } from "@/components/PortalHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QUOTA_LABEL, useMe, type Quota } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Portal do Patrocinador" },
      { name: "description", content: "Patrocinadores do Planeta Atlântida." },
      { property: "og:title", content: "Painel — Portal do Patrocinador" },
      { property: "og:description", content: "Patrocinadores do Planeta Atlântida." },
    ],
  }),
  component: Painel,
});

function Painel() {
  const me = useMe();
  const sponsors = useQuery({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("id,name,quota,segment,sponsor_members(count),sponsor_files(count),media_items(count)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  if (me.isLoading || sponsors.isLoading) return <Shell><p className="text-muted-foreground">Carregando...</p></Shell>;

  if (!me.data?.isAdmin) {
    const list = sponsors.data ?? [];
    if (list.length === 1 && list[0]) return <Navigate to="/patrocinador/$id" params={{ id: list[0].id }} />;
    return (
      <Shell>
        {list.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center">
            <h2 className="text-xl font-bold">Seu acesso ainda não foi vinculado</h2>
            <p className="text-muted-foreground mt-2 text-sm">Peça ao time B2B da RBS para liberar seu e-mail na página da sua marca.</p>
          </div>
        ) : (
          <SponsorList list={list} />
        )}
      </Shell>
    );
  }

  const list = sponsors.data ?? [];
  const counts = (q: Quota) => list.filter((s) => s.quota === q).length;

  return (
    <Shell>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Patrocinadores" value={list.length} />
        <Stat label="Master" value={counts("master")} />
        <Stat label="Subcota G" value={counts("subcota_g")} />
        <Stat label="Subcota" value={counts("subcota")} />
      </div>
      <NewSponsor />
      <FilteredList list={list} />
      <AdminEmails />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PortalHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">{children}</main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card shadow-soft rounded-2xl border p-4">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="font-display mt-1 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

type Row = {
  id: string;
  name: string;
  quota: Quota;
  segment: string | null;
  sponsor_members: { count: number }[];
  sponsor_files: { count: number }[];
  media_items: { count: number }[];
};

function FilteredList({ list }: { list: Row[] }) {
  const [text, setText] = useState("");
  const [quota, setQuota] = useState<Quota | "all">("all");
  const t = text.trim().toLowerCase();
  const filtered = list.filter(
    (s) => (quota === "all" || s.quota === quota) && (!t || s.name.toLowerCase().includes(t)),
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Buscar patrocinador pelo nome" value={text} onChange={(e) => setText(e.target.value)} />
        <select
          value={quota}
          onChange={(e) => setQuota(e.target.value as Quota | "all")}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="all">Todas as cotas</option>
          {Object.entries(QUOTA_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground bg-card rounded-2xl border p-6 text-center text-sm">Nenhum patrocinador encontrado.</p>
      ) : (
        <SponsorList list={filtered} />
      )}
    </div>
  );
}

function SponsorList({ list }: { list: Row[] }) {
  return (
    <div className="bg-card overflow-hidden rounded-2xl border">
      <div className="border-b px-5 py-3 font-semibold">Patrocinadores</div>
      <ul className="divide-y">
        {list.map((s) => (
          <li key={s.id}>
            <Link to="/patrocinador/$id" params={{ id: s.id }} className="hover:bg-muted flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="text-muted-foreground text-xs">
                  {s.segment ?? "—"} · {s.sponsor_members[0]?.count ?? 0} acessos · {s.sponsor_files[0]?.count ?? 0} arquivos ·{" "}
                  {s.media_items[0]?.count ?? 0} itens de mídia
                </p>
              </div>
              <Badge variant={s.quota === "master" ? "default" : "secondary"}>{QUOTA_LABEL[s.quota]}</Badge>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewSponsor() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [quota, setQuota] = useState<Quota>("subcota");
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sponsors").insert({ name, quota });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      toast.success("Patrocinador criado");
      qc.invalidateQueries({ queryKey: ["sponsors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
      className="bg-card flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row"
    >
      <Input placeholder="Nome da marca" required value={name} onChange={(e) => setName(e.target.value)} />
      <select
        value={quota}
        onChange={(e) => setQuota(e.target.value as Quota)}
        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
      >
        {Object.entries(QUOTA_LABEL).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <Button type="submit" disabled={m.isPending}>
        <Plus className="h-4 w-4" /> Novo patrocinador
      </Button>
    </form>
  );
}

function AdminEmails() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const q = useQuery({
    queryKey: ["admin_emails"],
    queryFn: async () => (await supabase.from("admin_emails").select("*").order("email")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("admin_emails").insert({ email: email.toLowerCase().trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin_emails"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="bg-card rounded-2xl border p-5">
      <h3 className="font-bold">Equipe RBS (administradores)</h3>
      <p className="text-muted-foreground text-sm">E-mails aqui viram Admin RBS ao criar a conta.</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <Input type="email" required placeholder="nome@rbs.com.br" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit">Liberar</Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {q.data?.map((a) => (
          <Badge key={a.email} variant="outline">{a.email}</Badge>
        ))}
      </div>
    </div>
  );
}

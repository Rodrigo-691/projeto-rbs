import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, ChevronRight, Search, ShieldCheck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, NavGroup, navItemActiveClass, navItemClass } from "@/components/AppShell";
import { PageHeader, Panel, PanelList, PanelNote } from "@/components/Panel";
import { QuotaTag } from "@/components/QuotaTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { QUOTA_LABEL, useMe, type Quota } from "@/lib/portal";
import { NewSponsor } from "@/components/NewSponsor";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => portalHead("Painel", "Patrocinadores do Planeta Atlântida."),
  component: Painel,
});

type AdminSection = "sponsors" | "team";

type Row = {
  id: string;
  name: string;
  quota: Quota;
  segment: string | null;
  sponsor_members: { count: number }[];
  sponsor_files: { count: number }[];
  media_items: { count: number }[];
};

function Painel() {
  const me = useMe();
  const [section, setSection] = useState<AdminSection>("sponsors");
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

  if (me.isLoading || sponsors.isLoading) {
    return (
      <AppShell
        nav={
          <div className="space-y-2 px-3 pt-2" aria-hidden>
            <Skeleton className="bg-sidebar-accent h-8 w-full" />
            <Skeleton className="bg-sidebar-accent h-8 w-full" />
          </div>
        }
      >
        <div className="space-y-4" role="status" aria-label="Carregando painel">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!me.data?.isAdmin) {
    const list = sponsors.data ?? [];
    if (list.length === 1 && list[0]) return <Navigate to="/patrocinador/$id" params={{ id: list[0].id }} />;
    const sponsorNav = (
      <NavGroup label="Minhas marcas">
        {list.map((s) => (
          <Link key={s.id} to="/patrocinador/$id" params={{ id: s.id }} className={navItemClass}>
            <Building2 aria-hidden /> <span className="truncate">{s.name}</span>
          </Link>
        ))}
      </NavGroup>
    );
    return (
      <AppShell nav={sponsorNav} mobileTitle="Minhas marcas">
        <div className="space-y-5">
          <PageHeader
            title={list.length === 0 ? "Acesso pendente" : "Suas marcas"}
            description={
              list.length === 0
                ? "Seu e-mail ainda não está vinculado a nenhum patrocinador ativo."
                : "Selecione uma marca para acompanhar entregas, mídia e documentos."
            }
          />
          {list.length === 0 ? (
            <Panel title="Seu acesso ainda não foi vinculado">
              <p className="text-muted-foreground text-sm">
                Peça ao time B2B da RBS para liberar seu e-mail na página da sua marca. Assim que for liberado, atualize esta tela.
              </p>
            </Panel>
          ) : (
            <SponsorTable list={list} />
          )}
        </div>
      </AppShell>
    );
  }

  const list = sponsors.data ?? [];
  const counts = (q: Quota) => list.filter((s) => s.quota === q).length;

  const adminNav = (
    <NavGroup label="Gestão B2B">
      <button
        type="button"
        onClick={() => setSection("sponsors")}
        className={cn(navItemClass, "w-full cursor-pointer text-left", section === "sponsors" && navItemActiveClass)}
      >
        <Building2 aria-hidden />
        <span className="flex-1 truncate">Patrocinadores</span>
        <span className="text-sidebar-muted tabular text-xs">{list.length}</span>
      </button>
      <button
        type="button"
        onClick={() => setSection("team")}
        className={cn(navItemClass, "w-full cursor-pointer text-left", section === "team" && navItemActiveClass)}
      >
        <ShieldCheck aria-hidden />
        <span className="flex-1 truncate">Equipe RBS</span>
      </button>
    </NavGroup>
  );

  return (
    <AppShell nav={adminNav} mobileTitle={section === "sponsors" ? "Patrocinadores" : "Equipe RBS"}>
      {section === "sponsors" ? (
        <div className="space-y-6">
          <PageHeader
            title="Patrocinadores"
            description="Gerencie marcas parceiras, cotas comerciais, entregas de mídia e contratos do Planeta Atlântida."
            actions={<NewSponsor />}
          />

          <div className="bg-card grid grid-cols-2 divide-x divide-y rounded-lg border sm:grid-cols-4 sm:divide-y-0">
            <Stat label="Patrocinadores" value={list.length} />
            <Stat label="Master" value={counts("master")} highlight />
            <Stat label="Subcota G" value={counts("subcota_g")} />
            <Stat label="Subcota" value={counts("subcota")} />
          </div>

          <FilteredList list={list} />
        </div>
      ) : (
        <div className="space-y-6">
          <PageHeader
            title="Equipe RBS (administradores)"
            description="Controle os e-mails corporativos que recebem permissão de Admin RBS automaticamente ao criar conta."
          />
          <AdminEmails />
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className={cn("tabular mt-1 text-2xl font-semibold tracking-tight", highlight && "text-highlight-ink")}>{value}</p>
    </div>
  );
}

function FilteredList({ list }: { list: Row[] }) {
  const [text, setText] = useState("");
  const [quota, setQuota] = useState<Quota | "all">("all");
  const t = text.trim().toLowerCase();
  const filtered = list.filter(
    (s) => (quota === "all" || s.quota === quota) && (!t || s.name.toLowerCase().includes(t) || (s.segment ?? "").toLowerCase().includes(t)),
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar patrocinador pelo nome"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="pl-9"
          />
        </div>
        <NativeSelect
          aria-label="Filtrar por cota"
          value={quota}
          onChange={(e) => setQuota(e.target.value as Quota | "all")}
          className="sm:w-48"
        >
          <option value="all">Todas as cotas</option>
          {Object.entries(QUOTA_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
      </div>
      {filtered.length === 0 ? (
        <Panel>
          <p className="text-muted-foreground py-4 text-center text-sm">Nenhum patrocinador encontrado.</p>
        </Panel>
      ) : (
        <SponsorTable list={filtered} />
      )}
    </div>
  );
}

function SponsorTable({ list }: { list: Row[] }) {
  return (
    <Panel flush>
      <div className="text-muted-foreground hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_110px_84px_84px_84px_28px] items-center gap-3 border-b px-5 py-2.5 text-xs font-medium md:grid">
        <span>Patrocinadores</span>
        <span>Segmento</span>
        <span>Cota</span>
        <span className="text-right">Acessos</span>
        <span className="text-right">Arquivos</span>
        <span className="text-right">Mídias</span>
        <span aria-hidden />
      </div>
      <div className="border-b px-5 py-2.5 text-xs font-semibold md:hidden">Patrocinadores</div>
      <ul className="divide-y">
        {list.map((s) => {
          const members = s.sponsor_members[0]?.count ?? 0;
          const files = s.sponsor_files[0]?.count ?? 0;
          const media = s.media_items[0]?.count ?? 0;
          return (
            <li key={s.id}>
              <Link
                to="/patrocinador/$id"
                params={{ id: s.id }}
                className="hover:bg-muted/60 focus-visible:bg-muted/60 flex items-center gap-3 px-5 py-3.5 transition-colors focus-visible:outline-none md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_110px_84px_84px_84px_28px]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs md:hidden">
                    {s.segment || "—"} · {members} acessos · {files} arquivos · {media} itens de mídia
                  </p>
                </div>
                <span className="text-muted-foreground hidden truncate text-sm md:block">{s.segment || "—"}</span>
                <div className="shrink-0">
                  <QuotaTag quota={s.quota} />
                </div>
                <span className="tabular text-muted-foreground hidden text-right text-sm md:block">{members}</span>
                <span className="tabular text-muted-foreground hidden text-right text-sm md:block">{files}</span>
                <span className="tabular text-muted-foreground hidden text-right text-sm md:block">{media}</span>
                <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 justify-self-end" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
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
      toast.success("E-mail liberado para Admin RBS");
      qc.invalidateQueries({ queryKey: ["admin_emails"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Panel
      flush
      title="Equipe RBS (administradores)"
      description="E-mails aqui viram Admin RBS ao criar a conta."
    >
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
          placeholder="nome@rbs.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sm:max-w-sm"
        />
        <Button type="submit" disabled={add.isPending}>
          <UserPlus className="h-4 w-4" /> Liberar
        </Button>
      </form>
      {q.isPending ? (
        <PanelNote className="border-t">Carregando e-mails...</PanelNote>
      ) : (q.data?.length ?? 0) === 0 ? (
        <PanelNote className="border-t">Nenhum e-mail de administrador cadastrado.</PanelNote>
      ) : (
        <PanelList>
          {q.data?.map((a) => (
            <li key={a.email} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
              <span className="truncate font-medium">{a.email}</span>
              <span className="text-muted-foreground text-xs">Admin RBS</span>
            </li>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

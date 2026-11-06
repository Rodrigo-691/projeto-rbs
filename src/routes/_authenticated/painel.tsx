import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Megaphone,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, NavButton, NavGroup, NavItem } from "@/components/AppShell";
import { PageHeader, Panel, PanelList, PanelNote } from "@/components/Panel";
import { QuotaTag } from "@/components/QuotaTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, QUOTA_LABEL, useMe, type Quota } from "@/lib/portal";
import { auditDescription } from "@/lib/audit";
import { NewSponsor } from "@/components/NewSponsor";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => portalHead("Painel", "Patrocinadores do Planeta Atlântida."),
  component: Painel,
});

type AdminSection = "overview" | "sponsors" | "team";

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
  const [section, setSection] = useState<AdminSection>("overview");
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
          <NavItem
            key={s.id}
            to="/patrocinador/$id"
            params={{ id: s.id }}
            label={s.name}
            icon={Building2}
          />
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

  const adminNav = (
    <NavGroup label="Gestão B2B">
      <NavButton
        label="Início"
        icon={LayoutDashboard}
        isActive={section === "overview"}
        onClick={() => setSection("overview")}
      />
      <NavButton
        label="Patrocinadores"
        icon={Building2}
        isActive={section === "sponsors"}
        badge={<span className="text-sidebar-muted tabular text-xs">{list.length}</span>}
        onClick={() => setSection("sponsors")}
      />
      <NavButton
        label="Equipe RBS"
        icon={ShieldCheck}
        isActive={section === "team"}
        onClick={() => setSection("team")}
      />
    </NavGroup>
  );

  return (
    <AppShell
      nav={adminNav}
      mobileTitle={
        section === "overview"
          ? "Visão Geral"
          : section === "sponsors"
            ? "Patrocinadores"
            : "Equipe RBS"
      }
    >
      {section === "overview" ? (
        <AdminOverview list={list} onGoToSponsors={() => setSection("sponsors")} />
      ) : section === "sponsors" ? (
        <AdminSponsorsSection list={list} />
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

function AdminOverview({
  list,
  onGoToSponsors,
}: {
  list: Row[];
  onGoToSponsors: () => void;
}) {
  const auditQuery = useQuery({
    queryKey: ["admin_recent_audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const sponsorMap = new Map(list.map((s) => [s.id, s.name]));

  const counts = (q: Quota) => list.filter((s) => s.quota === q).length;
  const totalFiles = list.reduce((acc, s) => acc + (s.sponsor_files[0]?.count ?? 0), 0);
  const totalMedia = list.reduce((acc, s) => acc + (s.media_items[0]?.count ?? 0), 0);
  const sponsorsWithMembers = list.filter((s) => (s.sponsor_members[0]?.count ?? 0) > 0).length;
  const sponsorsWithoutMembers = list.filter((s) => (s.sponsor_members[0]?.count ?? 0) === 0);

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date("2027-01-29T18:00:00-03:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão Geral B2B"
        description="Painel de controle executivo do Planeta Atlântida 2027. Acompanhe parceiros comerciais, entregas e atividades recentes."
        actions={
          <div className="flex items-center gap-2">
            <NewSponsor />
            <Button variant="outline" onClick={onGoToSponsors}>
              Ver marcas <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Planeta Atlântida 2027
              </span>
              <span className="text-muted-foreground text-xs font-medium">
                · Operação B2B Ativa
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Gestão de Patrocínios & Entregas
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
              {list.length} marcas parceiras cadastradas. Acompanhe o cumprimento de prazos, arquivos de identidade visual e acessos das equipes.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border bg-background/80 p-3.5 backdrop-blur-sm">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                Contagem regressiva
              </p>
              <p className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                ~{daysRemaining} dias
              </p>
              <p className="text-muted-foreground text-[11px]">29 e 30 de Janeiro de 2027</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <span className="text-muted-foreground text-xs font-medium">Total de Patrocinadores</span>
          <p className="tabular mt-2 text-2xl font-bold tracking-tight text-foreground">{list.length}</p>
          <p className="text-muted-foreground mt-0.5 text-xs truncate">
            {counts("master")} Master · {counts("subcota_g")} G · {counts("subcota")} Sub
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <span className="text-muted-foreground text-xs font-medium">Marcas com Acesso</span>
          <p className="tabular mt-2 text-2xl font-bold tracking-tight text-foreground">
            {sponsorsWithMembers} <span className="text-muted-foreground text-base font-normal">/ {list.length}</span>
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {sponsorsWithoutMembers.length > 0 ? `${sponsorsWithoutMembers.length} sem membro convidado` : "Todas com acesso"}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <span className="text-muted-foreground text-xs font-medium">Arquivos no Portal</span>
          <p className="tabular mt-2 text-2xl font-bold tracking-tight text-foreground">{totalFiles}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">MIV, planos e contratos</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <span className="text-muted-foreground text-xs font-medium">Inserções de Mídia</span>
          <p className="tabular mt-2 text-2xl font-bold tracking-tight text-foreground">{totalMedia}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Veiculações registradas</p>
        </div>
      </div>

      {/* Attention / Pending Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Sponsor Onboarding */}
        <Panel
          flush
          title="Atenção B2B: Marcas sem membros"
          description="Patrocinadores que ainda não possuem e-mails de acesso convidados."
        >
          {sponsorsWithoutMembers.length === 0 ? (
            <div className="flex items-center gap-2.5 p-5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Excelente! Todas as marcas possuem pelo menos um membro com acesso.</span>
            </div>
          ) : (
            <ul className="divide-y border-t">
              {sponsorsWithoutMembers.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {s.segment || "Sem segmento"} · {QUOTA_LABEL[s.quota]}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 text-xs">
                    <Link to="/patrocinador/$id/perfil" params={{ id: s.id }}>
                      Convidar membros
                    </Link>
                  </Button>
                </li>
              ))}
              {sponsorsWithoutMembers.length > 5 && (
                <li className="px-5 py-2 text-center text-xs text-muted-foreground">
                  +{sponsorsWithoutMembers.length - 5} outras marcas sem membros
                </li>
              )}
            </ul>
          )}
        </Panel>

        {/* Recent Audit Activities */}
        <Panel
          flush
          title="Últimas movimentações no portal"
          description="Atividades e alterações registradas em tempo real."
        >
          {auditQuery.isPending ? (
            <p className="text-muted-foreground p-5 text-sm">Carregando atividades...</p>
          ) : (auditQuery.data?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground p-5 text-sm">Nenhuma atividade registrada.</p>
          ) : (
            <ul className="divide-y border-t">
              {auditQuery.data?.map((a) => {
                const sponsorName = a.sponsor_id ? sponsorMap.get(a.sponsor_id) : null;
                return (
                  <li key={a.id} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs">
                        <span className="font-semibold text-foreground">{a.actor_email ?? "Sistema"}</span>
                        {sponsorName && (
                          <span className="text-muted-foreground"> em <strong className="text-foreground">{sponsorName}</strong></span>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">{auditDescription(a)}</p>
                    </div>
                    <span className="tabular text-muted-foreground shrink-0 text-[11px]">
                      {formatDate(a.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function AdminSponsorsSection({ list }: { list: Row[] }) {
  const counts = (q: Quota) => list.filter((s) => s.quota === q).length;

  return (
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

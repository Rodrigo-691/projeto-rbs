import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  IdCard,
  Mail,
  Megaphone,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/Panel";
import { QuotaTag } from "@/components/QuotaTag";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QUOTA_LABEL, sponsorQuery, useMe, useSponsorTabAccess, type Quota } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/")({
  head: () => portalHead("Início", "Visão geral e status da parceria com o Planeta Atlântida."),
  component: SponsorOverview,
});

/** Festival target date: January 29, 2027 */
const FESTIVAL_DATE = new Date("2027-01-29T18:00:00-03:00");

function getDaysUntilFestival(): number {
  const now = new Date();
  const diff = FESTIVAL_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function SponsorOverview() {
  const { id } = Route.useParams();
  const me = useMe();
  const sponsor = useQuery(sponsorQuery(id));
  const access = useSponsorTabAccess(sponsor.data);

  // Load summary counts for files, media items and members
  const filesQuery = useQuery({
    queryKey: ["sponsor_overview_files", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsor_files")
        .select("id,tab_key,category,file_name,created_at")
        .eq("sponsor_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mediaQuery = useQuery({
    queryKey: ["sponsor_overview_media", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_items")
        .select("id,vehicle,reach")
        .eq("sponsor_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const membersQuery = useQuery({
    queryKey: ["sponsor_overview_members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsor_members")
        .select("email")
        .eq("sponsor_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (sponsor.isLoading) {
    return (
      <div className="space-y-5" role="status" aria-label="Carregando visão geral">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const s = sponsor.data;
  if (!s) return null;

  const files = filesQuery.data ?? [];
  const mediaItems = mediaQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const daysRemaining = getDaysUntilFestival();

  // Status checks for deliverables
  const profileComplete = Boolean(s.cnpj && (s.contact_name || s.contact_phone));
  const brandUploaded = files.some((f) => f.tab_key === "aplicacoes");
  const contractUploaded = files.some((f) => f.tab_key === "contrato");
  const hasMedia = mediaItems.length > 0 || files.some((f) => f.tab_key === "midia");
  const membersInvited = members.length > 0;

  const totalReach = mediaItems.reduce((acc, curr) => acc + (curr.reach ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Festival Badge */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Planeta Atlântida 2027
              </span>
              <QuotaTag quota={s.quota} />
              {s.segment && (
                <span className="text-muted-foreground text-xs font-medium">
                  · {s.segment}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Olá, {s.name}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bem-vindo ao Portal de Parceiros do Planeta Atlântida. Acompanhe aqui as entregas da sua cota, envie materiais de marca e consulte documentos da parceria.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border bg-background/80 p-4 backdrop-blur-sm">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                Faltam aproximadamente
              </p>
              <p className="text-lg font-bold tracking-tight text-foreground">
                {daysRemaining} dias
              </p>
              <p className="text-muted-foreground text-xs">29 e 30 Jan · Atlântida/RS</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Cota contratada</span>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-foreground">{QUOTA_LABEL[s.quota]}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Cota oficial do festival</p>
        </div>

        <div className="rounded-xl border bg-card p-4 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Arquivos no portal</span>
            <FileText className="text-muted-foreground h-4 w-4" />
          </div>
          <p className="tabular mt-2 text-xl font-bold tracking-tight text-foreground">{files.length}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">MIV, contratos e guias</p>
        </div>

        <div className="rounded-xl border bg-card p-4 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Inserções de mídia</span>
            <Megaphone className="text-muted-foreground h-4 w-4" />
          </div>
          <p className="tabular mt-2 text-xl font-bold tracking-tight text-foreground">{mediaItems.length}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {totalReach > 0 ? `${totalReach.toLocaleString("pt-BR")} de alcance` : "Em planejamento"}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Membros da marca</span>
            <Users className="text-muted-foreground h-4 w-4" />
          </div>
          <p className="tabular mt-2 text-xl font-bold tracking-tight text-foreground">{members.length}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Acessos com login liberado</p>
        </div>
      </div>

      {/* Deliverables Checklist / Onboarding */}
      <Panel
        title="Status das entregas da sua marca"
        description="Acompanhe o checklist de validações e envios necessários para a realização das ações no Planeta Atlântida."
      >
        <div className="divide-y border-t -mx-5 -mb-5">
          {/* Item 1: Dados do perfil */}
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {profileComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Clock className="text-amber-500 h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Dados cadastrais & Ponto focal</p>
                <p className="text-muted-foreground text-xs">
                  {profileComplete
                    ? `Ponto focal confirmado: ${s.contact_name || s.contact_phone || "Dados preenchidos"}`
                    : "Complete os dados de contato do responsável pela parceria."}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-center">
              <Link to="/patrocinador/$id/perfil" params={{ id }}>
                {profileComplete ? "Ver dados" : "Completar cadastro"}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Item 2: Aplicações de marca */}
          {access.allows("aplicacoes") && (
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {brandUploaded ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="text-amber-500 h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Manual de Marca & Logotipos</p>
                  <p className="text-muted-foreground text-xs">
                    {brandUploaded
                      ? "Arquivos e aplicações de marca enviados para validação técnica da RBS."
                      : "Envie sua logo vetorizada e MIV para aplicação nos materiais oficiais."}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-center">
                <Link to="/patrocinador/$id/aplicacoes" params={{ id }}>
                  {brandUploaded ? "Ver arquivos" : "Enviar marca"}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Item 3: Mídia e Conteúdo */}
          {access.allows("midia") && (
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {hasMedia ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Clock className="text-muted-foreground h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Mídia & Conteúdo publicitário</p>
                  <p className="text-muted-foreground text-xs">
                    {hasMedia
                      ? `${mediaItems.length} veiculação(ões) registradas e materiais em acompanhamento.`
                      : "Submeta spots, vídeos ou acompanhe as inserções da sua cota comercial."}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-center">
                <Link to="/patrocinador/$id/midia" params={{ id }}>
                  Acessar mídia
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Item 4: Contrato */}
          {access.allows("contrato") && (
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {contractUploaded ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Clock className="text-muted-foreground h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Documento contratual</p>
                  <p className="text-muted-foreground text-xs">
                    {contractUploaded
                      ? "Contrato e termos anexados no portal."
                      : "Consulte minutas, signatários e termos da parceria."}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-center">
                <Link to="/patrocinador/$id/contrato" params={{ id }}>
                  Ver contrato
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Item 5: Cortesias & Credenciamento */}
          {access.allows("cortesias") && (
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <Ticket className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Ingressos de cortesia & Credenciais</p>
                  <p className="text-muted-foreground text-xs">
                    Consulte os ingressos por setor e cadastre os membros da equipe que trabalharão no festival.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-center">
                <Link to="/patrocinador/$id/cortesias" params={{ id }}>
                  Ver cortesias
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </Panel>

      {/* Two Column Grid: Festival Timeline & Support Contact */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Production Timeline */}
        <Panel
          title="Cronograma do festival"
          description="Fique atento aos principais prazos de produção do Planeta 2027."
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Validação de Marcas e Ativações</p>
                <p className="text-muted-foreground text-xs">Dezembro / 2026 · Envio de manuais e projetos de estande</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Fechamento de Materiais de Mídia</p>
                <p className="text-muted-foreground text-xs">Primeira quinzena de Janeiro / 2027 · Spots e peças digitais</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Credenciamento de Equipe e Staff</p>
                <p className="text-muted-foreground text-xs">Até 20 de Janeiro / 2027 · Lista de prestadores e crachás</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ★
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Planeta Atlântida 2027</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">29 e 30 de Janeiro de 2027 · SABA Atlântida</p>
              </div>
            </div>
          </div>
        </Panel>

        {/* Support & Focal Point RBS */}
        <Panel
          title="Atendimento B2B RBS"
          description="Canais oficiais de suporte e contato comercial para sua marca."
        >
          <div className="space-y-4 pt-2">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Nossa equipe de Atendimento a Patrocinadores do Grupo RBS está à disposição para auxiliar em todas as etapas da sua cota comercial.
            </p>

            <div className="space-y-3 rounded-lg border bg-muted/30 p-3.5 text-xs">
              <div className="flex items-center gap-2.5">
                <Mail className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-muted-foreground">E-mail:</span>
                <a
                  href="mailto:comercial.planeta@gruporbs.com.br"
                  className="font-medium text-foreground hover:underline"
                >
                  comercial.planeta@gruporbs.com.br
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-muted-foreground">Telefone comercial:</span>
                <span className="font-medium text-foreground">(51) 3218-5000</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ShieldCheck className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-muted-foreground">Gestão:</span>
                <span className="font-medium text-foreground">Núcleo B2B Eventos RBS</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground">Precisa convidar colegas da sua equipe?</span>
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                <Link to="/patrocinador/$id/perfil" params={{ id }}>
                  Gerenciar acessos
                </Link>
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

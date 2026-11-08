import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  History,
  IdCard,
  LayoutDashboard,
  Megaphone,
  Palette,
  Ticket,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { AppShell, NavGroup, NavItem, useSidebar } from "@/components/AppShell";
import { Panel } from "@/components/Panel";
import { Skeleton } from "@/components/ui/skeleton";
import { QuotaTag } from "@/components/QuotaTag";
import { TABS, sponsorQuery, useMe, useSponsorTabAccess } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id")({
  head: () => portalHead("Minha parceria", "Acompanhe a parceria com o Planeta Atlântida."),
  component: SponsorLayout,
});

/** Presentation only: the menu itself (order, labels, routes) stays in TABS. */
const TAB_ICON: Record<(typeof TABS)[number]["key"], LucideIcon> = {
  perfil: Building2,
  aplicacoes: Palette,
  midia: Megaphone,
  cortesias: Ticket,
  credenciamento: IdCard,
  pesquisa: ClipboardList,
  contrato: FileText,
  faq: HelpCircle,
};

function SponsorNavContent({
  sponsor,
  isAdmin,
  access,
  id,
}: {
  sponsor: NonNullable<ReturnType<typeof useQuery<any>>["data"]>;
  isAdmin: boolean;
  access: ReturnType<typeof useSponsorTabAccess>;
  id: string;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <>
      {isAdmin && (
        <NavItem
          to="/painel"
          label="Todos os patrocinadores"
          icon={ArrowLeft}
        />
      )}

      {!isCollapsed ? (
        <div className="px-3 pb-1 pt-1">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug" title={sponsor.name}>
            {sponsor.name}
          </p>
          <div className="mt-2">
            <QuotaTag quota={sponsor.quota} onDark />
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-1">
          <QuotaTag quota={sponsor.quota} onDark className="px-1.5 text-[10px]" />
        </div>
      )}

      <NavGroup label="Visão geral">
        <NavItem
          to="/patrocinador/$id"
          params={{ id }}
          label="Início"
          icon={LayoutDashboard}
          exact
        />
      </NavGroup>

      <NavGroup label="Parceria">
        {TABS.map((t) => {
          if (!access.allows(t.key)) return null;
          const Icon = TAB_ICON[t.key];
          return (
            <NavItem
              key={t.key}
              to={t.to}
              params={{ id }}
              label={t.label}
              icon={Icon}
              exact
            />
          );
        })}
      </NavGroup>

      <NavGroup label="Resultados">
        <NavItem
          to="/patrocinador/$id/relatorio"
          params={{ id }}
          label="Relatório"
          icon={BarChart3}
        />
        <NavItem
          to="/patrocinador/$id/historico"
          params={{ id }}
          label="Histórico"
          icon={History}
        />
      </NavGroup>
    </>
  );
}

function SponsorLayout() {
  const { id } = Route.useParams();
  const me = useMe();
  const sponsor = useQuery(sponsorQuery(id));
  const access = useSponsorTabAccess(sponsor.data);
  const isAdmin = !!me.data?.isAdmin;

  if (sponsor.isLoading)
    return (
      <AppShell
        nav={
          <div className="space-y-2 px-3 pt-2" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="bg-sidebar-accent h-5" />
            ))}
          </div>
        }
      >
        <div className="space-y-4" role="status" aria-label="Carregando">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell>
    );

  if (!sponsor.data)
    return (
      <AppShell nav={isAdmin ? <NavItem to="/painel" label="Todos os patrocinadores" icon={ArrowLeft} /> : null}>
        <Panel title="Patrocinador não encontrado ou sem acesso">
          <p className="text-muted-foreground text-sm">
            Confira o link ou peça ao time B2B da RBS para liberar o seu e-mail nesta marca.
          </p>
        </Panel>
      </AppShell>
    );

  const s = sponsor.data;

  return (
    <AppShell
      nav={<SponsorNavContent sponsor={s} isAdmin={isAdmin} access={access} id={id} />}
      mobileTitle={s.name}
    >
      {isAdmin && (
        <nav aria-label="Trilha" className="text-muted-foreground mb-5 flex min-w-0 items-center gap-1.5 text-sm">
          <Link to="/painel" className="hover:text-foreground shrink-0 transition-colors">
            Patrocinadores
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground truncate font-medium">{s.name}</span>
        </nav>
      )}
      <div className="space-y-5">
        <Outlet />
      </div>
    </AppShell>
  );
}

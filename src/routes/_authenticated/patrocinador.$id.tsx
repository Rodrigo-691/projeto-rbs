import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, History, Lock } from "lucide-react";
import { PortalHeader } from "@/components/PortalHeader";
import { Badge } from "@/components/ui/badge";
import { QUOTA_LABEL, TABS, quotaModulesQuery, sponsorQuery, useMe } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/patrocinador/$id")({
  head: () => ({
    meta: [
      { title: "Minha parceria — Portal do Patrocinador" },
      { name: "description", content: "Acompanhe a parceria com o Planeta Atlântida." },
      { property: "og:title", content: "Minha parceria — Portal do Patrocinador" },
      { property: "og:description", content: "Acompanhe a parceria com o Planeta Atlântida." },
    ],
  }),
  component: SponsorLayout,
});

function SponsorLayout() {
  const { id } = Route.useParams();
  const me = useMe();
  const sponsor = useQuery(sponsorQuery(id));
  const mods = useQuery(quotaModulesQuery);

  if (sponsor.isLoading) return <><PortalHeader /><p className="text-muted-foreground p-8">Carregando...</p></>;
  if (!sponsor.data)
    return (
      <>
        <PortalHeader />
        <p className="p-8">Patrocinador não encontrado ou sem acesso.</p>
      </>
    );

  const s = sponsor.data;
  const allowed = (k: string) => mods.data?.some((m) => m.quota === s.quota && m.tab_key === k) ?? true;
  const linkCls =
    "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent";
  const activeCls = "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary";

  return (
    <div className="min-h-screen">
      <PortalHeader />
      <div className="mx-auto max-w-6xl px-4 py-6">
        {me.data?.isAdmin && (
          <Link to="/painel" className="text-muted-foreground mb-3 inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="h-4 w-4" /> Todos os patrocinadores
          </Link>
        )}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold">{s.name}</h1>
          <Badge>{QUOTA_LABEL[s.quota]}</Badge>
        </div>
        <div className="flex flex-col gap-6 md:flex-row">
          <nav className="bg-sidebar flex gap-1 overflow-x-auto rounded-2xl p-2 md:w-60 md:shrink-0 md:flex-col md:self-start">
            {TABS.map((t, i) => (
              <Link
                key={t.key}
                to={t.to}
                params={{ id }}
                activeOptions={{ exact: true }}
                className={linkCls}
                activeProps={{ className: activeCls }}
              >
                <span className="opacity-60">{i + 1}.</span> {t.label}
                {!allowed(t.key) && <Lock className="ml-auto h-3 w-3 opacity-60" />}
              </Link>
            ))}
            <div className="bg-sidebar-border mx-2 my-1 hidden h-px md:block" />
            <Link to="/patrocinador/$id/relatorio" params={{ id }} className={linkCls} activeProps={{ className: activeCls }}>
              <BarChart3 className="h-4 w-4" /> Relatório
            </Link>
            <Link to="/patrocinador/$id/historico" params={{ id }} className={linkCls} activeProps={{ className: activeCls }}>
              <History className="h-4 w-4" /> Histórico
            </Link>
          </nav>
          <section className="min-w-0 flex-1 space-y-4">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}

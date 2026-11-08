import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { Panel } from "@/components/Panel";
import { TabGate } from "@/components/TabGate";
import { Skeleton } from "@/components/ui/skeleton";
import { portalHead } from "@/lib/page-head";
import { sponsorQuery, useMe } from "@/lib/portal";
import { CourtesyManagement } from "@/components/CourtesyManagement";

const SECTORS = [
  { name: "Arena", detail: "Acesso geral à pista e palcos principais" },
  { name: "Camarote", detail: "Área elevada com vista privilegiada e serviços exclusivos" },
  { name: "Premium", detail: "Espaço reservado próximo ao palco principal" },
  { name: "Lounge", detail: "Ambiente de relacionamento e hospitalidade B2B" },
];

export const Route = createFileRoute("/_authenticated/patrocinador/$id/cortesias")({
  head: () => portalHead("Cortesias", "Cortesias do patrocinador por setor e dia do Planeta Atlântida."),
  component: CortesiasPage,
});

function CortesiasPage() {
  const { id } = Route.useParams();
  const me = useMe();
  const isAdmin = !!me.data?.isAdmin;
  const sponsor = useQuery(sponsorQuery(id));

  return (
    <TabGate
      id={id}
      tab="cortesias"
      title="Cortesias"
      intro="Gestão de ingressos nominais por setor e dia do festival (Passaporte, Sexta ou Sábado)."
    >
      {sponsor.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : !sponsor.data ? null : (
        <div className="space-y-6">
          <CourtesyManagement
            sponsorId={id}
            sponsor={sponsor.data}
            isAdmin={isAdmin}
          />

          <Panel
            flush
            title="Setores disponíveis no festival"
            description="Modalidades contempladas conforme o plano comercial da sua cota."
          >
            <div className="grid divide-y border-t sm:grid-cols-2 sm:divide-x">
              {SECTORS.map((s) => (
                <div key={s.name} className="flex items-start gap-3 px-5 py-4">
                  <span className="bg-brand-soft text-brand-ink grid h-8 w-8 shrink-0 place-items-center rounded-md">
                    <Ticket className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{s.name}</h3>
                    <p className="text-muted-foreground text-xs">{s.detail}</p>
                    <p className="text-muted-foreground mt-1 text-xs font-medium">
                      Passaporte · Sexta · Sábado
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </TabGate>
  );
}

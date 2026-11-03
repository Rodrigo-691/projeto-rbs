import { createFileRoute } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { Panel } from "@/components/Panel";
import { TabGate, Placeholder } from "@/components/TabGate";
import { portalHead } from "@/lib/page-head";

const SECTORS = [
  { name: "Arena", detail: "Acesso geral à pista e palcos principais" },
  { name: "Camarote", detail: "Área elevada com vista privilegiada e serviços exclusivos" },
  { name: "Premium", detail: "Espaço reservado próximo ao palco principal" },
  { name: "Lounge", detail: "Ambiente de relacionamento e hospitalidade B2B" },
];

export const Route = createFileRoute("/_authenticated/patrocinador/$id/cortesias")({
  head: () => portalHead("Cortesias", "Cortesias do patrocinador por setor e dia do Planeta Atlântida."),
  component: () => {
    const { id } = Route.useParams();
    return (
      <TabGate id={id} tab="cortesias" title="Cortesias" intro="Quantidade e tipo por setor: passaporte, sexta ou sábado.">
        <Panel flush title="Setores disponíveis no festival" description="Modalidades contempladas conforme o plano comercial da sua cota.">
          <div className="grid divide-y border-t sm:grid-cols-2 sm:divide-x">
            {SECTORS.map((s) => (
              <div key={s.name} className="flex items-start gap-3 px-5 py-4">
                <span className="bg-brand-soft text-brand-ink grid h-8 w-8 shrink-0 place-items-center rounded-md">
                  <Ticket className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{s.name}</h3>
                  <p className="text-muted-foreground text-xs">{s.detail}</p>
                  <p className="text-muted-foreground mt-1 text-xs font-medium">Passaporte · Sexta · Sábado</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Placeholder text="Em breve: a RBS informa as quantidades e a marca destina as cortesias por aqui." />
      </TabGate>
    );
  },
});

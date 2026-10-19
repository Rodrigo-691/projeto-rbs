import { createFileRoute } from "@tanstack/react-router";
import { TabGate, Placeholder } from "@/components/TabGate";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/cortesias")({
  head: () => portalHead("Cortesias", "Cortesias do patrocinador por setor e dia do Planeta Atlântida."),
  component: () => {
    const { id } = Route.useParams();
    return (
      <TabGate id={id} tab="cortesias" title="Cortesias" intro="Quantidade e tipo por setor: passaporte, sexta ou sábado.">
        <div className="grid gap-3 sm:grid-cols-2">
          {["Arena", "Camarote", "Premium", "Lounge"].map((b) => (
            <div key={b} className="bg-card rounded-2xl border p-5">
              <h3 className="font-bold">{b}</h3>
              <p className="text-muted-foreground text-sm">Passaporte · Sexta · Sábado</p>
            </div>
          ))}
        </div>
        <Placeholder text="Em breve: a RBS informa as quantidades e a marca destina as cortesias por aqui." />
      </TabGate>
    );
  },
});

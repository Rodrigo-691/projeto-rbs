import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Panel } from "@/components/Panel";
import { TabGate } from "@/components/TabGate";
import { Skeleton } from "@/components/ui/skeleton";
import { portalHead } from "@/lib/page-head";
import { sponsorQuery, useMe } from "@/lib/portal";
import { CourtesyManagement } from "@/components/CourtesyManagement";

const SECTORS = [
  {
    name: "Arena",
    badge: "Pista Principal",
    badgeStyle: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    tagline: "O coração e a energia do festival",
    detail: "Espaço principal com visão privilegiada dos palcos Palco Planeta e Palco Atlântida, acesso total à multidão na grade, roda-gigante, praças de alimentação e ativações de todos os patrocinadores.",
    features: [
      "Acesso completo ao Palco Planeta e Palco Atlântida",
      "Circulação livre por todas as ativações de marcas",
      "Praças de alimentação e serviços gerais",
    ],
    age: "Classificação indicativa: 14 anos",
    tickets: "Passaporte (2 dias) · Sábado · Domingo",
  },
  {
    name: "Camarote",
    badge: "Área Elevada",
    badgeStyle: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    tagline: "Conforto, vista panorâmica e livre circulação",
    detail: "Estrutura elevada com visão panorâmica privilegiada dos palcos, praça de alimentação com a tradicional Gourmet Street, lounges exclusivos de relacionamento, banheiros privativos e livre acesso à Arena.",
    features: [
      "Visão panorâmica elevada dos palcos",
      "Gourmet Street com gastronomia selecionada",
      "Livre circulação entre Camarote e Arena",
    ],
    age: "Classificação: 18 anos",
    tickets: "Passaporte (2 dias) · Sábado · Domingo",
  },
  {
    name: "Planeta Premium",
    badge: "Open Bar & Food",
    badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    tagline: "A experiência mais nobre e exclusiva",
    detail: "Espaço super exclusivo localizado dentro do Camarote. Oferece curadoria gastronômica Destemperados em regime Open Bar & Open Food contínuo, lounges de descanso e área VIP exclusiva colada à grade do Palco Planeta.",
    features: [
      "Open Bar premium e Open Food contínuo (Destemperados)",
      "Área VIP exclusiva em frente ao Palco Planeta",
      "Entrada expressa dedicada e banheiros privativos",
    ],
    age: "Classificação estrita: 18 anos completos",
    tickets: "Passaporte (2 dias) · Sábado · Domingo",
  },
  {
    name: "Rooftop Open Bar",
    badge: "Open Bar Elevado",
    badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    tagline: "Open bar com vista de cima na Arena",
    detail: "Estrutura elevada e coberta instalada dentro da Arena, com visão panorâmica privilegiada dos shows do Palco Planeta e serviço de Open Bar liberado de chopp e bebidas durante toda a noite.",
    features: [
      "Open Bar liberado durante todo o evento",
      "Área coberta com vista panorâmica do Palco Planeta",
      "Lounges confortáveis de descanso e convivência",
    ],
    age: "Classificação estrita: 18 anos completos",
    tickets: "Passaporte (2 dias) · Sábado · Domingo",
  },
  {
    name: "Terraço Atlântida",
    badge: "Open Bar Palco Atlântida",
    badgeStyle: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
    tagline: "Exclusividade VIP voltada ao Palco Atlântida",
    detail: "Espaço exclusivo em área coberta com vista de cima privilegiada voltada diretamente para o Palco Atlântida. Conta com serviço completo de Open Bar liberado e ambiente aconchegante de hospitalidade.",
    features: [
      "Open Bar liberado de chopp e bebidas selecionadas",
      "Visão elevada e privilegiada dos shows do Palco Atlântida",
      "Ambiente coberto com banheiros dedicados",
    ],
    age: "Classificação estrita: 18 anos completos",
    tickets: "Passaporte (2 dias) · Sábado · Domingo",
  },
  {
    name: "Planeta Club",
    badge: "Clube de Benefícios",
    badgeStyle: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    tagline: "Vantagens oficiais e acesso preferencial",
    detail: "Clube oficial de relacionamento do festival criado para aproximar e premiar parceiros e fãs. Proporciona entradas e filas preferenciais/antecipadas nos portões, press kit exclusivo de boas-vindas e acesso a experiências oficiais.",
    features: [
      "Entrada e filas prioritárias/antecipadas no festival",
      "Press kit oficial exclusivo de boas-vindas",
      "Acesso a experiências exclusivas e vantagens do clube",
    ],
    age: "Classificação conforme setor de acesso",
    tickets: "Passaporte (2 dias) · Sábado · Domingo",
  },
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
      intro="Gestão de ingressos nominais por setor e dia do festival (Passaporte, Sábado ou Domingo)."
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
            description="Conheça a infraestrutura, diferenciais e modalidades contempladas nos setores oficiais do Planeta Atlântida."
          >
            <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-3 border-t">
              {SECTORS.map((s, idx) => (
                <div
                  key={s.name}
                  className={`flex flex-col justify-between p-5 space-y-4 ${
                    idx > 0 && idx % 3 !== 0 ? "lg:border-l" : ""
                  } ${idx >= 3 ? "lg:border-t" : ""}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                        <p className="text-[11px] font-medium text-brand-ink dark:text-brand-soft">
                          {s.tagline}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${s.badgeStyle}`}>
                        {s.badge}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {s.detail}
                    </p>

                    <div className="pt-1 space-y-1.5">
                      {s.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-muted/50 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-medium text-foreground">Dias:</span>
                      <span>{s.tickets}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-medium text-foreground">Acesso:</span>
                      <span className="text-[10px]">{s.age}</span>
                    </div>
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

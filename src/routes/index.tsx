import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, CheckCircle2, FileText, ShieldCheck, Upload } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { PublicStyleSwitcher, usePublicVariant } from "@/components/PublicStyleSwitcher";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal do Patrocinador — Planeta Atlântida 2026" },
      { name: "description", content: "Contrato, mídia, cortesias, pesquisa e relatórios da sua parceria com o Planeta Atlântida em um só lugar." },
      { property: "og:title", content: "Portal do Patrocinador — Planeta Atlântida 2026" },
      { property: "og:description", content: "Toda a sua parceria com o Planeta Atlântida em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const modules = [
  {
    icon: FileText,
    title: "Tudo num lugar",
    area: "Plano comercial & Contrato",
    text: "Plano comercial, signatários e contrato assinado sem depender de e-mail ou WhatsApp.",
  },
  {
    icon: Upload,
    title: "Envio de materiais",
    area: "MIV, Logo & Conteúdo",
    text: "Suba logos, manual de identidade visual e peças de campanha direto para o time RBS.",
  },
  {
    icon: BarChart3,
    title: "Resultados",
    area: "Mídia & Pesquisa",
    text: "Mídia veiculada, alcance consolidado e pesquisa da ativação em gráficos prontos para baixar.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso exclusivo",
    area: "Segurança por cota",
    text: "Cada marca vê somente as próprias informações, com histórico auditado de cada entrega.",
  },
];

function Index() {
  const [variant, setVariant] = usePublicVariant();
  return (
    <>
      {variant === "expressive" ? <ExpressiveLanding /> : <SoberLanding />}
      <PublicStyleSwitcher variant={variant} onChange={setVariant} />
    </>
  );
}

function ExpressiveLanding() {
  return (
    <div className="bg-sidebar text-sidebar-foreground flex min-h-dvh flex-col">
      <header className="border-sidebar-border border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9" alt="Planeta Atlântida" />
            <span className="text-sm font-semibold tracking-tight">Planeta Atlântida · B2B</span>
          </div>
          <Button asChild size="sm" className="bg-brand text-sidebar hover:bg-brand/90 font-semibold">
            <Link to="/auth">Entrar no portal</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-sidebar-border border-b">
          <div className="mx-auto grid max-w-6xl lg:grid-cols-12">
            <div className="flex flex-col justify-between px-6 py-14 lg:col-span-7 lg:border-r lg:border-sidebar-border lg:py-20 lg:pr-12">
              <div className="flex items-center gap-4">
                <BrandMark className="h-16 w-16 rounded-xl bg-sidebar-accent p-2" alt="" />
                <div>
                  <p className="text-sun text-xs font-semibold">Edição 2026 · Grupo RBS</p>
                  <p className="text-sidebar-muted text-sm">Central de entregas e resultados das marcas parceiras</p>
                </div>
              </div>

              <div className="my-10">
                <h1 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
                  Portal do Patrocinador
                </h1>
                <p className="text-sidebar-muted mt-5 max-w-xl text-lg leading-relaxed">
                  Acompanhe toda a sua parceria, do contrato ao pós-evento, com entregas organizadas por cota comercial e histórico em tempo real.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="bg-brand text-sidebar hover:bg-brand/90 font-semibold">
                    <Link to="/auth">
                      Entrar no portal <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <span className="text-sidebar-muted text-xs">Acesso restrito a e-mails liberados pela RBS</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-sidebar-border pt-6 text-xs">
                <div>
                  <p className="text-sun font-semibold">Master · Subcotas</p>
                  <p className="text-sidebar-muted mt-0.5">Módulos liberados conforme plano</p>
                </div>
                <div>
                  <p className="text-brand font-semibold">Mídia & Ativação</p>
                  <p className="text-sidebar-muted mt-0.5">Envio de peças e comprovação</p>
                </div>
                <div>
                  <p className="text-highlight font-semibold">Pós-evento</p>
                  <p className="text-sidebar-muted mt-0.5">Relatório e pesquisa em PNG/PDF</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              <div className="bg-brand text-sidebar flex flex-col justify-between p-8">
                <p className="text-xs font-semibold">Operação centralizada</p>
                <div className="my-6">
                  <p className="font-display text-2xl font-extrabold leading-tight">
                    Do envio da marca ao relatório final de audiência.
                  </p>
                  <p className="mt-2 text-sm opacity-85">
                    MIV, logos, signatários, credenciamento Open Staff e resultados de pesquisa reunidos em uma única trilha por patrocinador.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                  <span className="bg-sidebar text-sidebar-foreground rounded-full px-2.5 py-1">Perfil & Cota</span>
                  <span className="bg-sidebar text-sidebar-foreground rounded-full px-2.5 py-1">Aplicações</span>
                  <span className="bg-sidebar text-sidebar-foreground rounded-full px-2.5 py-1">Mídia</span>
                  <span className="bg-sidebar text-sidebar-foreground rounded-full px-2.5 py-1">Pesquisa</span>
                </div>
              </div>

              <div className="bg-sun text-graphite flex flex-col justify-between p-8">
                <p className="text-xs font-semibold">Auditoria e transparência</p>
                <div className="my-4">
                  <p className="font-display text-2xl font-extrabold leading-tight">
                    Cada entrega registrada com data e responsável.
                  </p>
                  <p className="mt-2 text-sm opacity-80">
                    Equipe da marca e time B2B da RBS acompanham a mesma linha do tempo de arquivos e publicações.
                  </p>
                </div>
                <p className="text-xs font-semibold">Grupo RBS · Planejamento B2B</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background text-foreground">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                O que você resolve dentro do portal
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Todas as etapas operacionais da parceria organizadas em módulos diretos.
              </p>
            </div>
            <div className="bg-card mt-8 grid divide-y rounded-lg border sm:grid-cols-2 sm:divide-x">
              {modules.map((f) => (
                <div key={f.title} className="flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="bg-brand-soft text-brand-ink grid h-9 w-9 place-items-center rounded-md">
                        <f.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-muted-foreground text-xs font-medium">{f.area}</span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar border-sidebar-border text-sidebar-muted border-t py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 text-xs">
          <span>Grupo RBS · Planejamento B2B</span>
          <span>Planeta Atlântida 2026</span>
        </div>
      </footer>
    </div>
  );
}

function SoberLanding() {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <header className="bg-card border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9" alt="Planeta Atlântida" />
            <div className="leading-tight">
              <span className="block text-sm font-semibold">Portal do Patrocinador</span>
              <span className="text-muted-foreground block text-xs">Planeta Atlântida · Grupo RBS</span>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Entrar no portal</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="bg-brand h-2 w-2 rounded-full" aria-hidden />
                Planeta Atlântida · Gestão B2B de Parcerias
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
                Portal do Patrocinador
              </h1>
              <p className="text-muted-foreground mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
                Acompanhe toda a sua parceria, do contrato ao pós-evento. Centralize documentos, peças de marca, veiculações de mídia e relatórios da ativação em um único ambiente.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">
                    Entrar no portal <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <span className="text-muted-foreground text-xs">
                  Acesso exclusivo para marcas parceiras e equipe RBS
                </span>
              </div>
            </div>

            <div className="bg-card rounded-lg border lg:col-span-5">
              <div className="border-b px-5 py-3.5">
                <p className="text-sm font-semibold">Módulos da parceria</p>
                <p className="text-muted-foreground text-xs">Habilitados automaticamente conforme a cota contratada</p>
              </div>
              <ul className="divide-y text-sm">
                {[
                  ["Perfil do cliente", "Dados cadastrais, acessos e plano comercial"],
                  ["Aplicações de marca", "Envio de MIV, logo e fotos de comprovação"],
                  ["Mídia e conteúdo", "Envio de materiais e linha do tempo RBS"],
                  ["Cortesias e Credenciamento", "Setores do evento e integração Open Staff"],
                  ["Pesquisa e Relatório", "3 perguntas na pesquisa oficial e gráficos em PNG"],
                ].map(([title, desc]) => (
                  <li key={title} className="flex items-start gap-3 px-5 py-3">
                    <CheckCircle2 className="text-brand-ink mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-muted-foreground text-xs">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-card mt-12 grid divide-y rounded-lg border sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
            {modules.map((f) => (
              <div key={f.title} className="p-5">
                <span className="bg-brand-soft text-brand-ink grid h-8 w-8 place-items-center rounded-md">
                  <f.icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-5">
        <div className="text-muted-foreground mx-auto flex max-w-6xl items-center justify-between px-6 text-xs">
          <span>Grupo RBS · Planejamento B2B</span>
          <span>Planeta Atlântida</span>
        </div>
      </footer>
    </div>
  );
}

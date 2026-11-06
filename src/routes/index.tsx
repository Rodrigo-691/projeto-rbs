import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, CheckCircle2, FileText, ShieldCheck, Upload } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
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
          <div className="flex items-center gap-3">
            <ThemeToggle variant="pill" />
            <Button asChild size="sm">
              <Link to="/auth">Entrar no portal</Link>
            </Button>
          </div>
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

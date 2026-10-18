import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ShieldCheck, BarChart3, Upload } from "lucide-react";
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

const features = [
  { icon: FileText, title: "Tudo num lugar", text: "Plano comercial, contrato e materiais sem depender de e-mail ou WhatsApp." },
  { icon: Upload, title: "Envio de materiais", text: "Suba logos, MIV e conteúdos direto para o time RBS." },
  { icon: BarChart3, title: "Resultados", text: "Mídia veiculada e pesquisa da ativação em gráficos prontos." },
  { icon: ShieldCheck, title: "Acesso exclusivo", text: "Cada marca vê somente as próprias informações." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <section className="bg-ocean-gradient text-ocean-foreground relative overflow-hidden">
        <div className="bg-sunset absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-90 blur-[2px]" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
          <img src={brandIcon.url} alt="Planeta Atlântida" className="h-16 w-16 rounded-2xl" />
          <p className="text-sun mt-5 text-sm font-semibold uppercase tracking-[0.2em]">Planeta Atlântida · 30 anos</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight md:text-6xl">Portal do Patrocinador</h1>
          <p className="mt-5 max-w-xl text-lg opacity-85">
            Acompanhe toda a sua parceria, do contrato ao pós-evento.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Entrar no portal</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-6 py-14 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="bg-card shadow-soft rounded-2xl border p-6">
            <f.icon className="text-primary h-6 w-6" />
            <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{f.text}</p>
          </div>
        ))}
      </section>
      <footer className="text-muted-foreground pb-10 text-center text-xs">Grupo RBS · Planejamento B2B</footer>
    </div>
  );
}

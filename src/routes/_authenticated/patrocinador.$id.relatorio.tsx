import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { toPng } from "html-to-image";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { sponsorQuery } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/relatorio")({
  head: () => portalHead("Relatório da parceria", "Resultados de mídia e entregas da parceria com o Planeta Atlântida."),
  component: Relatorio,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Relatorio() {
  const { id } = Route.useParams();
  const sponsor = useQuery(sponsorQuery(id));
  const data = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const [media, survey, files] = await Promise.all([
        supabase.from("media_items").select("kind,channel,reach").eq("sponsor_id", id),
        supabase.from("survey_results").select("question,answer,percent").eq("sponsor_id", id),
        supabase.from("sponsor_files").select("category").eq("sponsor_id", id),
      ]);
      return { media: media.data ?? [], survey: survey.data ?? [], files: files.data ?? [] };
    },
  });

  const d = data.data;
  const byChannel = Object.values(
    (d?.media ?? [])
      .filter((m) => m.kind !== "material")
      .reduce<Record<string, { canal: string; alcance: number }>>((acc, m) => {
        const k = m.channel ?? "Outros";
        acc[k] ??= { canal: k, alcance: 0 };
        acc[k].alcance += m.reach ?? 0;
        return acc;
      }, {}),
  );
  const totalReach = byChannel.reduce((a, b) => a + b.alcance, 0);
  const deliveries = [
    { name: "Materiais enviados", value: d?.media.filter((m) => m.kind === "material").length ?? 0 },
    { name: "Veiculações", value: d?.media.filter((m) => m.kind === "report").length ?? 0 },
    { name: "Posts", value: d?.media.filter((m) => m.kind === "post_link").length ?? 0 },
    { name: "Fotos de comprovação", value: d?.files.filter((f) => f.category === "fotos_comprovacao").length ?? 0 },
  ];
  const questions = Object.entries(
    (d?.survey ?? []).reduce<Record<string, { name: string; value: number }[]>>((acc, r) => {
      (acc[r.question] ??= []).push({ name: r.answer, value: Number(r.percent) });
      return acc;
    }, {}),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold">Relatório da parceria</h2>
          <p className="text-muted-foreground text-sm">Gráficos gerados automaticamente. Baixe cada um em imagem para a apresentação.</p>
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Salvar em PDF
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Alcance total de mídia" value={totalReach.toLocaleString("pt-BR")} />
        <Kpi label="Itens de mídia" value={String(d?.media.length ?? 0)} />
        <Kpi label="Arquivos no portal" value={String(d?.files.length ?? 0)} />
      </div>
      <ChartCard title={`Alcance por canal — ${sponsor.data?.name ?? ""}`}>
        {byChannel.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byChannel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="canal" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} />
              <Bar dataKey="alcance" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <ChartCard title="Entregas registradas">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={deliveries} layout="vertical" margin={{ left: 40 }}>
            <XAxis type="number" allowDecimals={false} fontSize={12} />
            <YAxis type="category" dataKey="name" width={130} fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      {questions.length === 0 ? (
        <ChartCard title="Pesquisa da ativação"><Empty /></ChartCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {questions.map(([q, rows]) => (
            <ChartCard key={q} title={q}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={rows} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label={(e) => `${e.value}%`}>
                    {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          ))}
        </div>
      )}
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card shadow-soft rounded-2xl border p-4">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="font-display mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function Empty() {
  return <p className="text-muted-foreground py-8 text-center text-sm">Sem dados ainda.</p>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  async function save() {
    if (!ref.current) return;
    const url = await toPng(ref.current, { pixelRatio: 2, backgroundColor: getComputedStyle(document.body).backgroundColor });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^\w]+/g, "_")}.png`;
    a.click();
  }
  return (
    <div className="bg-card rounded-2xl border p-5">
      <div ref={ref} className="bg-card">
        <h3 className="mb-3 font-bold">{title}</h3>
        {children}
      </div>
      <div className="mt-2 flex justify-end print:hidden">
        <Button size="sm" variant="ghost" onClick={save}><Download className="h-4 w-4" /> Baixar PNG</Button>
      </div>
    </div>
  );
}

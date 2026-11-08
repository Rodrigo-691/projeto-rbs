import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Calendar, Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { sponsorQuery } from "@/lib/portal";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/relatorio")({
  head: () => portalHead("Relatório da parceria", "Resultados de mídia e métricas da parceria com o Planeta Atlântida."),
  component: Relatorio,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  const d = new Date(year, month - 1, 1);
  const formatted = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function Relatorio() {
  const { id } = Route.useParams();
  const sponsor = useQuery(sponsorQuery(id));
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const data = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const [media, survey, files] = await Promise.all([
        supabase.from("media_items").select("kind,channel,reach,created_at").eq("sponsor_id", id),
        supabase.from("survey_results").select("question,answer,percent").eq("sponsor_id", id),
        supabase.from("sponsor_files").select("category").eq("sponsor_id", id),
      ]);
      return { media: media.data ?? [], survey: survey.data ?? [], files: files.data ?? [] };
    },
  });

  const d = data.data;

  // Extrai todos os meses distintos disponíveis nas veiculações
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    (d?.media ?? []).forEach((m) => {
      if (m.created_at) {
        set.add(m.created_at.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [d?.media]);

  // Filtra as veiculações conforme o mês selecionado
  const filteredMedia = useMemo(() => {
    return (d?.media ?? []).filter((m) => {
      if (m.kind === "material") return false;
      if (selectedMonth === "all") return true;
      return m.created_at && m.created_at.slice(0, 7) === selectedMonth;
    });
  }, [d?.media, selectedMonth]);

  const byChannel = useMemo(() => {
    return Object.values(
      filteredMedia.reduce<Record<string, { canal: string; alcance: number }>>((acc, m) => {
        const k = m.channel ?? "Outros";
        acc[k] ??= { canal: k, alcance: 0 };
        acc[k].alcance += m.reach ?? 0;
        return acc;
      }, {})
    );
  }, [filteredMedia]);

  const totalAllTimeReach = (d?.media ?? [])
    .filter((m) => m.kind !== "material")
    .reduce((acc, m) => acc + (m.reach ?? 0), 0);

  const selectedPeriodReach = byChannel.reduce((a, b) => a + b.alcance, 0);

  const questions = Object.entries(
    (d?.survey ?? []).reduce<Record<string, { name: string; value: number }[]>>((acc, r) => {
      (acc[r.question] ??= []).push({ name: r.answer, value: Number(r.percent) });
      return acc;
    }, {})
  );

  return (
    <>
      <PageHeader
        title="Relatório da parceria"
        description="Gráficos gerados automaticamente. Baixe cada um em imagem para a apresentação."
        className="print:hidden"
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Salvar em PDF
          </Button>
        }
      />

      <div className="bg-card grid divide-y rounded-lg border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Kpi label="Alcance total acumulado" value={totalAllTimeReach.toLocaleString("pt-BR")} />
        <Kpi label="Itens de mídia" value={String(d?.media.length ?? 0)} />
        <Kpi label="Arquivos no portal" value={String(d?.files.length ?? 0)} />
      </div>

      <ChartCard
        title={`Alcance por canal — ${sponsor.data?.name ?? ""}`}
        description={
          selectedMonth === "all"
            ? `Alcance acumulado em todos os meses · Total: ${selectedPeriodReach.toLocaleString("pt-BR")}`
            : `Período: ${formatMonthLabel(selectedMonth)} · Total: ${selectedPeriodReach.toLocaleString("pt-BR")}`
        }
        actions={
          <div className="flex items-center gap-1.5 print:hidden">
            <Calendar className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            <NativeSelect
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-44 text-xs h-8"
              aria-label="Filtrar alcance por mês"
            >
              <option value="all">Todos os meses</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </NativeSelect>
          </div>
        }
      >
        {byChannel.length === 0 ? (
          <Empty
            message={
              selectedMonth === "all"
                ? "Sem dados de alcance registrados ainda."
                : `Nenhuma veiculação registrada no mês de ${formatMonthLabel(selectedMonth)}.`
            }
          />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byChannel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="canal" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} />
              <Bar dataKey="alcance" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {questions.length === 0 ? (
        <ChartCard title="Pesquisa da ativação">
          <Empty />
        </ChartCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {questions.map(([q, rows]) => (
            <ChartCard key={q} title={q}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={rows} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label={(e) => `${e.value}%`}>
                    {rows.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
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
    <div className="px-5 py-4">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="tabular mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Empty({ message = "Sem dados ainda." }: { message?: string }) {
  return <p className="text-muted-foreground py-8 text-center text-sm">{message}</p>;
}

function ChartCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
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
    <Panel
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Button size="sm" variant="ghost" className="print:hidden" onClick={save}>
            <Download className="h-4 w-4" /> Baixar PNG
          </Button>
        </div>
      }
    >
      <div ref={ref} className="bg-card">
        <p className="sr-only">{title}</p>
        {children}
      </div>
    </Panel>
  );
}

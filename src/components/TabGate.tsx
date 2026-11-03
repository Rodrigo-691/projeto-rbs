import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { QUOTA_LABEL, sponsorQuery, useSponsorTabAccess } from "@/lib/portal";
import { PageHeader } from "@/components/Panel";
import { Skeleton } from "@/components/ui/skeleton";

export function TabGate({ id, tab, title, intro, actions, children }: { id: string; tab: string; title: string; intro?: string; actions?: ReactNode; children: ReactNode }) {
  const sponsor = useQuery(sponsorQuery(id));
  const access = useSponsorTabAccess(sponsor.data);
  const allowed = access.allows(tab);
  return (
    <>
      <PageHeader title={title} description={intro && allowed ? intro : undefined} actions={allowed ? actions : undefined} className="pb-1" />
      {sponsor.isPending || access.isLoading ? (
        <div className="space-y-3" role="status" aria-label="Carregando">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : sponsor.isError || access.isError ? (
        <p className="bg-destructive/5 text-destructive rounded-lg px-5 py-4 text-sm" role="alert">Não foi possível verificar seu acesso. Tente novamente.</p>
      ) : allowed ? (
        children
      ) : (
        <div className="bg-card flex items-start gap-4 rounded-lg border px-5 py-5">
          <span className="bg-secondary text-muted-foreground grid h-9 w-9 shrink-0 place-items-center rounded-full">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
          <div className="text-sm">
            <p className="font-medium">Este módulo não faz parte da cota {sponsor.data ? QUOTA_LABEL[sponsor.data.quota] : ""}.</p>
            <p className="text-muted-foreground mt-0.5">Fale com o time B2B da RBS para saber como incluí-lo na sua parceria.</p>
          </div>
        </div>
      )}
    </>
  );
}

export function Placeholder({ text }: { text: string }) {
  return <div className="bg-secondary/70 text-muted-foreground rounded-lg px-5 py-4 text-sm">{text}</div>;
}

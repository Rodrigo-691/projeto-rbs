import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { QUOTA_LABEL, sponsorQuery, useSponsorTabAccess } from "@/lib/portal";

export function TabGate({ id, tab, title, intro, children }: { id: string; tab: string; title: string; intro?: string; children: ReactNode }) {
  const sponsor = useQuery(sponsorQuery(id));
  const access = useSponsorTabAccess(sponsor.data);
  return (
    <>
      <div>
        <h2 className="text-2xl font-extrabold">{title}</h2>
        {intro && access.allows(tab) && <p className="text-muted-foreground mt-1 text-sm">{intro}</p>}
      </div>
      {sponsor.isPending || access.isLoading ? (
        <p className="text-muted-foreground py-4 text-sm" role="status">Carregando...</p>
      ) : sponsor.isError || access.isError ? (
        <p className="text-destructive py-4 text-sm" role="alert">Não foi possível verificar seu acesso. Tente novamente.</p>
      ) : access.allows(tab) ? (
        children
      ) : (
        <div className="bg-muted flex items-center gap-3 rounded-2xl p-6 text-sm">
          <Lock className="h-5 w-5" />
          Este módulo não faz parte da cota {sponsor.data ? QUOTA_LABEL[sponsor.data.quota] : ""}. Fale com o time B2B para saber mais.
        </div>
      )}
    </>
  );
}

export function Placeholder({ text }: { text: string }) {
  return <div className="text-muted-foreground rounded-2xl border border-dashed p-6 text-sm">{text}</div>;
}

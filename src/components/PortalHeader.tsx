import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/portal";
import brandIcon from "@/assets/planeta-atlantida-icon.png.asset.json";

export function PortalHeader() {
  const me = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="bg-ocean-gradient text-ocean-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/painel" className="flex items-center gap-3">
          <img src={brandIcon.url} alt="" className="h-9 w-9 rounded-xl" />
          <span className="font-display text-base font-bold leading-tight">
            Portal do Patrocinador
            <span className="text-sun block text-[10px] font-semibold uppercase tracking-widest">Planeta Atlântida</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="hidden opacity-80 sm:inline">
            {me.data?.email} {me.data?.isAdmin ? "· Admin RBS" : ""}
          </span>
          <Button size="sm" variant="secondary" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </div>
    </header>
  );
}

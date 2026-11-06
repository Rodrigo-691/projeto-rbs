import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/portal";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Wordmark shown at the top of the signed-in sidebar and the mobile bar. */
export function PortalBrand({ compact = false }: { compact?: boolean }) {
  const brand = (
    <Link
      to="/painel"
      className="focus-visible:ring-sidebar-ring flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2"
    >
      <BrandMark variant="white-text" className={compact ? "h-8 w-8" : "h-9 w-9"} />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[15px] font-semibold">Portal do Patrocinador</span>
          <span className="text-sidebar-muted block truncate text-xs">Planeta Atlântida</span>
        </span>
      )}
    </Link>
  );

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{brand}</TooltipTrigger>
        <TooltipContent side="right" className="bg-sidebar border-sidebar-border text-sidebar-foreground border text-xs">
          Portal do Patrocinador · Planeta Atlântida
        </TooltipContent>
      </Tooltip>
    );
  }

  return brand;
}

/** Signed-in identity, theme toggle and sign-out, docked at the foot of the sidebar. */
export function PortalAccount({ compact = false }: { compact?: boolean }) {
  const me = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const email = me.data?.email ?? "";

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-hidden
              className="bg-sidebar-accent text-sidebar-foreground grid h-8 w-8 shrink-0 cursor-default place-items-center rounded-full text-[13px] font-semibold uppercase"
            >
              {email.slice(0, 1) || "·"}
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-sidebar border-sidebar-border text-sidebar-foreground border text-xs">
            <p className="font-semibold">{email}</p>
            <p className="text-sidebar-muted">{me.data?.isAdmin ? "Admin RBS" : "Patrocinador"}</p>
          </TooltipContent>
        </Tooltip>

        <ThemeToggle />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sair"
              className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-sidebar border-sidebar-border text-sidebar-foreground border text-xs">
            Sair
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="bg-sidebar-accent text-sidebar-foreground grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold uppercase"
      >
        {email.slice(0, 1) || "·"}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-medium" title={email}>{email || "Carregando..."}</p>
        <p className="text-sidebar-muted text-xs">{me.data?.isAdmin ? "Admin RBS" : "Patrocinador"}</p>
      </div>
      <ThemeToggle />
      <button
        type="button"
        onClick={signOut}
        aria-label="Sair"
        title="Sair"
        className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

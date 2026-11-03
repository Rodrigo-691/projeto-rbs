import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeToggle";

export type PublicVariant = "expressive" | "sober";

const STORAGE_KEY = "pa_portal_public_variant";
const EVENT_NAME = "pa:public-variant-change";

export function usePublicVariant(): [PublicVariant, (v: PublicVariant) => void] {
  const [variant, setVariantState] = useState<PublicVariant>("expressive");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("estilo");
      if (fromUrl === "expressivo") {
        setVariantState("expressive");
        return;
      }
      if (fromUrl === "sobrio") {
        setVariantState("sober");
        return;
      }
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "expressive" || saved === "sober") {
        setVariantState(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    function onCustom(e: Event) {
      const detail = (e as CustomEvent<PublicVariant>).detail;
      if (detail === "expressive" || detail === "sober") {
        setVariantState(detail);
      }
    }
    window.addEventListener(EVENT_NAME, onCustom);
    return () => window.removeEventListener(EVENT_NAME, onCustom);
  }, []);

  function setVariant(next: PublicVariant) {
    setVariantState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent<PublicVariant>(EVENT_NAME, { detail: next }));
    } catch {
      // ignore
    }
  }

  return [variant, setVariant];
}

/** Floating pill bar at the bottom right with style switcher and theme toggle button. */
export function PublicStyleSwitcher({
  variant,
  onChange,
}: {
  variant: PublicVariant;
  onChange: (v: PublicVariant) => void;
}) {
  const [theme, , toggleTheme] = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      role="group"
      aria-label="Controles de estilo e tema visual"
      className="bg-sidebar text-sidebar-foreground border-sidebar-border fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-full border p-1 text-xs shadow-[0_12px_32px_-8px_rgb(20_24_28/0.4)] print:hidden"
    >
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
        title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
        className="flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1.5 font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        {isDark ? <Sun className="h-3.5 w-3.5 text-sun" /> : <Moon className="h-3.5 w-3.5" />}
        <span>{isDark ? "Escuro" : "Claro"}</span>
      </button>

      <span className="bg-sidebar-border mx-1 h-3.5 w-px" aria-hidden />

      <button
        type="button"
        onClick={() => onChange("expressive")}
        aria-pressed={variant === "expressive"}
        className={cn(
          "cursor-pointer rounded-full px-3 py-1.5 font-medium transition-colors",
          variant === "expressive"
            ? "bg-brand text-sidebar font-semibold"
            : "text-sidebar-muted hover:text-sidebar-foreground",
        )}
      >
        Festival
      </button>
      <button
        type="button"
        onClick={() => onChange("sober")}
        aria-pressed={variant === "sober"}
        className={cn(
          "cursor-pointer rounded-full px-3 py-1.5 font-medium transition-colors",
          variant === "sober"
            ? "bg-card text-foreground font-semibold"
            : "text-sidebar-muted hover:text-sidebar-foreground",
        )}
      >
        B2B
      </button>
    </div>
  );
}

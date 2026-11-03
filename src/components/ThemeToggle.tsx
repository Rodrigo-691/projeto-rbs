import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "pa_portal_theme";
const THEME_EVENT_NAME = "pa:theme-change";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // ignore
  }
  return "dark"; // Default dark per user request
}

export function useTheme(): [Theme, (theme: Theme) => void, () => void] {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const current = getInitialTheme();
    setThemeState(current);
    applyThemeClass(current);

    function onThemeChange(e: Event) {
      const detail = (e as CustomEvent<Theme>).detail;
      if (detail === "light" || detail === "dark") {
        setThemeState(detail);
        applyThemeClass(detail);
      }
    }

    window.addEventListener(THEME_EVENT_NAME, onThemeChange);
    return () => window.removeEventListener(THEME_EVENT_NAME, onThemeChange);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    applyThemeClass(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT_NAME, { detail: next }));
    } catch {
      // ignore
    }
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return [theme, setTheme, toggleTheme];
}

function applyThemeClass(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Compact theme toggle button with sun/moon icons.
 */
export function ThemeToggle({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "pill";
}) {
  const [theme, , toggleTheme] = useTheme();
  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
        title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
          isDark
            ? "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          className,
        )}
      >
        {isDark ? <Sun className="h-3.5 w-3.5 text-sun" /> : <Moon className="h-3.5 w-3.5" />}
        <span>{isDark ? "Claro" : "Escuro"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className={cn(
        "grid h-8 w-8 cursor-pointer place-items-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4 text-sun" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

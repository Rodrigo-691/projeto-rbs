import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { PortalAccount, PortalBrand } from "@/components/PortalHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarContextValue {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

const SIDEBAR_STORAGE_KEY = "pa_portal_sidebar_collapsed";

/** Classes for full link */
export const navItemClass =
  "group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm text-sidebar-muted transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

export const navItemActiveClass =
  "bg-sidebar-accent font-medium text-sidebar-accent-foreground";

/**
 * Enhanced navigation item that adapts when sidebar is collapsed by showing a tooltip on hover.
 */
export function NavItem({
  to,
  params,
  label,
  icon: Icon,
  exact = false,
  className,
}: {
  to: NonNullable<LinkProps["to"]>;
  params?: LinkProps["params"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  className?: string;
}) {
  const { isCollapsed } = useSidebar();

  const link = (
    <Link
      to={to}
      {...(params ? { params } : {})}
      activeOptions={{ exact }}
      className={cn(
        navItemClass,
        isCollapsed && "justify-center px-0",
        className,
      )}
      activeProps={{ className: navItemActiveClass }}
    >
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive ? "text-brand" : "text-sidebar-muted group-hover:text-sidebar-foreground",
            )}
          />
          {!isCollapsed && <span className="truncate">{label}</span>}
          {isCollapsed && <span className="sr-only">{label}</span>}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="bg-sidebar border-sidebar-border text-sidebar-foreground border text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

/**
 * Clickable item button for actions inside navigation groups.
 */
export function NavButton({
  label,
  icon: Icon,
  isActive = false,
  badge,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  badge?: ReactNode;
  onClick: () => void;
}) {
  const { isCollapsed } = useSidebar();

  const button = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        navItemClass,
        "w-full cursor-pointer text-left",
        isCollapsed && "justify-center px-0",
        isActive && navItemActiveClass,
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-brand" : "text-sidebar-muted group-hover:text-sidebar-foreground",
        )}
      />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge}
        </>
      )}
      {isCollapsed && <span className="sr-only">{label}</span>}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="bg-sidebar border-sidebar-border text-sidebar-foreground border text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

export function NavGroup({ label, children }: { label?: string; children: ReactNode }) {
  const { isCollapsed } = useSidebar();
  return (
    <div className="space-y-0.5">
      {label && !isCollapsed && <p className="text-sidebar-muted px-3 pb-1 pt-2 text-xs font-medium">{label}</p>}
      {isCollapsed && <div className="border-sidebar-border/60 my-2 border-t" />}
      {children}
    </div>
  );
}

function SidebarBody({ nav, isCollapsed, toggleCollapsed }: { nav: ReactNode; isCollapsed: boolean; toggleCollapsed: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center justify-between pb-3 pt-4", isCollapsed ? "justify-center px-2" : "px-4")}>
        <PortalBrand compact={isCollapsed} />
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Recolher menu lateral"
            title="Recolher menu lateral (Ctrl+B)"
            className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring grid h-8 w-8 cursor-pointer place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Expandir menu lateral"
            title="Expandir menu lateral (Ctrl+B)"
            className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring grid h-8 w-8 cursor-pointer place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      <nav aria-label="Navegação principal" className={cn("flex-1 space-y-4 overflow-y-auto pb-4", isCollapsed ? "px-2" : "px-3")}>
        {nav}
      </nav>

      <div className={cn("border-sidebar-border border-t py-3", isCollapsed ? "px-2" : "px-4")}>
        <PortalAccount compact={isCollapsed} />
      </div>
    </div>
  );
}

/**
 * Signed-in frame: collapsible sidebar on desktop, drawer on small screens.
 */
export function AppShell({ nav, mobileTitle, children }: { nav: ReactNode; mobileTitle?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "true") setIsCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  function toggleCollapsed() {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  // Keyboard shortcut Ctrl+B or Cmd+B
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleCollapsed }}>
      <TooltipProvider delayDuration={150}>
        <div className={cn("min-h-dvh transition-[padding] duration-200 ease-in-out", isCollapsed ? "lg:pl-16" : "lg:pl-64")}>
          <aside
            className={cn(
              "bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-30 hidden border-r transition-[width] duration-200 ease-in-out lg:block",
              isCollapsed ? "w-16" : "w-64",
            )}
          >
            <SidebarBody nav={nav} isCollapsed={isCollapsed} toggleCollapsed={toggleCollapsed} />
          </aside>

          <header className="bg-sidebar text-sidebar-foreground sticky top-0 z-30 flex h-14 items-center justify-between gap-3 px-4 lg:hidden">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Abrir menu"
                    className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring -ml-1.5 grid h-9 w-9 cursor-pointer place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  aria-describedby={undefined}
                  className="bg-sidebar text-sidebar-foreground border-sidebar-border w-72 p-0 sm:max-w-72 [&>button]:text-sidebar-muted [&>button]:right-3 [&>button]:top-5"
                  onClickCapture={(e) => {
                    if ((e.target as HTMLElement).closest("a")) setOpen(false);
                  }}
                >
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <SidebarBody nav={nav} isCollapsed={false} toggleCollapsed={() => {}} />
                </SheetContent>
              </Sheet>
              <div className="min-w-0 flex-1">
                {mobileTitle ? <p className="truncate text-[15px] font-semibold">{mobileTitle}</p> : <PortalBrand compact />}
              </div>
            </div>
            <ThemeToggle />
          </header>

          <main className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}
